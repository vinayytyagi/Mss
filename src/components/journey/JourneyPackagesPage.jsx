"use client";

/**
 * JourneyPackagesPage — page mode for "package" journey steps whose
 * mockups show tier-comparison cards (photography, makeup & mehndi).
 *
 * For steps configured as the "tiers" builder in journeyMode (photography,
 * makeup-and-mehndi) the body is the admin-defined TiersBuilder — it fetches
 * the package definition, renders selectable tier cards + add-ons + detail
 * fields and adds a PACKAGE line to the quote cart. Older attribute-derived
 * package steps fall back to the catalog PackageCard comparison grid.
 */

import Link from "next/link";
import JourneyStepStrip from "@/components/journey/JourneyStepStrip";
import JourneyStepNav from "@/components/journey/JourneyStepNav";
import TrustStrip from "@/components/journey/TrustStrip";
import PackageCard from "@/components/journey/PackageCard";
import TiersBuilder from "@/components/journey/TiersBuilder";
import BasketButton from "@/components/BasketButton";
import { getPackagesConfig, getTrustItems } from "@/lib/journeyStepUi";
import { builderType } from "@/lib/journeyMode";

export default function JourneyPackagesPage({
  steps,
  step,
  categories,
  items,
  selectedCategoryId = "",
  selectedCategorySlug = "",
}) {
  const config = getPackagesConfig(step.slug);
  const trustItems = getTrustItems(step.slug);
  // Tiers steps (photography, makeup-and-mehndi) render the admin-defined
  // TiersBuilder; its tabs/tiers come from the package definition API, so we
  // skip the catalog grid and the category-tab strip for them.
  const isTiers = builderType(step.slug) === "tiers";

  const activeIndex = Math.max(0, steps.findIndex((s) => s.step_id === step.step_id));
  const prevStep = activeIndex > 0 ? steps[activeIndex - 1] : null;
  const nextStep = activeIndex < steps.length - 1 ? steps[activeIndex + 1] : null;

  const topCategories = (categories || []).filter((c) => !c.parent_category_id);
  const activeCategoryId =
    selectedCategoryId || (topCategories[0] ? topCategories[0].category_id : "");

  const list = Array.isArray(items) ? items : [];

  function categoryHref(c) {
    const seg = String(c.slug || "").trim() || c.category_id;
    return `/journey/${step.slug}?category=${encodeURIComponent(seg)}`;
  }

  return (
    <div className="w-full px-4 py-8 mx-auto sm:px-6 lg:px-20">
      <JourneyStepStrip steps={steps} step={step} />
      <TrustStrip items={trustItems} />

      {/* Service-type tabs (mockup: "Bridal Makeup | Mehndi") */}
      {!isTiers && topCategories.length > 1 ? (
        <div className="mx-auto mt-6 flex max-w-2xl overflow-hidden rounded-2xl border border-border bg-surface p-1 shadow-[0_12px_30px_rgba(0,0,0,0.03)]">
          {topCategories.map((c) => {
            const active = c.category_id === activeCategoryId;
            return (
              <Link
                key={c.category_id}
                href={categoryHref(c)}
                className={`flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-bold transition-all ${
                  active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted hover:bg-surface-muted"
                }`}
              >
                {c.name}
              </Link>
            );
          })}
        </div>
      ) : null}

      <JourneyStepNav
        prevHref={prevStep ? `/journey/${prevStep.slug}` : null}
        nextHref={nextStep ? `/journey/${nextStep.slug}` : "/cart?tab=quotation"}
        nextIsCart={!nextStep}
      >
          {isTiers ? (
            <TiersBuilder
              slug={step.slug}
              journeyStepId={step.step_id}
              journeyTitle={step.name || step.title || ""}
            />
          ) : list.length ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {list.map((item, index) => (
                <PackageCard
                  key={item.item_id}
                  item={item}
                  groups={(config?.groups || []).map((g) => ({ title: g.title, rows: g.rows(item) }))}
                  ribbon={
                    item.is_discount_active && Number(item.discount_percentage) > 0
                      ? `${item.discount_percentage}% OFF`
                      : index === 0
                        ? "Most Popular"
                        : null
                  }
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] border border-border bg-surface px-6 py-32 text-center shadow-[0_28px_60px_rgba(15,23,42,0.06)]">
              <p className="text-base font-semibold text-text">No packages in this step yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                Check back soon — new packages will show up here once they are added.
              </p>
            </div>
          )}
      </JourneyStepNav>

      <BasketButton floating />
    </div>
  );
}
