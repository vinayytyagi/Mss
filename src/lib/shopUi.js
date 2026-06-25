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

/* ------------------------------------------------------------------ *
 * Schema-driven customer filters
 *
 * The admin owns the journey-step attribute schema (which fields exist,
 * their choices, and whether each shows "In filter bar"). The customer
 * filter UI is derived from that schema — NOT hardcoded — so any filter an
 * admin adds/removes auto-applies here. Server-side filtering is done by
 * passing `attrs` to GET /items (see ShoppingPageServer / JourneySlugPageServer).
 * ------------------------------------------------------------------ */

/** Distinct attribute values present across items for a given key (original casing kept, deduped case-insensitively). */
export function facetValuesFromItems(items, key) {
  const seen = new Map(); // lowercased -> original
  for (const it of Array.isArray(items) ? items : []) {
    const raw = it?.attributes?.[key];
    const vals = Array.isArray(raw) ? raw : raw == null || raw === "" ? [] : [raw];
    for (const v of vals) {
      const s = String(v).trim();
      if (!s) continue;
      const lc = s.toLowerCase();
      if (!seen.has(lc)) seen.set(lc, s);
    }
  }
  return [...seen.values()];
}

/**
 * Build customer filter facets from a journey-step attribute schema.
 * Only select / multiselect fields flagged filterable (filterable !== false)
 * become facets. Schema options come first (admin order); any extra values
 * found on the items are appended so legacy data still filters. Facets with
 * no options at all are dropped.
 *   facet: { key, label, type: "select" | "multiselect", options: string[] }
 */
export function facetsFromSchema(schema, items = []) {
  const fields = (schema?.attributes || []).filter(
    (f) => (f.type === "select" || f.type === "multiselect") && f.filterable !== false,
  );
  return fields
    .map((f) => {
      const schemaOpts = (Array.isArray(f.options) ? f.options : []).map(String).map((s) => s.trim()).filter(Boolean);
      const merged = [...schemaOpts];
      for (const v of facetValuesFromItems(items, f.key)) {
        if (!merged.some((o) => o.toLowerCase() === v.toLowerCase())) merged.push(v);
      }
      return { key: f.key, label: f.label || f.key, type: f.type, options: merged };
    })
    .filter((facet) => facet.options.length > 0);
}

/** Does an item's attribute[key] match any of the selected values (case-insensitive)? Empty selection = matches all. */
export function matchesAttribute(item, key, selectedValues) {
  const wanted = (Array.isArray(selectedValues) ? selectedValues : [selectedValues])
    .map((v) => String(v).trim().toLowerCase())
    .filter(Boolean);
  if (!wanted.length) return true;
  const raw = item?.attributes?.[key];
  const have = (Array.isArray(raw) ? raw : raw == null ? [] : [raw]).map((v) => String(v).trim().toLowerCase());
  return wanted.some((w) => have.includes(w));
}

/**
 * Parse selected attribute filters out of the URL search params, given the
 * known facet keys. Convention: one param per facet, `attr_<key>`, with
 * comma-separated values. Returns { key: string[] } (only non-empty).
 */
export function parseSelectedAttributes(searchParams = {}, facetKeys = []) {
  const out = {};
  for (const key of facetKeys) {
    const raw = searchParams?.[`attr_${key}`];
    if (raw == null) continue;
    const values = (Array.isArray(raw) ? raw.join(",") : String(raw))
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (values.length) out[key] = values;
  }
  return out;
}
