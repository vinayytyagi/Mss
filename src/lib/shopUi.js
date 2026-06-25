export const fallbackImages = [
  "https://images.unsplash.com/photo-1525258946800-98cfd641d0de?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
];

export function formatCurrency(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** PDP-style label matching design mockups (Rs + grouped digits + 2 decimals). */
export function formatPriceDetailed(value) {
  const amount = Number(value || 0);
  const formatted = amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `Rs${formatted}`;
}

export function getItemImage(item, index = 0) {
  return item?.images?.[0] || fallbackImages[index % fallbackImages.length];
}

export function isProductItem(item) {
  return !item?.item_type || String(item.item_type).toLowerCase() === "product";
}

export function truncateText(value, maxLength = 90) {
  const text = String(value || "").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

/**
 * Attribute-driven facets for the /shopping sidebar.
 *
 * Ordered list of the most useful filterable shopping attributes (the
 * select / multiselect fields from the "shopping" step in
 * `mss-admin/src/lib/itemAttributesSchema.js` — never free text or numbers).
 * Each facet is rendered ONLY when the currently-loaded items have ≥2
 * distinct values for its key, so a category only ever shows the filters
 * that actually apply to it (Clothing → Fabric/Occasion/Work; Jewellery →
 * Purity/Stone; …). The URL carries one comma-list param per `key`.
 *
 * `fabric` is the legacy param alias for `fabric_material` (old links and
 * the search bar still work) — see `legacyParam`.
 */
export const SHOPPING_FACETS = Object.freeze([
  { key: "fabric_material", label: "Fabric / Material", legacyParam: "fabric" },
  { key: "occasion", label: "Occasion" },
  { key: "work_embroidery", label: "Work / Embroidery" },
  { key: "pieces_included", label: "Pieces" },
  { key: "purity", label: "Purity" },
  { key: "stone_type", label: "Stone" },
]);

/** All distinct attribute values for an item under `key`, trimmed. Handles
 *  both scalar string values and array (multiselect/tags) values. */
export function itemAttributeValues(item, key) {
  const raw = item?.attributes?.[key];
  if (typeof raw === "string") {
    const t = raw.trim();
    return t ? [t] : [];
  }
  if (Array.isArray(raw)) {
    return raw.map((v) => String(v).trim()).filter(Boolean);
  }
  return [];
}

/** Distinct values for `key` across `items`, deduped case-insensitively
 *  (first-seen casing wins), sorted alphabetically. Drives facet options. */
export function facetValuesFromItems(items, key) {
  const byLower = new Map();
  for (const item of items || []) {
    for (const v of itemAttributeValues(item, key)) {
      const lower = v.toLowerCase();
      if (!byLower.has(lower)) byLower.set(lower, v);
    }
  }
  return Array.from(byLower.values()).sort((a, b) => a.localeCompare(b));
}

/** True when `item` has at least one value for `key` that intersects
 *  `selectedValues` (case-insensitive). Items missing the attribute are
 *  EXCLUDED when the facet is active — matches the old fabric semantics. */
export function matchesAttribute(item, key, selectedValues) {
  if (!selectedValues?.length) return true;
  const values = itemAttributeValues(item, key);
  if (!values.length) return false;
  const wanted = new Set(selectedValues.map((v) => v.toLowerCase()));
  return values.some((v) => wanted.has(v.toLowerCase()));
}
