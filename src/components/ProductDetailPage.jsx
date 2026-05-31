"use client";

/**
 * Generic Product Detail Page (PDP) — works for items from ANY journey step.
 *
 * Server route lives at `/items/[itemId]`; this client component does the
 * actual data fetching (item + journey step + attribute schema + related
 * items) so we can show loading + error states without server round-trips
 * being noticeable.
 *
 * Cart wiring:
 *   - Always offers "Add to Inquiry" → addToCart('quotation', item, qty)
 *   - For items with policies.returnable === true (today: Shopping) we ALSO
 *     show "Add to Cart" → addToCart('shopping', item, qty)
 *
 * White-label: customer API strips vendor identity when WL is on, so we
 * detect via `!item.vendor_id` and substitute "MyShaadiStore".
 *
 * Premium polish (this pass):
 *   - Wider hero gallery with thumbnail strip + click-to-zoom modal
 *   - Sticky purchase column with bigger price + countdown + qty stepper
 *   - Tabbed long-form content (Overview / Specifications / Policies / Reviews)
 *   - Vendor info card with avatar, verified badge, message stub
 *   - Trust signal cards (3-up, hover-lift)
 *   - "You might also like" footer with "View all in {category}" link
 *   - Mobile bottom action bar with qty stepper when in cart
 *   - Reused shared helpers from `lib/itemUiHelpers.js`
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { toast } from "sonner";
import {
  ChevronRight,
  ChevronLeft,
  Store,
  Check,
  ShoppingCart,
  ClipboardList,
  RotateCcw,
  Truck,
  ShieldCheck,
  Loader2,
  Star,
  MapPin,
  Clock,
  Package,
  BadgeCheck,
  Headphones,
  Lock,
  Heart,
  X,
  ZoomIn,
  MessageCircle,
  Timer,
} from "lucide-react";
import {
  addToCart,
  useCartState,
  updateCartQuantity,
  removeFromCart,
} from "@/lib/cartStore";
import {
  addToWishlist,
  removeFromWishlist,
  useIsWishlisted,
} from "@/lib/wishlistStore";
import {
  fetchItem,
  fetchJourneySteps,
  fetchAttributeSchema,
  fetchItems,
  fetchItemVariants,
} from "@/lib/api";
import { safeCssUrl } from "@/lib/utils";
import { resolveRating, formatCountdown } from "@/lib/itemUiHelpers";
import BasketButton from "@/components/BasketButton";
import ItemCardV2 from "@/components/ItemCardV2";
import ItemAttributesSpec from "@/components/ItemAttributesSpec";
import ProductReviews from "@/components/ProductReviews";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80";

// Fallback nature lookup mirrors `mss-admin/src/lib/constants/journeySteps.js`.
// Used to decide which extra sections to surface on the PDP (e.g. package
// "what's included" box vs. product stock/bulk-pricing chips).
const STEP_NATURE_BY_SLUG = {
  venue: "product",
  shopping: "product",
  gifting: "product",
  streedhan: "product",
  decor: "package",
  catering: "package",
  photography: "package",
  "makeup-and-mehndi": "package",
  "wedding-invitation": "package",
  pagfera: "package",
  honeymoon: "package",
};

function resolveStepNature(step) {
  const explicit = String(step?.nature || "").trim().toLowerCase();
  if (explicit === "product" || explicit === "package") return explicit;
  const slug = String(step?.slug || "").trim().toLowerCase();
  return STEP_NATURE_BY_SLUG[slug] || null;
}

function formatRupees(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function resolveStep(steps, item) {
  if (!Array.isArray(steps) || !item?.journey_step_id) return null;
  return steps.find((s) => s.step_id === item.journey_step_id) || null;
}

function StarRow({ value = 0, size = "sm" }) {
  const cls = size === "lg" ? "h-5 w-5" : "h-4 w-4";
  const rounded = Math.round(value * 2) / 2;
  return (
    <div className="flex items-center" aria-label={`Rating ${value} out of 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const full = rounded >= i + 1;
        const half = !full && rounded >= i + 0.5;
        if (half) {
          return (
            <span key={i} className={`relative inline-block ${cls}`}>
              <Star className={`absolute inset-0 ${cls} text-warning`} fill="none" strokeWidth={2} />
              <span className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
                <Star className={`${cls} text-warning`} fill="currentColor" strokeWidth={2} />
              </span>
            </span>
          );
        }
        return (
          <Star
            key={i}
            className={`${cls} ${full ? "text-warning" : "text-border-strong"}`}
            fill={full ? "currentColor" : "none"}
            strokeWidth={2}
          />
        );
      })}
    </div>
  );
}

// Coerce a variety of shapes (array / comma- / newline-separated string)
// into a list of strings for the "what's included" checklist.
function toList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/[,\n;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

// Probes a handful of attribute keys that vendors tend to use for
// "what's included" lists. NOTE backend: standardising on a single key
// (e.g. `package_inclusions`) per package step would let us drop this fan-out.
function pickInclusions(attrs) {
  if (!attrs) return [];
  for (const key of [
    "package_includes",
    "package_inclusions",
    "inclusions",
    "includes",
    "deliverables",
    "whats_included",
  ]) {
    const list = toList(attrs[key]);
    if (list.length) return list;
  }
  return [];
}

function pickCitiesServed(attrs) {
  if (!attrs) return [];
  for (const key of ["cities_served", "cities_serviced", "service_cities", "coverage_cities"]) {
    const list = toList(attrs[key]);
    if (list.length) return list;
  }
  return [];
}

function pickDurationLabel(attrs) {
  if (!attrs) return null;
  const v =
    attrs.duration_hours ??
    attrs.coverage_hours ??
    attrs.hours_covered ??
    attrs.duration;
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? `${n}h` : String(v);
}

/* --------------------------- Image zoom modal ---------------------------- */
// Lightweight, dependency-free fullscreen image modal. Closes on backdrop
// click, the X button, or Esc. Supports arrow-key navigation when multiple
// images are present.
function ImageZoomModal({ images, index, onClose, onIndex }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && images.length > 1) {
        onIndex((index + 1) % images.length);
      }
      if (e.key === "ArrowLeft" && images.length > 1) {
        onIndex((index - 1 + images.length) % images.length);
      }
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [images.length, index, onClose, onIndex]);

  if (!mounted || typeof document === "undefined") return null;

  const node = (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close image viewer"
        className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
      >
        <X className="h-5 w-5" aria-hidden />
      </button>
      {images.length > 1 ? (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onIndex((index - 1 + images.length) % images.length);
            }}
            aria-label="Previous image"
            className="absolute left-4 top-1/2 -translate-y-1/2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onIndex((index + 1) % images.length);
            }}
            aria-label="Next image"
            className="absolute right-4 top-1/2 -translate-y-1/2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <ChevronRight className="h-6 w-6" aria-hidden />
          </button>
        </>
      ) : null}
      <div
        className="relative h-[80vh] w-[90vw] max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="absolute inset-0 bg-contain bg-center bg-no-repeat"
          style={{ backgroundImage: safeCssUrl(images[index]) }}
          role="img"
          aria-label={`Image ${index + 1} of ${images.length}`}
        />
      </div>
      {images.length > 1 ? (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
          {index + 1} / {images.length}
        </div>
      ) : null}
    </div>
  );

  return createPortal(node, document.body);
}

