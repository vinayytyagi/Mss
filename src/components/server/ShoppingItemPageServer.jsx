import { notFound } from "next/navigation";
import ShoppingProductDetail from "@/components/ShoppingProductDetail";
import { fetchItem, fetchItems, fetchJourneySteps, fetchStepCategories } from "@/lib/api";
import { isProductItem } from "@/lib/shopUi";

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

export default async function ShoppingItemPageServer({ params }) {
  let item;
  let categories;
  let relatedItems;

  try {
    const { itemId } = await params;
    const steps = await fetchJourneySteps();
    const shoppingStep = resolveShoppingStep(steps);
    if (!shoppingStep) {
      notFound();
    }
    item = await fetchItem(itemId);
    if (item.journey_step_id !== shoppingStep.step_id) {
      notFound();
    }
    const [nextCategories, relatedRes] = await Promise.all([
      fetchStepCategories(shoppingStep.slug),
      fetchItems({ journeyStepId: shoppingStep.step_id, categoryId: item.category_id, limit: 100 }),
    ]);

    categories = nextCategories;
    relatedItems = (relatedRes.items || [])
      .filter(isProductItem)
      .filter((relatedItem) => relatedItem.item_id !== item.item_id)
      .filter((relatedItem) => {
        if (item.subcategory_id) return relatedItem.subcategory_id === item.subcategory_id;
        return relatedItem.category_id === item.category_id;
      })
      .slice(0, 4);
  } catch {
    notFound();
  }

  return <ShoppingProductDetail item={item} categories={categories} relatedItems={relatedItems} />;
}

