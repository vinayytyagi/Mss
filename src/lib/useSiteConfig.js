"use client";

/**
 * useSiteConfig — tiny client hook for the public global site config.
 *
 * Fetches `/api/v1/site-config` exactly once per page load (the underlying
 * promise is cached in module scope), so every card/PDP/reviews section that
 * needs a feature toggle shares a single network request.
 *
 * SSR-safe: during the server render (and the very first client render before
 * the effect runs) it returns sensible defaults so nothing flashes/breaks.
 *
 * Shape: returns `{ config }` where config has at least:
 *   reviews_mode: "enabled" | "readonly" | "disabled"
 *   reviews_submit_enabled: boolean   (legacy, kept in sync)
 *
 * `reviews_mode` is derived defensively from the raw doc so this works whether
 * or not the API has been upgraded to emit the field:
 *   - explicit "enabled" | "readonly" | "disabled" wins
 *   - otherwise fall back to the legacy boolean: true -> "enabled", else "readonly"
 */

import { useEffect, useState } from "react";
import { fetchSiteConfig } from "@/lib/api/siteSettingsApi";

const REVIEW_MODES = new Set(["enabled", "readonly", "disabled"]);

// Safe defaults used during SSR and while the fetch is in flight. Defaulting
// reviews_mode to "enabled" matches the shared customer fallback contract.
export const DEFAULT_SITE_CONFIG = {
  reviews_mode: "enabled",
  reviews_submit_enabled: true,
  refund_visible: false,
  replacement_enabled: true,
};

// Normalize a raw site-config payload into a stable shape, deriving
// reviews_mode from the legacy boolean when the field is absent.
function normalizeConfig(cfg) {
  const raw = cfg || {};
  const mode = String(raw.reviews_mode || "").toLowerCase();
  const reviews_mode = REVIEW_MODES.has(mode)
    ? mode
    : raw.reviews_submit_enabled === true
      ? "enabled"
      : "readonly";
  return {
    ...DEFAULT_SITE_CONFIG,
    ...raw,
    reviews_mode,
    reviews_submit_enabled: reviews_mode === "enabled",
  };
}

// Module-scoped cache: one in-flight promise, reused across all consumers.
let cachedPromise = null;

function loadSiteConfig() {
  if (!cachedPromise) {
    cachedPromise = fetchSiteConfig()
      .then((cfg) => normalizeConfig(cfg))
      .catch(() => {
        // Drop the cache so a later mount can retry, but resolve to defaults
        // for the current consumers so the UI stays graceful.
        cachedPromise = null;
        return { ...DEFAULT_SITE_CONFIG };
      });
  }
  return cachedPromise;
}

export default function useSiteConfig() {
  const [config, setConfig] = useState(DEFAULT_SITE_CONFIG);

  useEffect(() => {
    let cancelled = false;
    loadSiteConfig().then((cfg) => {
      if (!cancelled) setConfig(cfg);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { config };
}
