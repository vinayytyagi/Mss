"use client";

/**
 * ItemCardV2 — alternative "premium" card design for the journey-step grid.
 *
 * Rendered alongside the current card so the team can pick which to keep.
 * Slate-based, wider 4:3 image, vendor "Sold by" line with WL detection,
 * smart highlight bullets reused from JourneyStepPage's `highlightsForItem`
 * (passed via the `highlights` prop), and a "View details →" link to the
 * generic PDP at `/items/[itemId]`.
 *
 * Polish pass adds: star rating + count, location pill, sale-ends countdown,
 * stock badge, capacity / min-booking-days bullets, an "Add to basket"
 * button wired through the existing quotation cart, micro-interactions
 * (image zoom on hover, card lift, plus-icon rotate, wishlist heart),
 * and image rounded only at the top so it meets the card body flush.
 *
 * Props:
 *   item          — full item from /api/v1/items
 *   vendorName    — pre-resolved display name (WL-aware; caller picks)
 *   whiteLabelOn  — bool (true ⇒ show "MyShaadiStore", false ⇒ vendor)
 *   step          — current journey step (used for default category label
 *                   when item has no subcategory match)
 *   fallbackImage — optional fallback img URL when item.images[0] missing
 *   highlights    — optional pre-computed array of bullet strings; if
 *                   omitted we compute a tiny inline fallback from a few
 *                   common attribute keys
 *   categoryLabel — optional override for the top-left pill
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, Heart, MapPin, Plus, ShoppingBag, Star, Store } from "lucide-react";
import { addToCart } from "@/lib/cartStore";
import {
  addToWishlist,
  removeFromWishlist,
  useIsWishlisted,
} from "@/lib/wishlistStore";
import { safeCssUrl } from "@/lib/utils";
import { resolveRating, formatCountdown } from "@/lib/itemUiHelpers";
import useSiteConfig from "@/lib/useSiteConfig";
import VerifiedBadge from "@/components/VerifiedBadge";

// Map a cartKind ("quotation" | "shopping") to a wishlist bucket
// ("journey" | "shopping"). Wishlist intentionally uses different
// labels (the user-facing concept on `/favourites` is "Journey items"
// vs "Shopping items"), so we translate at the boundary.
function wishlistKindFromCartKind(cartKind) {
  return cartKind === "shopping" ? "shopping" : "journey";
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80";

function formatRupees(value) {
  const amount = Number(value || 0);
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1)}L`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Schema-key driven highlight bullets (keys mirror itemAttributesSchema.js).
// ItemCardV2 is used on the /shopping catalog, the PDP "related items" rail
// and favourites — it can't rely on the step slug, so we just surface
// whichever known attributes are present, in priority order.
function inlineHighlights(item) {
  const a = item?.attributes || {};
  const join2 = (v) =>
    Array.isArray(v) ? v.filter(Boolean).slice(0, 2).join(", ") : v;
  const out = [];
  const candidates = [
    // Shopping
    ["Fabric", a.fabric_material],
    ["Work", join2(a.work_embroidery)],
    ["Occasion", join2(a.occasion)],
    ["Purity", a.purity && a.purity !== "Not Applicable" ? a.purity : null],
    ["Pieces", a.pieces_included],
    ["Brand", a.brand],
    // Venue
    ["Capacity", a.max_guests ? `Up to ${a.max_guests} guests` : null],
    ["Type", a.venue_type],
    // Catering
    ["Cuisine", join2(a.cuisine_types)],
    ["Per plate", a.veg_plate_price ? `₹${a.veg_plate_price}/plate` : null],
    // Decor
    ["Theme", a.theme],
    ["Includes", join2(a.includes)],
    // Gifting
    ["Type", a.gift_type],
    ["Packaging", a.packaging_type],
  ];
  for (const [label, value] of candidates) {
    if (value == null || value === "") continue;
    out.push(`${label}: ${value}`);
    if (out.length === 3) break;
  }
  return out;
}

function StarRow({ value = 0 }) {
  const rounded = Math.round(value * 2) / 2; // 0.5 steps
  return (
    <div className="flex items-center" aria-label={`Rating ${value} out of 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const full = rounded >= i + 1;
        const half = !full && rounded >= i + 0.5;
        if (half) {
          // Half star: stack an outlined star with a clipped filled star.
          return (
            <span key={i} className="relative inline-block h-3.5 w-3.5">
              <Star className="absolute inset-0 h-3.5 w-3.5 text-warning" fill="none" strokeWidth={2} />
              <span className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
                <Star className="h-3.5 w-3.5 text-warning" fill="currentColor" strokeWidth={2} />
              </span>
            </span>
          );
        }
        return (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${full ? "text-warning" : "text-border-strong"}`}
            fill={full ? "currentColor" : "none"}
            strokeWidth={2}
          />
        );
      })}
    </div>
  );
}

export default function ItemCardV2({
  item,
  vendorName,
  whiteLabelOn = false,
  step,
  fallbackImage,
  highlights,
  categoryLabel,
  /**
   * Which cart this card adds to.
   *  "quotation"  → journey-step pages (default — request quote / inquiry)
   *  "shopping"   → /shopping page (true e-commerce cart)
   */
  cartKind = "quotation",
}) {
  const wishlistKind = wishlistKindFromCartKind(cartKind);
  const wishlisted = useIsWishlisted(wishlistKind, item?.item_id);
  // Tri-state reviews toggle: hide the rating chip when reviews are disabled.
  const { config } = useSiteConfig();
  const showRatings = config.reviews_mode !== "disabled";
  // Brief post-click "Added" affordance on the basket button. Persists for
  // ~1.6s, then reverts to the default label so the same card can be
  // re-added if the customer wants two of something.
  const [justAdded, setJustAdded] = useState(false);
  const justAddedTimer = useRef(null);

  // Re-render once a minute so the sale-ends countdown stays fresh while
  // the user lingers on the grid. Cheap, only renders this card subtree.
  const [, setTick] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const hoverTimer = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => () => {
    if (justAddedTimer.current) clearTimeout(justAddedTimer.current);
  }, []);
  useEffect(() => () => {
    if (hoverTimer.current) clearInterval(hoverTimer.current);
  }, []);

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
  const bullets = Array.isArray(highlights) ? highlights : inlineHighlights(item);

  const finalPrice = Number(item.final_price ?? item.price ?? 0);
  const basePrice = Number(item.price ?? 0);
  const hasDiscount = item.is_discount_active && Number(item.discount_percentage) > 0;

  const topLeftLabel =
    categoryLabel ||
    item.subcategory_label ||
    item.category_label ||
    step?.title ||
    "Featured";

  const soldByName =
    whiteLabelOn || !vendorName ? "MyShaadiStore" : vendorName;
  // White-label listings are sold as MyShaadiStore (always verified).
  // Otherwise show the badge only when the admin has verified this vendor.
  const isSellerVerified = whiteLabelOn || !!item?.vendor_is_verified;

  const rating = resolveRating(item);
  const locationStr = [item.location_city, item.location_state]
    .filter(Boolean)
    .join(", ");

  const a = item.attributes || {};
  const capacityVal = a.capacity || a.max_guests || a.guest_capacity;
  const minBookingDays = a.min_booking_days || a.minimum_nights || a.min_nights;

  const countdown =
    hasDiscount && item.discount?.is_enabled
      ? formatCountdown(item.discount?.ends_at)
      : null;

  const stockStatus = item.stock_status; // "in_stock" | "made_to_order" | etc.

  const isShoppingKind = cartKind === "shopping";

  function handleAddToBasket(e) {
    e.preventDefault();
    e.stopPropagation();
    addToCart(cartKind, item, 1);
    toast.success(isShoppingKind ? "Added to cart" : "Added to basket", {
      description: item.name,
    });
    // Flash the in-button "Added" state for a moment.
    setJustAdded(true);
    if (justAddedTimer.current) clearTimeout(justAddedTimer.current);
    justAddedTimer.current = setTimeout(() => setJustAdded(false), 1600);
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

  const addLabel = justAdded
    ? "Added"
    : isShoppingKind
      ? "Add to cart"
      : "Add to basket";

  return (
    <article
      className="group flex h-full min-w-0 flex-col"
      onMouseEnter={startCycle}
      onMouseLeave={stopCycle}
    >
      <Link
        href={href}
        className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_4px_18px_rgba(15,23,42,0.05)] transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_18px_44px_rgba(15,23,42,0.1)]"
      >
        {/* Image — rounded only at top so it meets the body flush. */}
        <div className="relative aspect-4/3 w-full shrink-0 overflow-hidden rounded-t-2xl bg-surface-muted">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: safeCssUrl(image) }}
            role="img"
            aria-label={item.name}
          />
          {/* Subtle inset shadow */}
          <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.04),inset_0_-20px_40px_-20px_rgba(15,23,42,0.18)]" />

          {/* Top-left category pill */}
          <span className="absolute left-3 top-3 rounded-md bg-surface/95 px-2.5 py-1 text-[11px] font-semibold text-text shadow-sm backdrop-blur-sm">
            {topLeftLabel}
          </span>

          {/* Top-right discount pill */}
          {hasDiscount ? (
            <span className="absolute right-3 top-12 rounded-md bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground shadow-sm">
              {item.discount_percentage}% OFF
            </span>
          ) : null}

          {/* Wishlist heart — top right, wired to persistent wishlist store. */}
          <button
            type="button"
            onClick={handleWishlist}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={wishlisted}
            className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface/95 text-text shadow-sm backdrop-blur-sm transition-transform duration-200 hover:scale-110"
          >
            <Heart
              className={`h-4 w-4 transition-colors ${
                wishlisted ? "text-primary" : "text-text"
              }`}
              fill={wishlisted ? "currentColor" : "none"}
              strokeWidth={2}
            />
          </button>

          {/* Countdown — bottom-left overlay, only when a real sale window is set. */}
          {countdown ? (
            <span className="absolute bottom-3 left-3 rounded-md bg-text/85 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground shadow-sm">
              Sale ends in {countdown}
            </span>
          ) : null}

          {/* Dot indicator — visible only on hover for multi-image
              cards. Tells the shopper there are more photos and which
              one we're currently cycling to. */}
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

          {/* Rating row — only when item has reviews and reviews aren't disabled */}
          {showRatings && rating ? (
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <StarRow value={rating.value} />
              <span className="font-semibold text-text">{rating.value.toFixed(1)}</span>
              <span>({rating.count})</span>
            </div>
          ) : null}

          {/* Location pill */}
          {locationStr ? (
            <div className="flex items-center gap-1 text-xs text-muted">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">{locationStr}</span>
            </div>
          ) : null}

          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Store className="h-3 w-3 shrink-0" aria-hidden />
            <span className="inline-flex min-w-0 items-center gap-1 truncate">
              Sold by{" "}
              <span className="font-medium text-text truncate">{soldByName}</span>
              {isSellerVerified ? <VerifiedBadge size="xs" /> : null}
            </span>
          </div>

          {/* Step-aware highlight bullets */}
          {bullets.length > 0 ? (
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

          {/* Extra meta chips — capacity / min booking days / stock */}
          {(capacityVal || minBookingDays || stockStatus) ? (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {capacityVal ? (
                <span className="rounded-md bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium text-text">
                  Up to {capacityVal} guests
                </span>
              ) : null}
              {minBookingDays ? (
                <span className="rounded-md bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium text-text">
                  Min {minBookingDays} {Number(minBookingDays) === 1 ? "day" : "days"}
                </span>
              ) : null}
              {stockStatus === "in_stock" ? (
                <span className="rounded-md bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
                  In stock
                </span>
              ) : stockStatus === "made_to_order" ? (
                <span className="rounded-md bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
                  Made to order
                </span>
              ) : null}
            </div>
          ) : null}

          {/* Price + add-to-basket */}
          <div className="mt-auto flex items-end justify-between gap-3 pt-3">
            <div className="min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-lg font-bold text-text transition-colors duration-300 group-hover:text-primary-hover">
                  {formatRupees(finalPrice)}
                </span>
                {item.price_range && item.price_range.max > item.price_range.min ? (
                  <span className="text-xs font-semibold text-muted">
                    – {formatRupees(item.price_range.max)}
                  </span>
                ) : hasDiscount && basePrice > finalPrice ? (
                  <span className="text-xs text-muted line-through">
                    {formatRupees(basePrice)}
                  </span>
                ) : null}
              </div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-subtle">
                {item.price_range && item.price_range.max > item.price_range.min
                  ? `${item.price_range.count} variants`
                  : "Starting from"}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddToBasket}
              disabled={justAdded}
              aria-label={addLabel}
              aria-pressed={justAdded}
              className={[
                "shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold shadow-sm transition-all duration-300 transform-gpu",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                justAdded
                  ? "scale-105 bg-success text-primary-foreground shadow-[0_8px_22px_rgba(34,197,94,0.35)]"
                  : "bg-primary text-primary-foreground shadow-[0_6px_16px_rgba(255,79,134,0.25)] hover:bg-primary-hover hover:shadow-[0_10px_24px_rgba(255,79,134,0.4)] active:scale-95",
              ].join(" ")}
            >
              {justAdded ? (
                <Check
                  key="added-icon"
                  className="h-3.5 w-3.5 animate-in zoom-in-50 duration-300"
                  strokeWidth={3}
                  aria-hidden
                />
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
              <span className="transition-all duration-200">{addLabel}</span>
            </button>
          </div>
        </div>
      </Link>
    </article>
  );
}
