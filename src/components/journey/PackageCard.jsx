"use client";

/**
 * PackageCard — the shared package card for "package" journey steps whose
 * mockups show tier-comparison cards with include/exclude feature
 * matrices (photography, makeup & mehndi).
 *
 * Styled to match ProductCard (same radius, shadow, lift-on-hover, image
 * header with overlays, price/"Custom quote" semantics and CTA wiring into
 * the quotation cart) so the two card surfaces feel like one system.
 *
 * Props:
 *   item    — full catalog item
 *   groups  — [{ title, rows:[{label, included}] }] feature matrix
 *   ribbon  — optional corner ribbon text ("Most Popular" / "20% OFF")
 */

import { useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, MapPin, Package, Plus, Sparkles, Star, X } from "lucide-react";
import { addToCart } from "@/lib/cartStore";
import { resolveRating } from "@/lib/itemUiHelpers";
import { formatINR } from "@/lib/journeyStepUi";
import { safeCssUrl } from "@/lib/utils";

const FALLBACK_IMAGE =""

  // "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=900&q=80";

export default function PackageCard({ item, groups = [], ribbon }) {
  const [justAdded, setJustAdded] = useState(false);
  const timer = useRef(null);

  if (!item) return null;

  const rating = resolveRating(item);
  const finalPrice = Number(item.final_price ?? item.price ?? 0);
  const basePrice = Number(item.price ?? 0);
  const hasDiscount = item.is_discount_active && Number(item.discount_percentage) > 0;
  const priceText = formatINR(finalPrice); // null → "Custom quote"

  const image =
    (Array.isArray(item.images) && item.images.length ? item.images[0] : null) || FALLBACK_IMAGE;
  const locationStr = [item.location_city, item.location_state].filter(Boolean).join(", ");

  // Count how many features are included across all groups for a quick badge.
  const includedCount = groups.reduce(
    (n, g) => n + (g.rows || []).filter((r) => r.included).length,
    0,
  );

  function handleAdd(e) {
    e.preventDefault();
    e.stopPropagation();
    addToCart("quotation", item, 1);
    toast.success("Added to Quote cart", { description: item.name });
    setJustAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setJustAdded(false), 1600);
  }

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-[0_4px_18px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_18px_44px_rgba(15,23,42,0.12)]">
      {/* Image header with overlays */}
      <Link
        href={`/items/${item.item_id}`}
        className="relative block aspect-4/3 w-full shrink-0 overflow-hidden bg-surface-muted"
      >
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage: safeCssUrl(image) }}
          role="img"
          aria-label={item.name}
        />
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.04),inset_0_-20px_40px_-20px_rgba(15,23,42,0.18)]" />

        {/* Package pill (top-left) */}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-surface/95 px-2.5 py-1 text-[11px] font-semibold text-primary shadow-sm backdrop-blur-sm">
          <Package className="h-3.5 w-3.5" aria-hidden />
          Package
        </span>

        {/* Ribbon (top-right) — discount or "Most Popular" */}
        {ribbon ? (
          <span className="absolute right-3 top-3 rounded-md bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground shadow-sm">
            {ribbon}
          </span>
        ) : null}
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link href={`/items/${item.item_id}`} className="block">
          <h3 className="line-clamp-2 text-base font-bold leading-snug text-text-strong">
            {item.name}
          </h3>
        </Link>

        {item.description ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted">{item.description}</p>
        ) : null}

        {/* Rating + location row */}
        {rating || locationStr ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            {rating ? (
              <span className="inline-flex items-center gap-1 font-semibold text-text">
                <Star className="h-3.5 w-3.5 text-warning" fill="currentColor" strokeWidth={2} />
                {rating.value.toFixed(1)}
                <span className="font-medium text-muted">({rating.count})</span>
              </span>
            ) : null}
            {locationStr ? (
              <span className="inline-flex min-w-0 items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                <span className="truncate">{locationStr}</span>
              </span>
            ) : null}
          </div>
        ) : null}

        {/* Included-features badge */}
        {includedCount ? (
          <div className="flex items-center gap-1.5 text-xs font-medium text-success">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {includedCount} feature{includedCount === 1 ? "" : "s"} included
          </div>
        ) : null}

        {/* Feature matrix */}
        <div className="mt-1 flex-1 space-y-3">
          {groups.map((group) =>
            group.rows.length ? (
              <div key={group.title}>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  {group.title}
                </p>
                <ul className="space-y-1.5">
                  {group.rows.map((row, i) => (
                    <li
                      key={`${row.label}-${i}`}
                      className={`flex items-start gap-2 text-xs ${
                        row.included
                          ? "text-text"
                          : "text-subtle line-through decoration-border-strong"
                      }`}
                    >
                      {row.included ? (
                        <Check
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success"
                          strokeWidth={3}
                        />
                      ) : (
                        <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-border-strong" strokeWidth={3} />
                      )}
                      <span>{row.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
        </div>

        {/* Footer — price | CTA */}
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-2">
              {priceText ? (
                <>
                  <span className="text-lg font-bold text-text transition-colors duration-300 group-hover:text-primary-hover">
                    {priceText}
                  </span>
                  {hasDiscount && basePrice > finalPrice ? (
                    <span className="text-xs text-muted line-through">{formatINR(basePrice)}</span>
                  ) : null}
                </>
              ) : (
                <span className="text-base font-bold text-primary">Custom quote</span>
              )}
            </div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-subtle">
              {priceText ? "Starting from" : "Tailored to your event"}
            </div>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={justAdded}
            aria-label={justAdded ? "Added" : "Add to Quote cart"}
            aria-pressed={justAdded}
            className={[
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold shadow-sm transition-all duration-300 transform-gpu",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              justAdded
                ? "scale-105 bg-success text-primary-foreground shadow-[0_8px_22px_rgba(34,197,94,0.35)]"
                : "bg-primary text-primary-foreground shadow-[0_6px_16px_rgba(255,79,134,0.25)] hover:bg-primary-hover hover:shadow-[0_10px_24px_rgba(255,79,134,0.4)] active:scale-95",
            ].join(" ")}
          >
            {justAdded ? (
              <Check className="h-3.5 w-3.5 animate-in zoom-in-50 duration-300" strokeWidth={3} aria-hidden />
            ) : (
              <Plus
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-90"
                aria-hidden
              />
            )}
            <span>{justAdded ? "Added" : "Add to Quote cart"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