export default function ProductDetailPage({ itemId }) {
  const [item, setItem] = useState(null);
  const [step, setStep] = useState(null);
  const [schema, setSchema] = useState(null);
  const [relatedItems, setRelatedItems] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [zoomOpen, setZoomOpen] = useState(false);
  const [variantsData, setVariantsData] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState({ size: "", color: "", material: "" });
  const [justAdded, setJustAdded] = useState({ shopping: false, quotation: false });
  const justAddedTimers = useRef({});
  const cartState = useCartState();

  // Tick once a minute so the sale-ends countdown stays fresh.
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => () => {
    Object.values(justAddedTimers.current).forEach((t) => clearTimeout(t));
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [fetched, steps] = await Promise.all([
          fetchItem(itemId),
          fetchJourneySteps().catch(() => []),
        ]);
        if (cancelled) return;
        setItem(fetched);
        setActiveImage(0);
        setActiveTab("overview");
        const resolved = resolveStep(steps, fetched);
        setStep(resolved);

        // Schema + related items are non-blocking — render the rest even
        // if these fail (e.g. unknown step slug, no peers in same cat).
        if (resolved?.slug) {
          fetchAttributeSchema(resolved.slug)
            .then((res) => {
              if (cancelled) return;
              setSchema(res?.schema || null);
            })
            .catch(() => {});
        }

        if (fetched?.journey_step_id) {
          fetchItems({
            journeyStepId: fetched.journey_step_id,
            categoryId: fetched.category_id || undefined,
            limit: 12,
          })
            .then((res) => {
              if (cancelled) return;
              const pool = Array.isArray(res?.items) ? res.items : [];
              setRelatedItems(
                pool
                  .filter((it) => it.item_id !== fetched.item_id)
                  .slice(0, 4),
              );
            })
            .catch(() => {});
        }

        // Variants are only meaningful for products (shopping-style items).
        // We still fetch unconditionally — the endpoint returns an empty
        // `options` map for items with no variants, so the UI just hides.
        fetchItemVariants(fetched.item_id || itemId)
          .then((res) => {
            if (cancelled) return;
            if (!res) return;
            setVariantsData(res);
            setSelectedVariant({
              size: res?.options?.sizes?.[0] || "",
              color: res?.options?.colors?.[0] || "",
              material: res?.options?.materials?.[0] || "",
            });
          })
          .catch(() => {});
      } catch (err) {
        if (cancelled) return;
        setError(err?.message || "Item not found");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [itemId]);

  const whiteLabelOn = useMemo(() => !item?.vendor_id, [item]);
  const vendorName = useMemo(() => {
    if (!item) return "";
    return whiteLabelOn
      ? "MyShaadiStore"
      : item.vendor_business_name || item.vendor_name || "Vendor";
  }, [item, whiteLabelOn]);

  // Match the currently-picked option set to a concrete variant row. We
  // only match on options that actually exist for this item (e.g. if the
  // item has sizes but no colors, we ignore the color selection).
  const variantOptions = variantsData?.options || {};
  const hasSizes = (variantOptions.sizes || []).length > 0;
  const hasColors = (variantOptions.colors || []).length > 0;
  const hasMaterials = (variantOptions.materials || []).length > 0;
  const hasVariants = hasSizes || hasColors || hasMaterials;

  const matchedVariant = useMemo(() => {
    if (!variantsData || !Array.isArray(variantsData.variants) || !hasVariants) {
      return null;
    }
    return (
      variantsData.variants.find((v) => {
        if (hasSizes && v.size !== selectedVariant.size) return false;
        if (hasColors && v.color !== selectedVariant.color) return false;
        if (hasMaterials && v.material !== selectedVariant.material) return false;
        return true;
      }) || null
    );
  }, [variantsData, selectedVariant, hasSizes, hasColors, hasMaterials, hasVariants]);

  // Image gallery — swaps to variant-specific images when a variant is
  // selected and that variant has its own gallery. This is the
  // Amazon/Flipkart pattern: pick a colour → product photos change.
  // Falls back to item-level images when the variant has none.
  const images = useMemo(() => {
    if (matchedVariant?.images?.length) return matchedVariant.images;
    if (!item) return [FALLBACK_IMAGE];
    if (Array.isArray(item.images) && item.images.length) return item.images;
    return [FALLBACK_IMAGE];
  }, [item, matchedVariant]);

  // Reset to the first image whenever the active gallery (item ↔ variant) swaps.
  useEffect(() => {
    setActiveImage(0);
  }, [matchedVariant?.variant_id]);

  const hasDiscount =
    item?.is_discount_active && Number(item.discount_percentage) > 0;
  // Use the matched variant's price when available (lets vendors charge
  // more for, say, an XXL or a premium colour). Discounts still apply on
  // top via the item-level discount percentage.
  const variantBase = Number(matchedVariant?.price || 0);
  const basePrice = variantBase > 0 ? variantBase : Number(item?.price ?? 0);
  const finalPrice = hasDiscount
    ? Math.round(basePrice * (1 - Number(item.discount_percentage) / 100))
    : Number(item?.final_price ?? basePrice);

  const supportsShoppingCart = Boolean(item?.policies?.returnable);
  const stepNature = useMemo(() => resolveStepNature(step), [step]);

  const rating = useMemo(() => (item ? resolveRating(item) : null), [item]);
  const locationStr = useMemo(() => {
    if (!item) return "";
    return [item.location_city, item.location_state].filter(Boolean).join(", ");
  }, [item]);

  const inclusions = useMemo(() => pickInclusions(item?.attributes), [item]);
  const citiesServed = useMemo(() => pickCitiesServed(item?.attributes), [item]);
  const durationLabel = useMemo(() => pickDurationLabel(item?.attributes), [item]);
  const outstationCharges = item?.attributes?.outstation_charges;
  const bulkSlabs = useMemo(() => {
    const raw = item?.attributes?.bulk_discount_slabs;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    return [];
  }, [item]);

  const countdown = useMemo(() => {
    if (!hasDiscount || !item?.discount?.is_enabled) return null;
    return formatCountdown(item.discount?.ends_at);
  }, [hasDiscount, item]);

  function buildCartPayload() {
    if (!item) return null;
    const variantTag = matchedVariant
      ? [matchedVariant.size, matchedVariant.color, matchedVariant.material]
          .filter(Boolean)
          .join(" / ")
      : "";
    return {
      ...item,
      // `images` and `image` reflect the currently-selected variant when one
      // is picked, so the cart row shows the right colour photo.
      images,
      image: images[0],
      category_label: item.category_label || step?.title || "",
      subcategory_label: item.subcategory_label || "",
      journey_title: step?.title || "",
      journey_step_id: item.journey_step_id || step?.step_id || "",
      source: "pdp",
      ...(matchedVariant
        ? {
            variant_id: matchedVariant.variant_id,
            variant_sku: matchedVariant.sku || null,
            variant_label: variantTag,
            variant_images: matchedVariant.images || [],
            price: basePrice,
            final_price: finalPrice,
          }
        : {}),
    };
  }

  const inInquiryCart = useMemo(() => {
    if (!item) return null;
    return cartState.quotation.find((c) => c.item_id === item.item_id) || null;
  }, [cartState.quotation, item]);

  const inShoppingCart = useMemo(() => {
    if (!item) return null;
    return cartState.shopping.find((c) => c.item_id === item.item_id) || null;
  }, [cartState.shopping, item]);

  // Wishlist bucket — derived from step.slug. If the step hasn't loaded
  // yet (or the slug is anything other than "shopping"), we default to
  // "journey" because every non-shopping step is a journey step.
  const wishlistKind = step?.slug === "shopping" ? "shopping" : "journey";
  const wishlisted = useIsWishlisted(wishlistKind, item?.item_id);

  function handleToggleWishlist() {
    if (!item?.item_id) return;
    if (wishlisted) {
      removeFromWishlist(wishlistKind, item.item_id);
      toast("Removed from favourites");
    } else {
      addToWishlist(wishlistKind, buildCartPayload() || item);
      toast.success("Saved to favourites");
    }
  }

  function flashAdded(kind) {
    setJustAdded((prev) => ({ ...prev, [kind]: true }));
    if (justAddedTimers.current[kind]) clearTimeout(justAddedTimers.current[kind]);
    justAddedTimers.current[kind] = setTimeout(() => {
      setJustAdded((prev) => ({ ...prev, [kind]: false }));
    }, 1600);
  }

  function handleAddToInquiry() {
    const payload = buildCartPayload();
    if (!payload) return;
    addToCart("quotation", payload, 1);
    toast.success("Added to inquiry");
    flashAdded("quotation");
  }

  function handleAddToShoppingCart() {
    const payload = buildCartPayload();
    if (!payload) return;
    addToCart("shopping", payload, 1);
    toast.success("Added to cart");
    flashAdded("shopping");
  }

  if (loading) {
    return (
      <main className="bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-24 text-muted">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="ml-3 text-sm">Loading item&hellip;</span>
        </div>
      </main>
    );
  }

  if (error || !item) {
    return (
      <main className="bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-text">Item not found</h1>
          <p className="mt-3 text-sm text-muted">
            This item may have been removed or is no longer available.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  const stepHref = step?.slug ? `/journey/${step.slug}` : "/";
  const categoryLabel = item.category_label || step?.title || "Catalog";

  // Build the "View all in {category}" link. For products we send shoppers
  // to /shopping with a category filter, otherwise to the journey step page.
  const viewAllHref = (() => {
    if (!step?.slug) return null;
    const slug = item.category_slug || "";
    if (stepNature === "product") {
      return slug ? `/shopping?category=${encodeURIComponent(slug)}` : "/shopping";
    }
    return slug
      ? `/journey/${step.slug}?category=${encodeURIComponent(slug)}`
      : `/journey/${step.slug}`;
  })();

  // Detailed policy descriptors — surfaced in the Policies tab.
  const policyCards = [];
  if (item.policies?.cancellable) {
    policyCards.push({
      icon: <Clock className="h-5 w-5 text-primary" aria-hidden />,
      title: "Cancellable",
      detail: item.policies.cancellation_hours
        ? `Free cancellation up to ${item.policies.cancellation_hours}h before`
        : "Free cancellation available",
    });
  }
  if (item.policies?.returnable) {
    policyCards.push({
      icon: <RotateCcw className="h-5 w-5 text-primary" aria-hidden />,
      title: "Returnable",
      detail: item.policies.return_days
        ? `Returns accepted within ${item.policies.return_days} days`
        : "Easy returns available",
    });
  }
  if (item.policies?.refundable) {
    policyCards.push({
      icon: <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />,
      title: "Refundable",
      detail: "Refund issued after pickup",
    });
  }
  if (item.policies?.replaceable || item.policies?.exchangeable) {
    policyCards.push({
      icon: <Package className="h-5 w-5 text-primary" aria-hidden />,
      title: item.policies.replaceable ? "Replaceable" : "Exchangeable",
      detail: "Wrong size or damage — swap on the house",
    });
  }
  if (item.policies?.warranty_years) {
    policyCards.push({
      icon: <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />,
      title: `${item.policies.warranty_years}-year warranty`,
      detail: "Manufacturer-backed coverage on defects",
    });
  }
  // Slim chip strip too — quick at-a-glance summary near the price.
  const policyChips = [];
  if (item.policies?.cancellable) policyChips.push("Cancellable");
  if (item.policies?.returnable) policyChips.push("Returnable");
  if (item.policies?.refundable) policyChips.push("Refundable");
  if (item.policies?.warranty_years) {
    policyChips.push(`${item.policies.warranty_years}y warranty`);
  }

  // Vendor card "X years on MyShaadiStore" — derive from vendor_created_at if
  // shipped (not exposed yet); fall back to "Active member" copy so we never
  // print a wrong year. NOTE backend: surface vendor.created_at on item API.
  const vendorYears = (() => {
    const created = item.vendor_created_at || item.vendor?.created_at;
    if (!created) return null;
    const ts = new Date(created).getTime();
    if (!Number.isFinite(ts)) return null;
    const years = Math.max(0, Math.floor((Date.now() - ts) / (365.25 * 24 * 3600 * 1000)));
    return years;
  })();

  const vendorInitial = (vendorName || "M").trim().charAt(0).toUpperCase();
  const stockStatus = item.stock_status;
  const minOrderQty = item.attributes?.min_order_qty;

  const trustSignals = [
    {
      icon: <Lock className="h-5 w-5 text-primary" aria-hidden />,
      title: "Secure payments",
      body: "Encrypted checkout via Razorpay",
    },
    {
      icon: <Headphones className="h-5 w-5 text-primary" aria-hidden />,
      title: "Live support",
      body: "10 AM – 8 PM, Monday to Saturday",
    },
    item.policies?.returnable
      ? {
          icon: <RotateCcw className="h-5 w-5 text-primary" aria-hidden />,
          title: "Easy returns",
          body: item.policies.return_days
            ? `Within ${item.policies.return_days} days of delivery`
            : "Hassle-free returns",
        }
      : {
          icon: <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />,
          title: "Verified vendors",
          body: "Hand-picked, KYC-verified partners",
        },
  ];

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "specs", label: "Specifications" },
    { id: "policies", label: "Policies" },
  ];

  return (
    <main className="bg-surface pb-24 md:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-1 text-xs text-muted">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <Link href={stepHref} className="hover:text-primary">
            {step?.title || "Catalog"}
          </Link>
          {item.category_label ? (
            <>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <Link
                href={viewAllHref || stepHref}
                className="hover:text-primary"
              >
                {item.category_label}
              </Link>
            </>
          ) : null}
          <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate text-text">{item.name}</span>
        </nav>

        {/* HERO: gallery (left) + sticky purchase column (right) */}
        <section className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14 lg:items-start">
          {/* Gallery — hero image with thumbnails below */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setZoomOpen(true)}
              className="group relative block aspect-4/3 w-full overflow-hidden rounded-2xl bg-surface-muted shadow-[0_10px_40px_-12px_rgba(15,23,42,0.18)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label="Open image viewer"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: safeCssUrl(images[activeImage] || images[0]) }}
                role="img"
                aria-label={item.name}
              />
              <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_0_1px_rgba(15,23,42,0.05),inset_0_-20px_60px_-25px_rgba(15,23,42,0.22)]" />
              {hasDiscount ? (
                <span className="absolute left-4 top-4 rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-sm">
                  {item.discount_percentage}% OFF
                </span>
              ) : null}
              {/* Zoom affordance — appears on hover */}
              <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-text/70 px-3 py-1.5 text-xs font-semibold text-primary-foreground opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
                <ZoomIn className="h-3.5 w-3.5" aria-hidden />
                Click to zoom
              </span>
              {images.length > 1 ? (
                <span className="absolute bottom-4 right-4 rounded-full bg-text/70 px-2.5 py-1 text-[11px] font-semibold text-primary-foreground backdrop-blur-sm">
                  {activeImage + 1} / {images.length}
                </span>
              ) : null}
            </button>

            {images.length > 1 ? (
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {images.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    type="button"
                    onClick={() => setActiveImage(idx)}
                    className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-surface-muted transition ${
                      idx === activeImage
                        ? "border-primary ring-2 ring-primary/40"
                        : "border-border hover:border-border-strong"
                    }`}
                    aria-label={`Show image ${idx + 1}`}
                    aria-current={idx === activeImage}
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: safeCssUrl(img) }}
                      aria-hidden
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Right column — sticky purchase panel */}
          <div className="flex flex-col lg:sticky lg:top-24">
            {(item.category_label || item.subcategory_label) ? (
              <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                {[item.category_label, item.subcategory_label]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            ) : null}

            <div className="mt-2 flex items-start justify-between gap-3">
              <h1 className="text-2xl font-bold leading-tight text-text sm:text-3xl">
                {item.name}
              </h1>
              <button
                type="button"
                onClick={handleToggleWishlist}
                aria-label={wishlisted ? "Remove from favourites" : "Save to favourites"}
                aria-pressed={wishlisted}
                className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition ${
                  wishlisted
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border-strong bg-surface text-text hover:border-primary hover:text-primary"
                }`}
              >
                <Heart
                  className="h-5 w-5"
                  fill={wishlisted ? "currentColor" : "none"}
                  strokeWidth={2}
                />
              </button>
            </div>

            {/* Rating row */}
            {rating ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted">
                <StarRow value={rating.value} size="lg" />
                <span className="font-semibold text-text">{rating.value.toFixed(1)}</span>
                <span>({rating.count} reviews)</span>
              </div>
            ) : null}

            <div className="mt-3 flex items-center gap-1.5 text-sm text-muted">
              <Store className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>
                Sold by{" "}
                <span className="font-semibold text-text">{vendorName}</span>
              </span>
            </div>

            {/* Price block */}
            <div className="mt-6 rounded-2xl border border-border bg-surface-muted/40 p-5">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-3xl font-bold text-text sm:text-4xl">
                  {formatRupees(finalPrice)}
                </span>
                {hasDiscount && basePrice > finalPrice ? (
                  <>
                    <span className="text-sm text-muted line-through">
                      {formatRupees(basePrice)}
                    </span>
                    <span className="rounded-md bg-primary-soft px-2 py-0.5 text-xs font-bold text-primary">
                      {item.discount_percentage}% OFF
                    </span>
                  </>
                ) : null}
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-success">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                Best price guarantee
              </div>
              {countdown ? (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
                  <Timer className="h-3.5 w-3.5" aria-hidden />
                  Sale ends in {countdown}
                </div>
              ) : null}
            </div>

            {/* Variant selector — only when this item has variants */}
            {hasVariants ? (
              <VariantSelector
                options={variantOptions}
                allVariants={variantsData?.variants || []}
                selected={selectedVariant}
                onChange={(patch) => setSelectedVariant((prev) => ({ ...prev, ...patch }))}
                matched={matchedVariant}
              />
            ) : null}

            {/* Location + product extras row */}
            {(locationStr || stepNature === "product") ? (
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                {locationStr ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-text">
                    <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                    {locationStr}
                  </span>
                ) : null}
                {stepNature === "product" && stockStatus === "in_stock" ? (
                  <span className="rounded-md bg-success/10 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-success">
                    In stock
                  </span>
                ) : stepNature === "product" && stockStatus === "made_to_order" ? (
                  <span className="rounded-md bg-warning/15 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-warning">
                    Made to order
                  </span>
                ) : null}
                {stepNature === "product" && minOrderQty ? (
                  <span className="rounded-md border border-border bg-surface-muted px-2 py-1 text-xs font-medium text-text">
                    Min order: {minOrderQty}
                  </span>
                ) : null}
              </div>
            ) : null}

            {/* Policy chips — quick scan summary */}
            {policyChips.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {policyChips.map((chip) => (
                  <span
                    key={chip}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-muted px-2.5 py-1 text-xs font-medium text-text"
                  >
                    <Check className="h-3 w-3 text-success" aria-hidden />
                    {chip}
                  </span>
                ))}
              </div>
            ) : null}

            {/* Action buttons / qty steppers — sit ABOVE the trust signals
                so the primary CTA is the first thing in the purchase column
                after the price/variant/policy chip block. */}
            <div className="mt-6 space-y-3">
              {supportsShoppingCart ? (
                inShoppingCart ? (
                  <CartQtyStepper
                    label="In cart"
                    quantity={inShoppingCart.quantity}
                    onDecrease={() =>
                      updateCartQuantity(
                        "shopping",
                        item.item_id,
                        Math.max(1, inShoppingCart.quantity - 1),
                      )
                    }
                    onIncrease={() =>
                      updateCartQuantity(
                        "shopping",
                        item.item_id,
                        inShoppingCart.quantity + 1,
                      )
                    }
                    onRemove={() => {
                      removeFromCart("shopping", item.item_id);
                      toast.message("Removed from cart");
                    }}
                  />
                ) : (
                  <AddButton
                    primary
                    onClick={handleAddToShoppingCart}
                    icon={<ShoppingCart className="h-4 w-4" aria-hidden />}
                    label="Add to Cart"
                    justAdded={justAdded.shopping}
                  />
                )
              ) : null}

              {inInquiryCart ? (
                <CartQtyStepper
                  label="In inquiry"
                  quantity={inInquiryCart.quantity}
                  onDecrease={() =>
                    updateCartQuantity(
                      "quotation",
                      item.item_id,
                      Math.max(1, inInquiryCart.quantity - 1),
                    )
                  }
                  onIncrease={() =>
                    updateCartQuantity(
                      "quotation",
                      item.item_id,
                      inInquiryCart.quantity + 1,
                    )
                  }
                  onRemove={() => {
                    removeFromCart("quotation", item.item_id);
                    toast.message("Removed from inquiry");
                  }}
                />
              ) : (
                <AddButton
                  primary={!supportsShoppingCart}
                  onClick={handleAddToInquiry}
                  icon={<ClipboardList className="h-4 w-4" aria-hidden />}
                  label="Add to Inquiry"
                  justAdded={justAdded.quotation}
                />
              )}
            </div>

            {/* Trust signal cards — sit below the CTA so the user reads
                "Secure payments / Live support / Easy returns" right after
                committing to add, not before. 3 across desktop, scrollable
                strip on mobile. */}
            <div className="mt-6 -mx-1 flex gap-3 overflow-x-auto px-1 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:px-0">
              {trustSignals.map((sig) => (
                <div
                  key={sig.title}
                  className="flex min-w-45 shrink-0 flex-col gap-2 rounded-2xl border border-border bg-surface p-3 shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] sm:min-w-0 sm:shrink"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary-soft">
                    {sig.icon}
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-text">{sig.title}</div>
                    <div className="mt-0.5 text-[11px] leading-4 text-muted">{sig.body}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Vendor info card */}
            <div className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
              <div className="flex items-start gap-3">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-soft text-lg font-bold text-primary"
                  aria-hidden
                >
                  {vendorInitial}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-base font-bold text-text">{vendorName}</div>
                    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
                      <BadgeCheck className="h-3 w-3" aria-hidden />
                      Verified
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted">
                    {whiteLabelOn
                      ? "Fulfilled end-to-end by MyShaadiStore"
                      : vendorYears != null
                      ? `${vendorYears === 0 ? "New" : `${vendorYears}+ year${vendorYears === 1 ? "" : "s"}`} on MyShaadiStore`
                      : "Active member on MyShaadiStore"}
                  </div>
                </div>
              </div>
              {!whiteLabelOn ? (
                <button
                  type="button"
                  onClick={() =>
                    // Stubbed — wiring TBD when vendor inbox lands.
                    // eslint-disable-next-line no-console
                    console.log("[PDP] Message vendor stub", { vendorName })
                  }
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-semibold text-text transition hover:border-primary hover:text-primary"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  Message vendor
                </button>
              ) : null}
            </div>
          </div>
        </section>

        {/* TABS: Overview / Specifications / Policies / Reviews */}
        <section className="mt-14">
          <div className="border-b border-border">
            <div className="-mx-1 flex gap-1 overflow-x-auto px-1">
              {TABS.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative shrink-0 px-4 py-3 text-sm transition-colors duration-200 ${
                      active
                        ? "font-bold text-text"
                        : "font-medium text-muted hover:text-text"
                    }`}
                    aria-current={active ? "true" : undefined}
                  >
                    {tab.label}
                    <span
                      className={`absolute inset-x-3 -bottom-px h-0.5 rounded-t-md bg-primary transition-all duration-300 ${
                        active ? "opacity-100" : "opacity-0"
                      }`}
                      aria-hidden
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            {activeTab === "overview" ? (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-10">
                <div className="space-y-6">
                  {item.description ? (
                    <div>
                      <h2 className="text-base font-bold text-text">About this item</h2>
                      <p className="mt-2 text-sm leading-7 text-muted">{item.description}</p>
                    </div>
                  ) : null}

                  {/* What's included (package) */}
                  {stepNature === "package" && inclusions.length > 0 ? (
                    <div className="rounded-2xl border border-border bg-surface p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                      <div className="mb-3 flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" aria-hidden />
                        <h3 className="text-base font-bold text-text">What&apos;s included</h3>
                      </div>
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {inclusions.map((line) => (
                          <li key={line} className="flex items-start gap-2 text-sm text-text">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {/* Product: bulk pricing slabs */}
                  {stepNature === "product" && bulkSlabs.length > 0 ? (
                    <div className="rounded-2xl border border-border bg-surface p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                      <h3 className="mb-3 text-base font-bold text-text">Bulk pricing</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                              <th className="py-2 pr-4 font-semibold">Quantity</th>
                              <th className="py-2 pr-4 font-semibold">Price / unit</th>
                              <th className="py-2 font-semibold">You save</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bulkSlabs.map((slab, idx) => (
                              <tr key={idx} className="border-b border-border last:border-0">
                                <td className="py-2 pr-4 text-text">
                                  {slab.min_qty ? `${slab.min_qty}+` : slab.range || `Tier ${idx + 1}`}
                                </td>
                                <td className="py-2 pr-4 text-text">
                                  {slab.price != null ? formatRupees(slab.price) : "—"}
                                </td>
                                <td className="py-2 text-success">
                                  {slab.discount_pct ? `${slab.discount_pct}% off` : ""}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Side panel: service details (package only) */}
                <div className="space-y-6">
                  {stepNature === "package" &&
                  (durationLabel || citiesServed.length > 0 || outstationCharges) ? (
                    <div className="rounded-2xl border border-border bg-surface p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                      <h3 className="mb-4 text-base font-bold text-text">Service details</h3>
                      <div className="space-y-4 text-sm">
                        {durationLabel ? (
                          <div className="flex items-start gap-3">
                            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-soft">
                              <Clock className="h-4 w-4 text-primary" aria-hidden />
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold uppercase tracking-wide text-muted">
                                Duration
                              </div>
                              <div className="mt-0.5 text-sm font-medium text-text">
                                {durationLabel}
                              </div>
                            </div>
                          </div>
                        ) : null}
                        {citiesServed.length > 0 ? (
                          <div className="flex items-start gap-3">
                            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-soft">
                              <MapPin className="h-4 w-4 text-primary" aria-hidden />
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold uppercase tracking-wide text-muted">
                                Cities served
                              </div>
                              <div className="mt-1 flex flex-wrap gap-1.5">
                                {citiesServed.map((c) => (
                                  <span
                                    key={c}
                                    className="rounded-md border border-border bg-surface-muted px-2 py-0.5 text-xs text-text"
                                  >
                                    {c}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : null}
                        {outstationCharges ? (
                          <div className="flex items-start gap-3">
                            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-soft">
                              <Truck className="h-4 w-4 text-primary" aria-hidden />
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold uppercase tracking-wide text-muted">
                                Outstation charges
                              </div>
                              <div className="mt-0.5 text-sm font-medium text-text">
                                {typeof outstationCharges === "number" || /^\d/.test(String(outstationCharges))
                                  ? formatRupees(outstationCharges)
                                  : String(outstationCharges)}
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {activeTab === "specs" ? (
              <div className="rounded-2xl border border-border bg-surface p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] sm:p-6">
                {item.attributes && Object.keys(item.attributes).length > 0 ? (
                  <ItemAttributesSpec item={item} schema={schema} />
                ) : (
                  <p className="text-sm text-muted">
                    No specifications listed for this item yet.
                  </p>
                )}
              </div>
            ) : null}

            {activeTab === "policies" ? (
              policyCards.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {policyCards.map((p) => (
                    <div
                      key={p.title}
                      className="flex items-start gap-4 rounded-2xl border border-border bg-surface p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                    >
                      <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-soft">
                        {p.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-text">{p.title}</div>
                        <div className="mt-1 text-xs leading-5 text-muted">{p.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">No policy information available.</p>
              )
            ) : null}

          </div>
        </section>

        {/* Ratings & Reviews — its own section, below the tabs */}
        <section className="mt-12">
          <ProductReviews itemId={item.item_id} />
        </section>

        {/* "You might also like" */}
        {relatedItems.length > 0 ? (
          <section className="mt-16 border-t border-border pt-10">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="h-8 w-1.5 shrink-0 rounded-md bg-primary" aria-hidden />
                <h2 className="text-2xl font-bold text-text">You might also like</h2>
              </div>
              {viewAllHref ? (
                <Link
                  href={viewAllHref}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-hover"
                >
                  View all in {categoryLabel}
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Link>
              ) : null}
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {relatedItems.map((rel) => {
                const wlRel = !rel.vendor_id;
                const relVendor = wlRel
                  ? "MyShaadiStore"
                  : rel.vendor_business_name || rel.vendor_name || "Vendor";
                return (
                  <ItemCardV2
                    key={rel.item_id}
                    item={rel}
                    vendorName={relVendor}
                    whiteLabelOn={wlRel}
                    step={step}
                  />
                );
              })}
            </div>
          </section>
        ) : null}
      </div>

      {/* Mobile bottom action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-4 py-3 shadow-[0_-6px_24px_rgba(15,23,42,0.06)] backdrop-blur md:hidden">
        {inShoppingCart || inInquiryCart ? (
          <div className="space-y-2">
            {inShoppingCart ? (
              <CartQtyStepper
                compact
                label="In cart"
                quantity={inShoppingCart.quantity}
                onDecrease={() =>
                  updateCartQuantity(
                    "shopping",
                    item.item_id,
                    Math.max(1, inShoppingCart.quantity - 1),
                  )
                }
                onIncrease={() =>
                  updateCartQuantity(
                    "shopping",
                    item.item_id,
                    inShoppingCart.quantity + 1,
                  )
                }
                onRemove={() => {
                  removeFromCart("shopping", item.item_id);
                  toast.message("Removed from cart");
                }}
              />
            ) : null}
            {inInquiryCart ? (
              <CartQtyStepper
                compact
                label="In inquiry"
                quantity={inInquiryCart.quantity}
                onDecrease={() =>
                  updateCartQuantity(
                    "quotation",
                    item.item_id,
                    Math.max(1, inInquiryCart.quantity - 1),
                  )
                }
                onIncrease={() =>
                  updateCartQuantity(
                    "quotation",
                    item.item_id,
                    inInquiryCart.quantity + 1,
                  )
                }
                onRemove={() => {
                  removeFromCart("quotation", item.item_id);
                  toast.message("Removed from inquiry");
                }}
              />
            ) : null}
            <Link
              href="/cart"
              className="block text-center text-[11px] font-semibold text-muted hover:text-primary"
            >
              View basket →
            </Link>
          </div>
        ) : (
          <div className="flex gap-2">
            {supportsShoppingCart ? (
              <button
                type="button"
                onClick={handleAddToShoppingCart}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-3 text-sm font-bold shadow-sm transition-all duration-300 ${
                  justAdded.shopping
                    ? "bg-success text-primary-foreground"
                    : "bg-primary text-primary-foreground hover:bg-primary-hover"
                }`}
              >
                {justAdded.shopping ? (
                  <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
                ) : (
                  <ShoppingCart className="h-4 w-4" aria-hidden />
                )}
                {justAdded.shopping ? "Added" : "Add to Cart"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleAddToInquiry}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-3 text-sm font-bold transition-all duration-300 ${
                justAdded.quotation
                  ? "bg-success text-primary-foreground"
                  : supportsShoppingCart
                  ? "border border-primary bg-surface text-primary hover:bg-primary-soft"
                  : "bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover"
              }`}
            >
              {justAdded.quotation ? (
                <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
              ) : (
                <ClipboardList className="h-4 w-4" aria-hidden />
              )}
              {justAdded.quotation ? "Added" : "Add to Inquiry"}
            </button>
          </div>
        )}
      </div>

      <div className="hidden md:block">
        <BasketButton floating />
      </div>

      {/* Click-to-zoom modal */}
      {zoomOpen ? (
        <ImageZoomModal
          images={images}
          index={activeImage}
          onClose={() => setZoomOpen(false)}
          onIndex={setActiveImage}
        />
      ) : null}
    </main>
  );
}

/* ------------------------- Small subcomponents ------------------------- */

function AddButton({ onClick, icon, label, primary = true, justAdded = false }) {
  const flashCls = "bg-success text-primary-foreground shadow-[0_8px_22px_rgba(34,197,94,0.35)]";
  const baseCls = primary
    ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover"
    : "border border-primary bg-surface text-primary hover:bg-primary-soft";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={justAdded}
      className={`flex w-full items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-bold transition-all duration-300 ${
        justAdded ? flashCls : baseCls
      }`}
    >
      {justAdded ? (
        <Check className="h-4 w-4 animate-in zoom-in-50 duration-300" strokeWidth={3} aria-hidden />
      ) : (
        icon
      )}
      {justAdded ? "Added" : label}
    </button>
  );
}

/**
 * Variant selector — renders only the option groups the item actually has.
 * Currently shown groups: size, color, material. Backend may expose more
 * keys later (length / pattern / finish) — extend `GROUPS` to surface them.
 *
 * `matched` is the concrete variant row that pairs with the current
 * selection; we use it to print stock state + SKU below the chips so the
 * shopper understands what they're about to buy.
 */
/**
 * Helpers for the variant selector.
 *
 * bestVariantForValue: when the user hovers/picks a single dimension's value,
 * pick the most-relevant variant for that value while preserving the other
 * dimensions if they're still compatible. Used to source the thumbnail
 * image for the colour swatch and to detect whether a value is in stock.
 */
function bestVariantForValue(allVariants, dim, value, selection, allDims) {
  const candidates = allVariants.filter((v) => v[dim] === value);
  if (!candidates.length) return null;
  // Score: prefer in-stock + matches as many other selected dimensions as possible
  return candidates
    .map((v) => {
      let score = 0;
      if ((v.stock_quantity ?? 0) > 0) score += 100;
      for (const d of allDims) {
        if (d !== dim && selection[d] && v[d] === selection[d]) score += 10;
      }
      return { v, score };
    })
    .sort((a, b) => b.score - a.score)[0]?.v;
}

function valueInStock(allVariants, dim, value) {
  return allVariants.some((v) => v[dim] === value && (v.stock_quantity ?? 0) > 0);
}

function VariantSelector({ options, allVariants, selected, onChange, matched }) {
  const GROUPS = [
    { key: "color", label: "Colour", values: options.colors || [] },
    { key: "size", label: "Size", values: options.sizes || [] },
    { key: "material", label: "Material", values: options.materials || [] },
  ].filter((g) => g.values.length > 0);

  if (GROUPS.length === 0) return null;

  const dims = GROUPS.map((g) => g.key);

  const stock = matched ? Number(matched.stock_quantity || 0) : null;
  const outOfStock = matched && stock <= 0;

  return (
    <div className="mt-5 rounded-2xl border border-border bg-surface p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
      <div className="space-y-5">
        {GROUPS.map((group) => (
          <div key={group.key}>
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-semibold uppercase tracking-wide text-muted">
                {group.label}: <span className="text-text">{selected[group.key] || "Pick one"}</span>
              </span>
              <span className="text-[11px] text-muted">{group.values.length} option{group.values.length === 1 ? "" : "s"}</span>
            </div>

            {group.key === "color" ? (
              // Amazon/Flipkart-style colour swatches with thumbnails
              <div className="flex flex-wrap gap-2.5">
                {group.values.map((v) => {
                  const active = selected[group.key] === v;
                  const inStock = valueInStock(allVariants, group.key, v);
                  const bestV = bestVariantForValue(allVariants, group.key, v, selected, dims);
                  const thumb = bestV?.images?.[0];
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => onChange({ [group.key]: v })}
                      disabled={!inStock}
                      aria-pressed={active}
                      title={v + (inStock ? "" : " (out of stock)")}
                      className={`group relative flex flex-col items-center gap-1 ${!inStock ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <span
                        className={`relative block size-14 overflow-hidden rounded-lg border-2 transition ${
                          active
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-border hover:border-border-strong"
                        }`}
                      >
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt={v} className="size-full object-cover" />
                        ) : (
                          <span
                            className="absolute inset-0"
                            style={{
                              backgroundColor: v.startsWith("#") ? v : undefined,
                              backgroundImage: !v.startsWith("#")
                                ? "linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%)"
                                : undefined,
                            }}
                          />
                        )}
                        {!inStock && (
                          <span className="absolute inset-0 flex items-center justify-center bg-surface/70 text-[9px] font-bold uppercase tracking-wider text-danger">
                            OOS
                          </span>
                        )}
                      </span>
                      <span className={`max-w-16 truncate text-[11px] font-medium ${active ? "text-primary" : "text-text"}`}>{v}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              // Pill buttons for size / material
              <div className="flex flex-wrap gap-2">
                {group.values.map((v) => {
                  const active = selected[group.key] === v;
                  const inStock = valueInStock(allVariants, group.key, v);
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => onChange({ [group.key]: v })}
                      disabled={!inStock}
                      aria-pressed={active}
                      className={`relative inline-flex min-w-[44px] items-center justify-center rounded-md border px-3.5 py-2 text-sm font-semibold transition ${
                        active
                          ? "border-primary bg-primary-soft text-primary shadow-[0_0_0_1px_var(--primary)_inset]"
                          : inStock
                          ? "border-border bg-surface text-text hover:border-border-strong"
                          : "border-border bg-surface-muted text-muted line-through cursor-not-allowed"
                      }`}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {matched ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <div className="flex items-center gap-2 text-xs text-muted">
            {matched.sku ? (
              <span>
                SKU: <span className="font-mono font-semibold text-text">{matched.sku}</span>
              </span>
            ) : null}
          </div>
          {outOfStock ? (
            <span className="rounded-md bg-danger/10 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-danger">
              Out of stock
            </span>
          ) : stock <= 5 ? (
            <span className="rounded-md bg-warning/15 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-warning">
              Only {stock} left
            </span>
          ) : (
            <span className="rounded-md bg-success/10 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-success">
              {stock} in stock
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}

function CartQtyStepper({ label, quantity, onDecrease, onIncrease, onRemove, compact = false }) {
  const padCls = compact ? "px-3 py-2" : "px-4 py-3";
  const titleCls = compact ? "text-[11px]" : "text-xs";
  const qtyCls = compact ? "text-base" : "text-lg";
  const btnCls = compact ? "h-7 w-7" : "h-9 w-9";

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border border-success/30 bg-success/5 ${padCls} shadow-[0_1px_0_rgba(15,23,42,0.02)]`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success text-primary-foreground">
          <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
        </span>
        <div className="min-w-0">
          <div className={`font-semibold uppercase tracking-wide text-success ${titleCls}`}>
            {label}
          </div>
          <div className={`font-bold leading-tight text-text ${qtyCls}`}>
            {quantity} <span className="text-xs font-medium text-muted">in basket</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1 rounded-full border border-border-strong bg-surface p-1">
          <button
            type="button"
            onClick={onDecrease}
            className={`${btnCls} inline-flex items-center justify-center rounded-full text-base font-semibold text-text transition hover:bg-surface-muted disabled:opacity-40`}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            &minus;
          </button>
          <span className={`min-w-6 text-center text-sm font-bold text-text`}>{quantity}</span>
          <button
            type="button"
            onClick={onIncrease}
            className={`${btnCls} inline-flex items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground transition hover:bg-primary-hover`}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove from basket"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-danger/10 hover:text-danger"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
