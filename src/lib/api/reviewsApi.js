import { apiFetch, apiPost, withAuthHeaders } from "./apiClient";
import { getAuthToken } from "@/lib/authCookies";

export async function fetchItemReviews(itemId, { page = 1, limit = 10, sort = "newest" } = {}) {
  const qs = new URLSearchParams();
  if (page) qs.set("page", String(page));
  if (limit) qs.set("limit", String(limit));
  if (sort) qs.set("sort", String(sort));

  const token = getAuthToken();
  const headers = token ? withAuthHeaders(token) : undefined;

  return apiFetch(`/items/${encodeURIComponent(itemId)}/reviews?${qs.toString()}`, {
    cacheMode: "no-store",
    ...(headers ? { headers } : {}),
  });
}

export async function upsertMyItemReview(itemId, { rating, comment }) {
  const token = getAuthToken();
  if (!token) {
    const err = new Error("Login required");
    err.code = "UNAUTHORIZED";
    throw err;
  }
  return apiPost(`/items/${encodeURIComponent(itemId)}/reviews`, {
    payload: { rating, comment },
    headers: withAuthHeaders(token),
    cacheMode: "no-store",
  });
}

export async function deleteMyItemReview(itemId) {
  const token = getAuthToken();
  if (!token) {
    const err = new Error("Login required");
    err.code = "UNAUTHORIZED";
    throw err;
  }
  return apiFetch(`/items/${encodeURIComponent(itemId)}/reviews`, {
    method: "DELETE",
    headers: withAuthHeaders(token),
    cacheMode: "no-store",
  });
}

