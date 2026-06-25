"use client";

/**
 * JourneySectionsPage — page mode for SECTIONS journey steps
 * (wedding-invitation / streedhan / pagfera / honeymoon).
 *
 * These steps used to be "we'll call you" enquiry forms; they now render
 * the admin-defined <SectionsBuilder>, which assembles the customer's
 * selection into a PACKAGE quote-cart line (no vendor — admin routes it).
 * The shared step strip + prev/next nav chrome is reused so the page
 * lines up with every other journey step.
 */

import { useRouter } from "next/navigation";
import JourneyStepStrip from "@/components/journey/JourneyStepStrip";
import JourneyStepNav from "@/components/journey/JourneyStepNav";
import TrustStrip from "@/components/journey/TrustStrip";
import SectionsBuilder from "@/components/journey/SectionsBuilder";
import BasketButton from "@/components/BasketButton";
import { resolveTrustItems } from "@/lib/journeyStepUi";

export default function JourneySectionsPage({ steps, step }) {
  const router = useRouter();
  const trustItems = resolveTrustItems(step);

  const activeIndex = Math.max(0, steps.findIndex((s) => s.step_id === step.step_id));
  const prevStep = activeIndex > 0 ? steps[activeIndex - 1] : null;
  const nextStep = activeIndex < steps.length - 1 ? steps[activeIndex + 1] : null;

  return (
    <div className="w-full px-4 py-8 mx-auto sm:px-6 lg:px-20">
      <JourneyStepStrip steps={steps} step={step} />
      <TrustStrip items={trustItems} />

      <JourneyStepNav
        prevHref={prevStep ? `/journey/${prevStep.slug}` : null}
        nextHref={nextStep ? `/journey/${nextStep.slug}` : "/cart?tab=quotation"}
        nextIsCart={!nextStep}
      >
        <SectionsBuilder
          step={step}
          slug={step.slug}
          onAdded={() => router.refresh()}
        />
      </JourneyStepNav>

      <BasketButton floating />
    </div>
  );
}
