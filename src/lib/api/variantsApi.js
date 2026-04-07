import { apiFetch } from "./apiClient";

export async function fetchItemVariants(itemId) {
  return apiFetch(`/items/${encodeURIComponent(itemId)}/variants`, {
    cacheMode: "no-store",
  });
}

