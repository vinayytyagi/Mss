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

export default async function ShoppingPageServer({ searchParams }) {
  const resolvedSearchParams = await searchParams;

  try {
    const steps = await fetchJourneySteps();
    const shoppingStep = resolveShoppingStep(steps);
    if (!shoppingStep) {
      notFound();
    }
    const [categories, itemsRes] = await Promise.all([
      fetchStepCategories(shoppingStep.slug),
      fetchItems({ journeyStepId: shoppingStep.step_id, limit: 100 }),
    ]);

    return (
      <ShoppingCatalog
        step={shoppingStep}
        categories={categories}
        items={itemsRes.items || []}
        selectedCategoryId={resolvedSearchParams?.category || ""}
        selectedSubcategoryId={resolvedSearchParams?.subcategory || ""}
      />
    );
  } catch {
    notFound();
  }
}

