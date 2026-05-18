import { notFound } from "next/navigation";
import ShoppingCatalog from "@/components/ShoppingCatalog";
import { fetchItems, fetchJourneySteps, fetchStepCategories } from "@/lib/api";

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

function parseFabricList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((v) => String(v).trim()).filter(Boolean);
  return String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default async function ShoppingPageServer({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const search = (resolvedSearchParams?.search || "").trim();
  const categoryId = (resolvedSearchParams?.category || "").trim();
  const subcategoryId = (resolvedSearchParams?.subcategory || "").trim();
  const subSubcategoryId = (
    resolvedSearchParams?.subSubcategory ||
    resolvedSearchParams?.sub_subcategory ||
    ""
  ).trim();
  const minPrice = parseNumber(resolvedSearchParams?.minPrice);
  const maxPrice = parseNumber(resolvedSearchParams?.maxPrice);
  const selectedFabrics = parseFabricList(resolvedSearchParams?.fabric);

  try {
    const steps = await fetchJourneySteps();
    const shoppingStep = resolveShoppingStep(steps);
    if (!shoppingStep) {
      notFound();
    }
    const [categories, itemsRes] = await Promise.all([
      fetchStepCategories(shoppingStep.slug),
      fetchItems(
        {
          journeyStepId: shoppingStep.step_id,
          ...(categoryId ? { categoryId } : {}),
          ...(subcategoryId ? { subcategoryId } : {}),
          ...(subSubcategoryId ? { subSubcategoryId } : {}),
          ...(search ? { search } : {}),
          limit: 500,
        },
        { cacheMode: "no-store" },
      ),
    ]);

    return (
      <ShoppingCatalog
        step={shoppingStep}
        categories={categories}
        items={itemsRes.items || []}
        selectedCategoryId={resolvedSearchParams?.category || ""}
        selectedSubcategoryId={resolvedSearchParams?.subcategory || ""}
        selectedSubSubcategoryId={subSubcategoryId || ""}
        search={search}
        minPrice={minPrice}
        maxPrice={maxPrice}
        selectedFabrics={selectedFabrics}
      />
    );
  } catch {
    notFound();
  }
}

