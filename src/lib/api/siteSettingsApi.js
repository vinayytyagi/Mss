import { apiFetch } from "./apiClient";

/** No-store so homepage picks up admin slideshow changes without long stale cache. */
export async function fetchHeroSlideshow() {
  return apiFetch("/hero-slideshow", { cacheMode: "no-store" });
}

/**
 * Admin-managed size-chart tables for the customer /size-chart page.
 * No-store so admin edits show up promptly. Returns { heading, intro, tables }.
 */
export async function fetchSizeChart() {
  return apiFetch("/size-chart", { cacheMode: "no-store" });
}

/**
 * Public global feature toggles (reviews submit, refund visibility, replacement).
 * Falls back to safe defaults if the endpoint is unreachable so the storefront
 * never breaks on a config fetch.
 */
export async function fetchSiteConfig() {
  try {
    const cfg = await apiFetch("/site-config", { cacheMode: "no-store" });
    const reviewsMode = ["enabled", "readonly", "disabled"].includes(cfg?.reviews_mode)
      ? cfg.reviews_mode
      : "enabled";
    return {
      reviews_mode: reviewsMode,
      // Keep the legacy boolean strictly derived from the mode so the two can
      // never drift (contract: reviews_submit_enabled === mode "enabled").
      reviews_submit_enabled: reviewsMode === "enabled",
      refund_visible: cfg?.refund_visible === true,
      replacement_enabled: cfg?.replacement_enabled !== false,
    };
  } catch {
    return {
      reviews_mode: "enabled",
      reviews_submit_enabled: true,
      refund_visible: false,
      replacement_enabled: true,
    };
  }
}
