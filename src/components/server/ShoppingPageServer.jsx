import { notFound } from "next/navigation";
import ShoppingCatalog from "@/components/ShoppingCatalog";
import { fetchItems, fetchJourneySteps, fetchStepCategories, fetchAttributeSchema } from "@/lib/api";

function resolveShoppingStep(steps = []) {
  return (
    steps.find((step) => String(step.slug || "").toLowerCase() === "shopping") ||
    steps.find((step) => String(step.title || "").trim().toLowerCase() === "shopping") ||
    steps.find((step) => {
      const title = String(step.title || "").toLowerCase();
      const slug = String(step.slug || "").toLowerCase();
      return title.includes("shopping") || slug.includes("shopping");
    }) ||
    null
  );
}

function parseNumber(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(String(v).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Parse a comma-separated list from the URL (e.g. `?occasion=Wedding,Party`).
 *  Shared by every attribute facet and the subcategory list. */
function parseCommaList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((v) => String(v).trim()).filter(Boolean);
  return String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Build the `{ key → string[] }` map of selected facet values from the
 *  search params. One param per facet key; a facet may also accept a legacy
 *  alias param (e.g. `fabric` → `fabric_material`) which is merged in. */
/** Filterable facets from the admin schema: every select / multiselect field,
 *  in schema order, with its admin-managed options. The customer filters are
 *  driven entirely by this — add a field in admin and it becomes a filter. */
function facetsFromSchema(schema) {
  const attrs = Array.isArray(schema?.attributes) ? schema.attributes : [];
  return attrs
    // select/multiselect fields the admin hasn't hidden from the filter bar
    // (filterable === false → admin unchecked "Show in filter bar").
    .filter((a) => (a.type === "select" || a.type === "multiselect") && a.filterable !== false)
    .map((a) => ({
      key: a.key,
      label: a.label || a.key,
      options: Array.isArray(a.options) ? a.options : [],
      ...(a.key === "fabric_material" ? { legacyParam: "fabric" } : {}),
    }));
}

function parseSelectedAttributes(sp, facets) {
  const out = {};
  for (const facet of facets || []) {
    const fromKey = parseCommaList(sp?.[facet.key]);
    const fromLegacy = facet.legacyParam ? parseCommaList(sp?.[facet.legacyParam]) : [];
    // Dedupe case-insensitively, first-seen casing wins.
    const seen = new Map();
    for (const v of [...fromKey, ...fromLegacy]) {
      const lower = v.toLowerCase();
      if (!seen.has(lower)) seen.set(lower, v);
    }
    const values = Array.from(seen.values());
    if (values.length) out[facet.key] = values;
  }
  return out;
}

export default async function ShoppingPageServer({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const search = (resolvedSearchParams?.search || "").trim();
  const categoryId = (resolvedSearchParams?.category || "").trim();
  const selectedSubcategoryIds = parseCommaList(resolvedSearchParams?.subcategory);
  const subSubcategoryId = (
    resolvedSearchParams?.subSubcategory ||
    resolvedSearchParams?.sub_subcategory ||
    ""
  ).trim();
  const minPrice = parseNumber(resolvedSearchParams?.minPrice);
  const maxPrice = parseNumber(resolvedSearchParams?.maxPrice);
  // "Shop for" gender facet — bride (women) / groom (men); "" = all.
  const audienceRaw = String(resolvedSearchParams?.audience || "").trim().toLowerCase();
  const selectedAudience = audienceRaw === "bride" || audienceRaw === "groom" ? audienceRaw : "";

  try {
    const steps = await fetchJourneySteps();
    const shoppingStep = resolveShoppingStep(steps);
    if (!shoppingStep) {
      notFound();
    }
    // Sub-sub filter only makes sense with exactly one subcategory picked.
    const effectiveSubSub = selectedSubcategoryIds.length === 1 ? subSubcategoryId : "";
    // Server filter by subcategory only when exactly one is picked; for
    // multi-select we fetch everything in the top category and filter
    // client-side, same pattern as fabric/price.
    const serverSubcategoryId =
      selectedSubcategoryIds.length === 1 ? selectedSubcategoryIds[0] : "";

    const [categories, itemsRes, schemaRes] = await Promise.all([
      fetchStepCategories(shoppingStep.slug),
      fetchItems(
        {
          journeyStepId: shoppingStep.step_id,
          ...(categoryId ? { categoryId } : {}),
          ...(serverSubcategoryId ? { subcategoryId: serverSubcategoryId } : {}),
          ...(effectiveSubSub ? { subSubcategoryId: effectiveSubSub } : {}),
          ...(search ? { search } : {}),
          limit: 500,
        },
        { cacheMode: "no-store" },
      ),
      // Admin-managed attribute schema → the filterable facets. A schema fetch
      // failure must NOT break the page (filters just fall back to none).
      fetchAttributeSchema(shoppingStep.slug).catch(() => null),
    ]);

    // Filters are driven entirely by the admin schema (list, order, options).
    const facets = facetsFromSchema(schemaRes?.schema);
    const selectedAttributes = parseSelectedAttributes(resolvedSearchParams, facets);

    return (
      <ShoppingCatalog
        step={shoppingStep}
        categories={categories}
        items={itemsRes.items || []}
        selectedCategoryId={resolvedSearchParams?.category || ""}
        selectedSubcategoryIds={selectedSubcategoryIds}
        selectedSubSubcategoryId={effectiveSubSub || ""}
        search={search}
        minPrice={minPrice}
        maxPrice={maxPrice}
        selectedAttributes={selectedAttributes}
        selectedAudience={selectedAudience}
        facets={facets}
      />
    );
  } catch {
    notFound();
  }
}

