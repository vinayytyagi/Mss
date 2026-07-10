import { apiFetch } from "./apiClient";
import { ApiError } from "../httpErrors";

/**
 * Public blog endpoints (served by the admin app).
 * Listing/detail revalidate every 60s; homepage strip is no-store so
 * admin toggles show up promptly (same policy as the hero slideshow).
 */

export async function fetchBlogs({ page = 1, category = "", limit = 0 } = {}) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (category) params.set("category", category);
  if (limit > 0) params.set("limit", String(limit));
  const qs = params.toString();
  return apiFetch(`/blogs${qs ? `?${qs}` : ""}`, { cacheMode: "revalidate", revalidateSeconds: 60 });
}

/** Single live post, or null when the slug doesn't exist / isn't live. */
export async function fetchBlog(slug) {
  try {
    const data = await apiFetch(`/blogs/${encodeURIComponent(slug)}`, {
      cacheMode: "revalidate",
      revalidateSeconds: 60,
    });
    return data?.blog || null;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function fetchHomepageBlogs() {
  return apiFetch("/blogs/homepage", { cacheMode: "no-store" });
}
