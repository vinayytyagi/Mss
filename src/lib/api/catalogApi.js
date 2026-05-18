import { apiFetch } from "./apiClient";

export async function fetchJourneySteps() {
  return apiFetch("/journey-steps", { revalidateSeconds: 60 });
}

export async function fetchJourneyStep(stepIdOrSlug) {
  return apiFetch(`/journey-steps/${encodeURIComponent(stepIdOrSlug)}`, { revalidateSeconds: 60 });
}

export async function fetchStepCategories(stepIdOrSlug, parentCategoryId) {
  const qs = new URLSearchParams();
  if (parentCategoryId !== undefined && parentCategoryId !== null) {
    // Empty string is meaningful here — it means "top-level only".
    qs.set("parentCategoryId", String(parentCategoryId));
  }
  const tail = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch(`/journey-steps/${encodeURIComponent(stepIdOrSlug)}/categories${tail}`, {
    revalidateSeconds: 60,
  });
}

/**
 * Item filter params:
 *   - journeyStepId           (string)
 *   - categoryId / categorySlug
 *   - subcategoryId / subcategorySlug
 *   - subSubcategoryId        (3rd-level filter; backend Phase A added support)
 *   - search, limit, page, …
 */
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

export async function fetchItemVariants(itemId) {
  if (!itemId) return null;
  try {
    return await apiFetch(`/items/${encodeURIComponent(itemId)}/variants`, {
      revalidateSeconds: 60,
    });
  } catch {
    return null;
  }
}

export async function fetchAttributeSchema(stepSlug) {
  if (!stepSlug) return null;
  try {
    return await apiFetch(`/items/attribute-schema?stepSlug=${encodeURIComponent(stepSlug)}`, {
      revalidateSeconds: 300,
    });
  } catch {
    return null;
  }
}
