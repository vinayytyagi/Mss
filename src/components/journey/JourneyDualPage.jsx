"use client";

/**
 * JourneyDualPage — page mode for DUAL journey steps (catering, gifting).
 *
 * A tab shell with two ways to add to the quote basket:
 *   Tab 1 (product) — a vendor product listing rendered with the shared
 *     ProductCard. Each card adds a PRODUCT quote line locked to its
 *     vendor. (catering "Hire a chef" / gifting "Browse hampers")
 *   Tab 2 (package) — the admin-defined <SectionsBuilder> for this step's
 *     package mode_key (catering "quote" / gifting "build"), which adds a
 *     PACKAGE quote line (no vendor — admin routes it).
 *
 * Tab labels + the package mode_key come from JOURNEY_MODE via
 * dualConfig(slug) / packageModeKey(slug) so admin owns the wording.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, PackagePlus } from "lucide-react";
import JourneyStepStrip from "@/components/journey/JourneyStepStrip";
import JourneyStepNav from "@/components/journey/JourneyStepNav";
import TrustStrip from "@/components/journey/TrustStrip";
import ProductCard from "@/components/journey/ProductCard";
import SectionsBuilder from "@/components/journey/SectionsBuilder";
import BasketButton from "@/components/BasketButton";
import { getListingConfig, getTrustItems } from "@/lib/journeyStepUi";
import { dualConfig, packageModeKey } from "@/lib/journeyMode";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80";

function ProductGrid({ step, items, cardCfg }) {
  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) {
    return (
      <div className="rounded-3xl border border-border bg-surface px-6 py-24 text-center shadow-[0_28px_60px_rgba(15,23,42,0.06)]">
        <LayoutGrid className="mx-auto h-12 w-12 text-primary/50" strokeWidth={1.5} />
        <p className="mt-4 text-base font-semibold text-text">Nothing listed here yet</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          New options will show up here once vendors are added. Try the builder tab to get a custom quote.
        </p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((item) => (
        <ProductCard
          key={item.item_id}
          item={item}
          cardCfg={cardCfg}
          step={step}
          fallbackImage={FALLBACK_IMAGE}
          cartKind="quotation"
        />
      ))}
    </div>
  );
}

export default function JourneyDualPage({ steps, step, items }) {
  const router = useRouter();
  const dual = useMemo(() => dualConfig(step.slug), [step.slug]);
  const modeKey = useMemo(() => packageModeKey(step.slug), [step.slug]);
  const cardCfg = useMemo(() => getListingConfig(step.slug)?.card || null, [step.slug]);
  const trustItems = getTrustItems(step.slug);

  const [tab, setTab] = useState("product"); // "product" | "package"

  const activeIndex = Math.max(0, steps.findIndex((s) => s.step_id === step.step_id));
  const prevStep = activeIndex > 0 ? steps[activeIndex - 1] : null;
  const nextStep = activeIndex < steps.length - 1 ? steps[activeIndex + 1] : null;

  const productLabel = dual?.product?.label || "Browse";
  const packageLabel = dual?.package?.label || "Build your package";

  return (
    <div className="w-full px-4 py-8 mx-auto sm:px-6 lg:px-20">
      <JourneyStepStrip steps={steps} step={step} />
      <TrustStrip items={trustItems} />

      {/* Tab switcher: product listing vs package builder */}
      <div className="mx-auto mt-6 flex max-w-2xl overflow-hidden rounded-2xl border border-border bg-surface p-1 shadow-[0_12px_30px_rgba(0,0,0,0.03)]">
        <button
          type="button"
          onClick={() => setTab("product")}
          aria-pressed={tab === "product"}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
            tab === "product"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted hover:bg-surface-muted"
          }`}
        >
          <LayoutGrid className="h-4 w-4" />
          {productLabel}
        </button>
        <button
          type="button"
          onClick={() => setTab("package")}
          aria-pressed={tab === "package"}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
            tab === "package"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted hover:bg-surface-muted"
          }`}
        >
          <PackagePlus className="h-4 w-4" />
          {packageLabel}
        </button>
      </div>

      <JourneyStepNav
        prevHref={prevStep ? `/journey/${prevStep.slug}` : null}
        nextHref={nextStep ? `/journey/${nextStep.slug}` : "/cart?tab=quotation"}
        nextIsCart={!nextStep}
      >
        {tab === "product" ? (
          <ProductGrid step={step} items={items} cardCfg={cardCfg} />
        ) : (
          <SectionsBuilder
            step={step}
            slug={step.slug}
            modeKey={modeKey}
            onAdded={() => router.refresh()}
          />
        )}
      </JourneyStepNav>

      <BasketButton floating />
    </div>
  );
}
