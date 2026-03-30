import { notFound } from "next/navigation";
import JourneyStepPage from "@/components/JourneyStepPage";
import { fetchItems, fetchJourneyStep, fetchJourneySteps, fetchStepCategories } from "@/lib/api";
import { getAuthUserServer } from "@/lib/authCookiesServer";

function getStepBudgetCap(user, stepId, defaultBudget) {
  const allocations = Array.isArray(user?.onboarding?.budget_allocations)
    ? user.onboarding.budget_allocations
    : [];
  const current = allocations.find((a) => a.step_id === stepId);
  const raw = current?.amount ?? defaultBudget ?? 0;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function categoryUrlSegment(c) {
  if (!c) return "";
  const s = String(c.slug || "").trim();
  return s || c.category_id || "";
}

function resolveJourneyCategorySelection(categories, categoryParam, subcategoryParam) {
  const tops = categories.filter((c) => !c.parent_category_id);
  const p = String(categoryParam || "").trim();
  let cat = null;
  if (p) {
    if (/^[a-f\d]{24}$/i.test(p)) cat = tops.find((c) => c.category_id === p) || null;
    if (!cat) cat = tops.find((c) => String(c.slug || "").trim().toLowerCase() === p.toLowerCase()) || null;
    if (!cat) cat = tops.find((c) => c.category_id === p) || null;
  }
  if (!cat) cat = tops[0] || null;

  const sp = String(subcategoryParam || "").trim();
  let sub = null;
  if (sp && cat) {
    const subs = categories.filter((c) => c.parent_category_id === cat.category_id);
    if (/^[a-f\d]{24}$/i.test(sp)) sub = subs.find((c) => c.category_id === sp) || null;
    if (!sub) sub = subs.find((c) => String(c.slug || "").trim().toLowerCase() === sp.toLowerCase()) || null;
    if (!sub) sub = subs.find((c) => c.category_id === sp) || null;
  }

  return {
    effectiveCategoryId: cat?.category_id || "",
    effectiveSubcategoryId: sub?.category_id || "",
    selectedCategorySlug: categoryUrlSegment(cat),
    selectedSubcategorySlug: sub ? categoryUrlSegment(sub) : "",
  };
}

export default async function JourneySlugPageServer({ params, searchParams }) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;

  let step;
  try {
    step = await fetchJourneyStep(slug);
  } catch {
    notFound();
  }

  const categoryParam = resolvedSearchParams?.category || "";
  const subcategoryParam = resolvedSearchParams?.subcategory || resolvedSearchParams?.subcategory_id || "";
  const search = (resolvedSearchParams?.search || "").trim();

  const budgetRaw = resolvedSearchParams?.budget;
  const budgetTrimmed =
    budgetRaw !== undefined && budgetRaw !== null ? String(budgetRaw).trim() : "";
  const capOff = String(resolvedSearchParams?.cap || "").toLowerCase() === "off";

  /** When set, this exact value is echoed in client links (?budget=) so filters stay in sync with the URL. */
  let budgetQueryValue = undefined;
  let appliedBudgetCap = null;

  if (capOff) {
    appliedBudgetCap = null;
    budgetQueryValue = undefined;
  } else if (budgetTrimmed !== "") {
    const n = Number(budgetTrimmed);
    if (Number.isFinite(n)) {
      budgetQueryValue = Math.max(0, Math.round(n));
      if (budgetQueryValue > 0) {
        appliedBudgetCap = budgetQueryValue;
      } else if (budgetQueryValue === 0) {
        appliedBudgetCap = 0;
      }
    }
  } else {
    const user = await getAuthUserServer();
    const budgetCap = getStepBudgetCap(user, step.step_id, step.default_budget);
    appliedBudgetCap = budgetCap > 0 ? budgetCap : null;
  }

  const [steps, categories] = await Promise.all([
    fetchJourneySteps(),
    fetchStepCategories(slug),
  ]);

  const sel = resolveJourneyCategorySelection(categories, categoryParam, subcategoryParam);

  const itemsRes = await fetchItems(
    {
      journeyStepId: step.step_id,
      ...(sel.selectedCategorySlug ? { categorySlug: sel.selectedCategorySlug } : {}),
      ...(sel.selectedSubcategorySlug ? { subcategorySlug: sel.selectedSubcategorySlug } : {}),
      ...(search ? { search } : {}),
      ...(appliedBudgetCap != null ? { maxFinalPrice: appliedBudgetCap } : {}),
      limit: 500,
    },
    { cacheMode: "no-store" },
  );

  return (
    <main>
      <JourneyStepPage
        steps={steps}
        step={step}
        categories={categories}
        items={itemsRes.items || []}
        selectedCategoryId={sel.effectiveCategoryId}
        selectedSubcategoryId={sel.effectiveSubcategoryId}
        selectedCategorySlug={sel.selectedCategorySlug}
        selectedSubcategorySlug={sel.selectedSubcategorySlug}
        search={search}
        appliedBudgetCap={appliedBudgetCap}
        budgetQueryValue={budgetQueryValue}
        capOffActive={capOff}
      />
    </main>
  );
}
