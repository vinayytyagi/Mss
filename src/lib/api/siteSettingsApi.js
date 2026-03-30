import { apiFetch } from "./apiClient";

/** No-store so homepage picks up admin slideshow changes without long stale cache. */
export async function fetchHeroSlideshow() {
  return apiFetch("/hero-slideshow", { cacheMode: "no-store" });
}
