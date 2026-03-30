import { apiFetch } from "./apiClient";

export async function fetchJourneySteps() {
  return apiFetch("/journey-steps", { revalidateSeconds: 60 });
}

export async function fetchJourneyStep(stepIdOrSlug) {
  return apiFetch(`/journey-steps/${encodeURIComponent(stepIdOrSlug)}`, { revalidateSeconds: 60 });
}

export async function fetchStepCategories(stepIdOrSlug) {
  return apiFetch(`/journey-steps/${encodeURIComponent(stepIdOrSlug)}/categories`, { revalidateSeconds: 60 });
}

export async function fetchItems(params = {}, fetchOptions = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      qs.set(key, String(value));
    }
  });

  const path = `/items${qs.toString() ? `?${qs.toString()}` : ""}`;
  return apiFetch(path, {
    revalidateSeconds: 60,
    ...fetchOptions,
  });
}

export async function fetchItem(itemId) {
  return apiFetch(`/items/${encodeURIComponent(itemId)}`, { revalidateSeconds: 60 });
}
