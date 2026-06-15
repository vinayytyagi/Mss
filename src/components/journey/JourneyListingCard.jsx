"use client";

/**
 * JourneyListingCard — thin compatibility wrapper around the shared
 * ProductCard for mockup-style listing steps (venue / decor / catering /
 * gifting). The per-step field recipe still comes from
 * getListingConfig(slug).card in lib/journeyStepUi.js:
 *
 *   badge(item)   — colored pill overlaid top-left on the image
 *   subtitle(item)— optional line under the name (decor: theme · palette)
 *   chips(item)   — grey spec tag row (venue type, capacity, amenities…)
 *   stats(item)   — 3-column inset metrics block (Per plate / Capacity…)
 *   priceLabel / pricePrefix / priceCaption — price semantics
 *   ctaLabel      — basket CTA wording ("Add to basket" / "I want this")
 *
 * All rendering now lives in ProductCard so every listing step shares one
 * consistent card surface; this file just maps the listing config onto it
 * and keeps the existing call sites (JourneyStepPage) working unchanged.
 */

import ProductCard from "@/components/journey/ProductCard";

export default function JourneyListingCard({ item, cardCfg, fallbackImage, captureDetails = false }) {
  if (!item || !cardCfg) return null;
  return (
    <ProductCard
      item={item}
      cardCfg={cardCfg}
      fallbackImage={fallbackImage}
      cartKind="quotation"
      captureDetails={captureDetails}
    />
  );
}
