"use client";

/**
 * ProductCard — the single, polished product card used across every
 * journey listing step (venue / decor / catering / gifting / shopping)
 * and anywhere a vendor-listed item is shown in a grid.
 *
 * It unifies the two card styles that used to exist side-by-side
 * (ItemCardV2 + JourneyListingCard) into one consistent surface:
 *   • image with overlaid category/spec badge + discount + wishlist
 *   • title + rating + location
 *   • meta chips (spec tags) and/or smart highlight bullets
 *   • optional 3-column stats block (per-plate / capacity …)
 *   • price OR a "Custom quote" fallback when no price is set
 *   • a clear, consistent CTA wired to the quote/shopping cart
 *
 * Two ways to feed it:
 *   1. Generic — pass `highlights`, `vendorName`, `whiteLabelOn`,
 *      `categoryLabel`. Used by the legacy/shopping grid.
 *   2. Step recipe — pass `cardCfg` (from getListingConfig(slug).card)
 *      to drive badge / subtitle / chips / stats / price wording per
 *      step. Used by the mockup listing steps.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  CalendarDays,
  Check,
  Heart,
  MapPin,
  Palette,
  Plus,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  X,
} from "lucide-react";
import { addToCart, getEventDate, setEventDate } from "@/lib/cartStore";
import { addToWishlist, removeFromWishlist, useIsWishlisted } from "@/lib/wishlistStore";
import { safeCssUrl } from "@/lib/utils";
import { resolveRating, formatCountdown } from "@/lib/itemUiHelpers";
import { formatINR } from "@/lib/journeyStepUi";
import useSiteConfig from "@/lib/useSiteConfig";
import VerifiedBadge from "@/components/VerifiedBadge";

const FALLBACK_IMAGE =""

  // "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80";

// Colored tones for the overlaid spec badge (driven by cardCfg.badge).
const BADGE_TONES = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning",
  info: "bg-primary-soft text-primary",
  neutral: "bg-surface/95 text-text",
};

// Suggested chips for the decor "add specifics" capture modal. The couple can
// tap any of these or type their own — both are stored as free text on meta.
const THEME_SUGGESTIONS = ["Royal", "Floral", "Boho", "Minimal", "Traditional", "Rustic", "Modern"];
const COLOUR_SUGGESTIONS = [
  "Gold & maroon",
  "Pastels",
  "Red & white",
  "Royal blue",
  "Blush pink",
  "Emerald green",
];

function wishlistKindFromCartKind(cartKind) {
  return cartKind === "shopping" ? "shopping" : "journey";
}

// Build a few spec chips from raw item attributes for the generic card path
// (the cardCfg path supplies its own chips). Keeps cards informative even when
// a step recipe isn't configured. Never throws on missing fields.
function genericChipsFor(item) {
  if (!item) return [];
  const a = item.attributes || {};
  const out = [];
  const push = (v) => {
    if (v != null && v !== "") out.push(String(v).trim());
  };
  const first = (v) => (Array.isArray(v) ? v.filter(Boolean)[0] : v);

  // Keys mirror mss-admin/src/lib/itemAttributesSchema.js exactly.
  // Venue
  const maxGuests = Number(a.max_guests);
  if (Number.isFinite(maxGuests) && maxGuests > 0) push(`Up to ${maxGuests} guests`);
  push(a.venue_type);
  if (a.ac_non_ac === "AC") push("AC");
  // Catering
  push(first(a.cuisine_types));
  push(a.food_type);
  // Shopping — bride/groom from the canonical item.audience (single source).
  push(item?.audience === "bride" ? "Dulhan" : item?.audience === "groom" ? "Dulha" : null);
  push(a.fabric_material);
  push(first(a.occasion));
  push(first(a.work_embroidery));
  if (a.purity && a.purity !== "Not Applicable") push(a.purity);
  // Decor / gifting
  push(a.theme);
  push(a.gift_type);
  push(a.packaging_type);
  // Fallback to the category label so a card is never chip-less.
  if (!out.length) push(item.subcategory_label || item.category_label);

  // de-dupe + cap
  return Array.from(new Set(out.filter(Boolean))).slice(0, 4);
}

export default function ProductCard({
  item,
  /** Per-step card recipe from getListingConfig(slug).card (optional). */
  cardCfg = null,
  /** Pre-resolved vendor display name (WL-aware). Generic path only. */
  vendorName,
  whiteLabelOn = false,
  step,
  fallbackImage,
  /** Pre-computed highlight bullet strings (generic path). */
  highlights,
  /** Override for the top-left image pill (generic path). */
  categoryLabel,
  /** "quotation" (journey) | "shopping" (e-commerce cart). */
  cartKind = "quotation",
  /**
   * When true (decor step), adding opens a small modal that captures
   * theme / colour / notes; the values are stored on the cart line `meta`
   * so the vendor/admin knows the look the couple wants.
   */
  captureDetails = false,
}) {
  const wishlistKind = wishlistKindFromCartKind(cartKind);
  const wishlisted = useIsWishlisted(wishlistKind, item?.item_id);
  // Tri-state reviews toggle: hide the rating chip when reviews are disabled.
  const { config } = useSiteConfig();
  const showRatings = config.reviews_mode !== "disabled";
  const [justAdded, setJustAdded] = useState(false);
  const justAddedTimer = useRef(null);
  // Decor "capture details" modal (theme / colour / notes / event date).
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailForm, setDetailForm] = useState({
    theme: "",
    colour: "",
    notes: "",
    eventDate: "",
  });
  const [dateError, setDateError] = useState(false);

  // Re-render once a minute so the sale-ends countdown stays fresh.
  const [, setTick] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const hoverTimer = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);
  useEffect(
    () => () => {
      if (justAddedTimer.current) clearTimeout(justAddedTimer.current);
    },
    [],
  );
  useEffect(
    () => () => {
      if (hoverTimer.current) clearInterval(hoverTimer.current);
    },
    [],
  );

  // Lock background scroll while the decor details modal is open.
  useEffect(() => {
    if (!detailsOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [detailsOpen]);

  if (!item) return null;

  const allImages =
    Array.isArray(item.images) && item.images.length
      ? item.images
      : [fallbackImage || FALLBACK_IMAGE];

  function startCycle() {
    if (allImages.length <= 1) return;
    if (hoverTimer.current) clearInterval(hoverTimer.current);
    hoverTimer.current = setInterval(() => {
      setImageIndex((i) => (i + 1) % allImages.length);
    }, 2000);
  }
  function stopCycle() {
    if (hoverTimer.current) {
      clearInterval(hoverTimer.current);
      hoverTimer.current = null;
    }
    setImageIndex(0);
  }

  const image = allImages[imageIndex] || allImages[0];
  const href = `/items/${item.item_id}`;

  // Step-recipe driven fields (null/empty when running the generic path).
  const badge = cardCfg?.badge ? cardCfg.badge(item) : null;
  const subtitle = cardCfg?.subtitle ? cardCfg.subtitle(item) : "";
  const chips = cardCfg?.chips
    ? cardCfg.chips(item).slice(0, 6)
    : highlights
      ? []
      : genericChipsFor(item);
  const stats = cardCfg?.stats ? cardCfg.stats(item).slice(0, 3) : [];

  // Generic path bullets (only when no step recipe is supplied).
  const bullets = cardCfg ? [] : Array.isArray(highlights) ? highlights : [];

  const finalPrice = Number(item.final_price ?? item.price ?? 0);
  const basePrice = Number(item.price ?? 0);
  const hasDiscount = item.is_discount_active && Number(item.discount_percentage) > 0;
  const priceText = formatINR(finalPrice); // null when no price → "Custom quote"

  const rating = resolveRating(item);
  const locationStr = [item.location_city, item.location_state].filter(Boolean).join(", ");

  // Top-left image pill: step badge wins; otherwise category label.
  const topLeftLabel = badge
    ? null
    : categoryLabel ||
      item.subcategory_label ||
      item.category_label ||
      step?.title ||
      "Featured";

  const soldByName = whiteLabelOn || !vendorName ? "MyShaadiStore" : vendorName;
  const isSellerVerified = whiteLabelOn || !!item?.vendor_is_verified;
  const showSoldBy = !cardCfg && (vendorName || whiteLabelOn);

  const countdown =
    hasDiscount && item.discount?.is_enabled ? formatCountdown(item.discount?.ends_at) : null;

  const isShoppingKind = cartKind === "shopping";

  // Drop the line into the cart, optionally with captured event details on
  // `meta`. Product lines lock to the item's vendor_id (set on the item).
  function commitAdd(meta = null) {
    addToCart(cartKind, meta ? { ...item, meta } : item, 1);
    toast.success(isShoppingKind ? "Added to cart" : "Added to basket", {
      description: item.name,
    });
    setJustAdded(true);
    if (justAddedTimer.current) clearTimeout(justAddedTimer.current);
    justAddedTimer.current = setTimeout(() => setJustAdded(false), 1600);
  }

  function handleAdd(e) {
    e.preventDefault();
    e.stopPropagation();
    // Decor: collect theme / colour / notes (+ event date) before adding.
    if (captureDetails) {
      setDetailForm({ theme: "", colour: "", notes: "", eventDate: getEventDate() });
      setDateError(false);
      setDetailsOpen(true);
      return;
    }
    commitAdd();
  }

  // Toggle a suggestion chip into a comma-separated free-text field so taps and
  // typing coexist on the same value.
  function toggleSuggestion(field, value) {
    setDetailForm((f) => {
      const parts = f[field]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const idx = parts.findIndex((p) => p.toLowerCase() === value.toLowerCase());
      if (idx >= 0) parts.splice(idx, 1);
      else parts.push(value);
      return { ...f, [field]: parts.join(", ") };
    });
  }

  function isSelected(field, value) {
    return detailForm[field]
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .includes(value.toLowerCase());
  }

  function confirmDetails(e) {
    e.preventDefault();
    e.stopPropagation();
    const eventDate = detailForm.eventDate.trim();
    // Event date is required before anything joins the quote basket.
    if (!eventDate) {
      setDateError(true);
      toast.error("Please pick your event date first");
      return;
    }
    setEventDate(eventDate); // persist across steps
    const meta = {
      theme: detailForm.theme.trim(),
      colour: detailForm.colour.trim(),
      notes: detailForm.notes.trim(),
      event_date: eventDate,
    };
    commitAdd(meta);
    setDetailsOpen(false);
  }

  function handleWishlist(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!item?.item_id) return;
    if (wishlisted) {
      removeFromWishlist(wishlistKind, item.item_id);
      toast("Removed from favourites");
    } else {
      addToWishlist(wishlistKind, item);
      toast.success("Saved to favourites");
    }
  }

  const defaultCta = isShoppingKind ? "Add to cart" : "Add to basket";
  const ctaLabel = cardCfg?.ctaLabel || defaultCta;
  const addLabel = justAdded ? "Added" : ctaLabel;
  const priceCaption = cardCfg?.priceLabel || cardCfg?.priceCaption || "Starting from";

  return (
    <article
      className="group flex h-full min-w-0 flex-col"
      onMouseEnter={startCycle}
      onMouseLeave={stopCycle}
    >
      <Link
        href={href}
        className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-[0_4px_18px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_44px_rgba(15,23,42,0.12)]"
      >
        {/* Image with overlays */}
        <div className="relative aspect-4/3 w-full shrink-0 overflow-hidden rounded-t-2xl bg-surface-muted">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: safeCssUrl(image) }}
            role="img"
            aria-label={item.name}
          />
          <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.04),inset_0_-20px_40px_-20px_rgba(15,23,42,0.18)]" />

          {/* Top-left: step spec badge OR category pill */}
          {badge ? (
            <span
              className={`absolute left-3 top-3 rounded-md px-2.5 py-1 text-[11px] font-semibold shadow-sm backdrop-blur-sm ${
                BADGE_TONES[badge.tone] || BADGE_TONES.neutral
              }`}
            >
              {badge.label}
            </span>
          ) : topLeftLabel ? (
            <span className="absolute left-3 top-3 rounded-md bg-surface/95 px-2.5 py-1 text-[11px] font-semibold text-text shadow-sm backdrop-blur-sm">
              {topLeftLabel}
            </span>
          ) : null}

          {/* Discount pill */}
          {hasDiscount ? (
            <span className="absolute right-3 top-12 rounded-md bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground shadow-sm">
              {item.discount_percentage}% OFF
            </span>
          ) : null}

          {/* Wishlist heart */}
          <button
            type="button"
            onClick={handleWishlist}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={wishlisted}
            className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface/95 text-text shadow-sm backdrop-blur-sm transition-transform duration-200 hover:scale-110"
          >
            <Heart
              className={`h-4 w-4 transition-colors ${wishlisted ? "text-primary" : "text-text"}`}
              fill={wishlisted ? "currentColor" : "none"}
              strokeWidth={2}
            />
          </button>

          {/* Sale countdown */}
          {countdown ? (
            <span className="absolute bottom-3 left-3 rounded-md bg-text/85 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground shadow-sm">
              Sale ends in {countdown}
            </span>
          ) : null}

          {/* Multi-image dots */}
          {allImages.length > 1 ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-3 flex items-center justify-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              {allImages.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    idx === imageIndex ? "w-4 bg-white" : "w-1.5 bg-white/60"
                  }`}
                />
              ))}
            </div>
          ) : null}
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-text">
            {item.name}
          </h3>

          {subtitle ? <p className="text-xs font-medium text-muted">{subtitle}</p> : null}

          {/* Rating — hidden when reviews are disabled site-wide */}
          {showRatings && rating ? (
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <Star className="h-3.5 w-3.5 text-warning" fill="currentColor" strokeWidth={2} />
              <span className="font-semibold text-text">{rating.value.toFixed(1)}</span>
              <span>({rating.count})</span>
            </div>
          ) : null}

          {/* Location */}
          {locationStr ? (
            <div className="flex items-center gap-1 text-xs text-muted">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">{locationStr}</span>
            </div>
          ) : null}

          {/* Sold-by (generic path) */}
          {showSoldBy ? (
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <Store className="h-3 w-3 shrink-0" aria-hidden />
              <span className="inline-flex min-w-0 items-center gap-1 truncate">
                Sold by <span className="truncate font-medium text-text">{soldByName}</span>
                {isSellerVerified ? <VerifiedBadge size="xs" /> : null}
              </span>
            </div>
          ) : null}

          {/* Spec chips (step recipe) */}
          {chips.length ? (
            <div className="flex flex-wrap gap-1.5">
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-medium text-text"
                >
                  {chip}
                </span>
              ))}
            </div>
          ) : null}

          {/* Highlight bullets (generic path) */}
          {bullets.length ? (
            <ul className="space-y-1 text-[11px] text-muted">
              {bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-1.5">
                  <span
                    className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-primary"
                    aria-hidden
                  />
                  <span className="truncate">{bullet}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {/* Stats block (step recipe) */}
          {stats.length ? (
            <div
              className={`grid divide-x divide-border rounded-xl bg-surface-muted/60 px-1 py-2 text-center ${
                stats.length === 3
                  ? "grid-cols-3"
                  : stats.length === 2
                    ? "grid-cols-2"
                    : "grid-cols-1"
              }`}
            >
              {stats.map((s) => (
                <div key={s.label} className="min-w-0 px-1.5">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-subtle">
                    {s.label}
                  </div>
                  <div className="mt-0.5 truncate text-xs font-bold text-primary">{s.value}</div>
                </div>
              ))}
            </div>
          ) : null}

          {/* Footer — price | CTA */}
          <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-2">
                {priceText ? (
                  <>
                    <span className="text-lg font-bold text-text transition-colors duration-300 group-hover:text-primary-hover">
                      {cardCfg?.pricePrefix || ""}
                      {priceText}
                    </span>
                    {item.price_range && item.price_range.max > item.price_range.min ? (
                      <span className="text-xs font-semibold text-muted">
                        – {formatINR(item.price_range.max)}
                      </span>
                    ) : hasDiscount && basePrice > finalPrice ? (
                      <span className="text-xs text-muted line-through">
                        {formatINR(basePrice)}
                      </span>
                    ) : null}
                  </>
                ) : (
                  <span className="text-base font-bold text-primary">Custom quote</span>
                )}
              </div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-subtle">
                {priceText
                  ? item.price_range && item.price_range.max > item.price_range.min
                    ? `${item.price_range.count} variants`
                    : priceCaption
                  : "Tailored to your event"}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={justAdded}
              aria-label={addLabel}
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
              ) : isShoppingKind ? (
                <ShoppingBag
                  className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5"
                  aria-hidden
                />
              ) : (
                <Plus
                  className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-90"
                  aria-hidden
                />
              )}
              <span>{addLabel}</span>
            </button>
          </div>
        </div>
      </Link>

      {/* Decor capture-details modal — theme / colour / notes ride along on
          the cart line meta. Rendered outside the Link so clicks here never
          navigate to the item page. */}
      {captureDetails && detailsOpen ? (
        <div
          role="presentation"
          className="fixed inset-0 z-100 flex items-center justify-center bg-text-strong/45 p-4"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.target === e.currentTarget) setDetailsOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Decor details"
            className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-[0_24px_80px_rgba(15,23,42,0.2)]"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {/* Selected product image(s) at the top */}
            <div className="relative h-36 w-full shrink-0 bg-surface-muted">
              <div className="flex h-full w-full gap-0.5">
                {allImages.slice(0, 3).map((img, idx) => (
                  <div
                    key={idx}
                    className="h-full flex-1 bg-cover bg-center"
                    style={{ backgroundImage: safeCssUrl(img) }}
                    role="img"
                    aria-label={`${item.name} preview ${idx + 1}`}
                  />
                ))}
              </div>
              <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-text-strong/70 via-text-strong/10 to-transparent" />
              <button
                type="button"
                onClick={() => setDetailsOpen(false)}
                className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface/95 text-text shadow-sm backdrop-blur-sm transition-colors hover:bg-surface"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute inset-x-4 bottom-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface/95 px-2.5 py-1 text-[11px] font-semibold text-primary shadow-sm backdrop-blur-sm">
                  <Palette className="h-3.5 w-3.5" aria-hidden />
                  Add decor specifics
                </span>
                <h3 className="mt-1.5 line-clamp-1 text-base font-bold text-white drop-shadow">
                  {item.name}
                </h3>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <p className="mb-4 text-sm text-muted">
                Tell us the look you want and we&apos;ll pass it to the decorator with your quote.
              </p>
              <div className="space-y-4">
                {/* Theme */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-subtle">
                    <Sparkles className="h-3.5 w-3.5 text-warning" aria-hidden />
                    Theme
                  </label>
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {THEME_SUGGESTIONS.map((s) => {
                      const on = isSelected("theme", s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleSuggestion("theme", s)}
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                            on
                              ? "border-primary bg-primary-soft text-primary"
                              : "border-border-strong bg-surface text-muted hover:border-primary/40 hover:text-text"
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    value={detailForm.theme}
                    onChange={(e) => setDetailForm((f) => ({ ...f, theme: e.target.value }))}
                    placeholder="Or type your own theme…"
                    className="h-11 w-full rounded-xl border border-border-strong bg-surface px-3 text-sm font-medium text-text outline-none focus:border-primary"
                  />
                </div>

                {/* Colour palette */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-subtle">
                    <Palette className="h-3.5 w-3.5 text-primary" aria-hidden />
                    Colour palette
                  </label>
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {COLOUR_SUGGESTIONS.map((s) => {
                      const on = isSelected("colour", s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleSuggestion("colour", s)}
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                            on
                              ? "border-primary bg-primary-soft text-primary"
                              : "border-border-strong bg-surface text-muted hover:border-primary/40 hover:text-text"
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    value={detailForm.colour}
                    onChange={(e) => setDetailForm((f) => ({ ...f, colour: e.target.value }))}
                    placeholder="Or type your own colours…"
                    className="h-11 w-full rounded-xl border border-border-strong bg-surface px-3 text-sm font-medium text-text outline-none focus:border-primary"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-subtle">
                    Notes
                  </label>
                  <textarea
                    value={detailForm.notes}
                    onChange={(e) => setDetailForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Anything specific — stage, entry, mandap, references…"
                    rows={3}
                    className="w-full rounded-xl border border-border-strong bg-surface px-3 py-2 text-sm font-medium text-text outline-none focus:border-primary"
                  />
                </div>

                {/* Event date — REQUIRED */}
                <div>
                  <label
                    htmlFor={`event-date-${item.item_id}`}
                    className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-subtle"
                  >
                    <CalendarDays className="h-3.5 w-3.5 text-success" aria-hidden />
                    Event date <span className="text-danger">*</span>
                  </label>
                  <input
                    id={`event-date-${item.item_id}`}
                    type="date"
                    value={detailForm.eventDate}
                    onChange={(e) => {
                      setDetailForm((f) => ({ ...f, eventDate: e.target.value }));
                      setDateError(false);
                    }}
                    className={`h-11 w-full rounded-xl border bg-surface px-3 text-sm font-medium text-text outline-none focus:border-primary ${
                      dateError ? "border-danger" : "border-border-strong"
                    }`}
                  />
                  {dateError ? (
                    <p className="mt-1 text-xs font-medium text-danger">
                      We need your event date before adding to the basket.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-surface-muted/40 px-5 py-4">
              <button
                type="button"
                onClick={() => setDetailsOpen(false)}
                className="h-10 rounded-xl border border-border-strong px-4 text-sm font-medium text-muted hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDetails}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Add to basket
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
