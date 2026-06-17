"use client";

/**
 * Generic Product Detail Page (PDP) — works for items from ANY journey step.
 *
 * Layout (Myntra/Amazon-inspired):
 *   - LEFT: sticky image gallery (stays pinned while the right column scrolls).
 *   - RIGHT: all buy + detail content — title, vendor, price, variants, CTAs,
 *     "About this item" (show more), specifications, and returns/policies as
 *     stacked sections (no tabs).
 *   - BELOW (full width): "You might also like", then Ratings & Reviews last.
 *
 * Cart wiring:
 *   - Shopping items (step.slug === "shopping"): TWO buttons —
 *     "Add to shopping cart" (shopping) + "Add to quote cart" (quotation).
 *   - Every other journey step: ONE "Add to cart" → quotation (inquiry).
 *
 * Variants: per-variant size / colour / material with per-variant images. The
 * left gallery swaps to the selected colour's photos (variant images override
 * item-level images). Data comes from GET /items/:id/variants.
 *
 * White-label: customer API strips vendor identity when WL is on, so we detect
 * via `!item.vendor_id` and substitute "MyShaadiStore".
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { toast } from "sonner";
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
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
  Ruler,
  Heart,
  X,
  ZoomIn,
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
import useSiteConfig from "@/lib/useSiteConfig";
import useSizeChart from "@/lib/useSizeChart";
import BasketButton from "@/components/BasketButton";
import ItemCardV2 from "@/components/ItemCardV2";
import VerifiedBadge from "@/components/VerifiedBadge";
import ItemAttributesSpec from "@/components/ItemAttributesSpec";
import ProductReviews from "@/components/ProductReviews";

const FALLBACK_IMAGE =""

  // "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80";

// Fallback nature lookup mirrors `mss-admin/src/lib/constants/journeySteps.js`.
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
  const v = attrs.duration_hours ?? attrs.coverage_hours ?? attrs.hours_covered ?? attrs.duration;
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? `${n}h` : String(v);
}

/* --------------------------- Image zoom modal ---------------------------- */
function ImageZoomModal({ images, index, onClose, onIndex }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && images.length > 1) onIndex((index + 1) % images.length);
      if (e.key === "ArrowLeft" && images.length > 1) onIndex((index - 1 + images.length) % images.length);
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [images.length, index, onClose, onIndex]);

  if (typeof document === "undefined") return null;

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
      <div className="relative h-[80vh] w-[90vw] max-w-5xl" onClick={(e) => e.stopPropagation()}>
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

/* --------------------------- Size chart modal ---------------------------- */
// Renders the admin-managed size-chart tables (from /api/v1/size-chart). Opened
// from the "Size chart" link beside the size selector — the Myntra pattern.
function SizeChartModal({ onClose }) {
  const { sizeChart } = useSizeChart();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;
  const tables = sizeChart?.tables || [];

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-text-strong/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Size chart"
      onClick={onClose}
    >
      <div
        className="scrollbar-themed max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-surface p-6 shadow-[0_24px_80px_rgba(15,23,42,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold text-text">{sizeChart?.heading || "Size Chart"}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 rounded-full p-2 text-subtle transition hover:bg-surface-muted"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        {sizeChart?.intro ? <p className="mt-1 text-sm text-muted">{sizeChart.intro}</p> : null}

        {tables.length ? (
          tables.map((t, ti) => (
            <div key={ti} className="mt-5">
              {t.title ? <h4 className="mb-2 text-sm font-bold text-text">{t.title}</h4> : null}
              <div className="scrollbar-themed overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-muted text-left">
                      {t.columns.map((c, ci) => (
                        <th key={ci} className="whitespace-nowrap px-3 py-2 font-semibold text-text">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {t.rows.map((r, ri) => (
                      <tr key={ri} className="border-t border-border">
                        {t.columns.map((_, ci) => (
                          <td key={ci} className="whitespace-nowrap px-3 py-2 text-muted">
                            {r[ci] || "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {t.note ? <p className="mt-1.5 text-xs text-muted">{t.note}</p> : null}
            </div>
          ))
        ) : (
          <p className="mt-4 text-sm text-muted">A detailed size guide will be available soon.</p>
        )}

        <div className="mt-6 text-right">
          <Link
            href="/size-chart"
            className="text-xs font-semibold text-primary hover:text-primary-hover"
          >
            Open full size guide →
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ----------------------------- Detail section ---------------------------- */
function Section({ title, action, children }) {
  return (
    <section className="border-t border-border pt-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-text">{title}</h2>
        {action || null}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function ProductDetailPage({ itemId }) {
  const [item, setItem] = useState(null);
  const [step, setStep] = useState(null);
  const [schema, setSchema] = useState(null);
  const [relatedItems, setRelatedItems] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const [galleryHover, setGalleryHover] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [openPolicies, setOpenPolicies] = useState({});
  const [variantsData, setVariantsData] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState({ size: "", color: "", material: "" });
  const [justAdded, setJustAdded] = useState({ shopping: false, quotation: false });
  const justAddedTimers = useRef({});
  const cartState = useCartState();

  // Tri-state reviews toggle. "disabled" hides the rating row AND the reviews section.
  const { config } = useSiteConfig();
  const reviewsMode = config.reviews_mode;
  const [reviewSummary, setReviewSummary] = useState(null);
  const handleReviewSummary = useCallback((s) => setReviewSummary(s), []);

  // Tick once a minute so the sale-ends countdown stays fresh.
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(
    () => () => {
      Object.values(justAddedTimers.current).forEach((t) => clearTimeout(t));
    },
    [],
  );

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
        setDescExpanded(false);
        setReviewSummary(null);
        const resolved = resolveStep(steps, fetched);
        setStep(resolved);

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
              setRelatedItems(pool.filter((it) => it.item_id !== fetched.item_id).slice(0, 4));
            })
            .catch(() => {});
        }

        // Variants — endpoint returns an empty options map for items with none.
        fetchItemVariants(fetched.item_id || itemId)
          .then((res) => {
            if (cancelled) return;
            if (!res) return;
            setVariantsData(res);
            // Pre-select the admin-set DEFAULT variant (is_default), falling back
            // to the first variant, then to the first of each option list.
            const vArr = Array.isArray(res?.variants) ? res.variants : [];
            const def = vArr.find((v) => v.is_default) || vArr[0] || null;
            setSelectedVariant({
              size: def?.size || res?.options?.sizes?.[0] || "",
              color: def?.color || res?.options?.colors?.[0] || "",
              material: def?.material || res?.options?.materials?.[0] || "",
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
    return whiteLabelOn ? "MyShaadiStore" : item.vendor_business_name || item.vendor_name || "Vendor";
  }, [item, whiteLabelOn]);
  const isSellerVerified = whiteLabelOn || !!item?.vendor_is_verified;

  const variantOptions = variantsData?.options || {};
  const hasSizes = (variantOptions.sizes || []).length > 0;
  const hasColors = (variantOptions.colors || []).length > 0;
  const hasMaterials = (variantOptions.materials || []).length > 0;
  const hasVariants = hasSizes || hasColors || hasMaterials;

  const matchedVariant = useMemo(() => {
    if (!variantsData || !Array.isArray(variantsData.variants) || !hasVariants) return null;
    return (
      variantsData.variants.find((v) => {
        if (hasSizes && v.size !== selectedVariant.size) return false;
        if (hasColors && v.color !== selectedVariant.color) return false;
        if (hasMaterials && v.material !== selectedVariant.material) return false;
        return true;
      }) || null
    );
  }, [variantsData, selectedVariant, hasSizes, hasColors, hasMaterials, hasVariants]);

  // Smart variant pick: lock the dimension the shopper just changed and, if the
  // resulting combo isn't a real in-stock variant, re-resolve the OTHER
  // dimensions to a valid in-stock combo that still contains the new value — so
  // selecting "L" snaps the material to an L that's actually in stock instead of
  // leaving a dead, unbuyable selection.
  const pickVariant = useCallback(
    (patch) => {
      setSelectedVariant((prev) => {
        const next = { ...prev, ...patch };
        const variants = variantsData?.variants || [];
        if (!variants.length) return next;
        const dimKeys = [hasColors && "color", hasSizes && "size", hasMaterials && "material"].filter(Boolean);
        const changedDim = Object.keys(patch)[0];
        const inStock = (v) => (v.stock_quantity ?? 0) > 0;
        const matchesAll = (v, sel) => dimKeys.every((d) => !sel[d] || v[d] === sel[d]);
        // Current combo already a real in-stock variant → keep it.
        if (variants.some((v) => matchesAll(v, next) && inStock(v))) return next;
        // Otherwise find the best in-stock variant that keeps the changed value.
        const candidate = variants
          .filter((v) => inStock(v) && (!changedDim || v[changedDim] === next[changedDim]))
          .sort((a, b) => (b.stock_quantity || 0) - (a.stock_quantity || 0))[0];
        if (!candidate) return next; // nothing in stock for this value — leave as-is (shows N/A)
        const fixed = { ...next };
        for (const d of dimKeys) {
          if (d !== changedDim && candidate[d]) fixed[d] = candidate[d];
        }
        return fixed;
      });
    },
    [variantsData, hasColors, hasSizes, hasMaterials],
  );

  // Gallery swaps to the selected variant's images (Amazon/Flipkart pattern),
  // falling back to item-level images when the variant has none.
  const images = useMemo(() => {
    if (matchedVariant?.images?.length) return matchedVariant.images;
    if (!item) return [FALLBACK_IMAGE];
    if (Array.isArray(item.images) && item.images.length) return item.images;
    return [FALLBACK_IMAGE];
  }, [item, matchedVariant]);

  useEffect(() => {
    setActiveImage(0);
  }, [matchedVariant?.variant_id]);

  // Auto-advance the gallery every 5s. Pauses while the zoom modal is open or
  // the user is hovering the gallery, so it never fights a deliberate look.
  useEffect(() => {
    if (images.length <= 1 || zoomOpen || galleryHover) return undefined;
    const t = setInterval(() => {
      setActiveImage((i) => (i + 1) % images.length);
    }, 5000);
    return () => clearInterval(t);
  }, [images.length, zoomOpen, galleryHover]);

  const hasDiscount = item?.is_discount_active && Number(item.discount_percentage) > 0;
  const variantBase = Number(matchedVariant?.price || 0);
  const basePrice = variantBase > 0 ? variantBase : Number(item?.price ?? 0);
  const finalPrice = hasDiscount
    ? Math.round(basePrice * (1 - Number(item.discount_percentage) / 100))
    : Number(item?.final_price ?? basePrice);

  // Shopping items get the dual cart (quote + shopping); every other journey
  // step gets a single "Add to cart" (quotation/inquiry).
  const isShoppingItem = String(step?.slug || "").toLowerCase() === "shopping";
  const stepNature = useMemo(() => resolveStepNature(step), [step]);

  const rating = useMemo(() => (item ? resolveRating(item) : null), [item]);
  const headlineRating = useMemo(() => {
    if (reviewSummary) {
      const count = Number(reviewSummary.count) || 0;
      if (count <= 0) return null;
      return { value: Number(reviewSummary.avgRating) || 0, count };
    }
    return rating;
  }, [reviewSummary, rating]);

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
    return Array.isArray(raw) ? raw : [];
  }, [item]);

  const countdown = useMemo(() => {
    if (!hasDiscount || !item?.discount?.is_enabled) return null;
    return formatCountdown(item.discount?.ends_at);
  }, [hasDiscount, item]);

  const savings = useMemo(() => {
    if (!hasDiscount || basePrice <= finalPrice) return null;
    const amount = basePrice - finalPrice;
    const pct = Math.round((amount / basePrice) * 100);
    return { amount, pct };
  }, [hasDiscount, basePrice, finalPrice]);

  function buildCartPayload() {
    if (!item) return null;
    const variantTag = matchedVariant
      ? [matchedVariant.size, matchedVariant.color, matchedVariant.material].filter(Boolean).join(" / ")
      : "";
    return {
      ...item,
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
            variant_size: matchedVariant.size || "",
            variant_color: matchedVariant.color || "",
            variant_material: matchedVariant.material || "",
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

  const wishlistKind = isShoppingItem ? "shopping" : "journey";
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
    toast.success("Added to quote cart");
    flashAdded("quotation");
  }

  function handleAddToShoppingCart() {
    const payload = buildCartPayload();
    if (!payload) return;
    addToCart("shopping", payload, 1);
    toast.success("Added to shopping cart");
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
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  const stepHref = step?.slug ? `/journey/${step.slug}` : "/";
  const categoryLabel = item.category_label || step?.title || "Catalog";

  const viewAllHref = (() => {
    if (!step?.slug) return null;
    const slug = item.category_slug || "";
    if (stepNature === "product") {
      return slug ? `/shopping?category=${encodeURIComponent(slug)}` : "/shopping";
    }
    return slug ? `/journey/${step.slug}?category=${encodeURIComponent(slug)}` : `/journey/${step.slug}`;
  })();

  // Policy descriptors (canonical keys written by the admin/vendor item forms).
  const pol = item.policies || {};
  const cancellationHours = pol.cancellation_window_hours;
  const returnDays = pol.return_window_days;
  const refundDays = pol.refund_window_days;
  const replacementDays = pol.replacement_window_days;
  const replacementText = pol.replacement_policy_text || pol.exchange_policy_text || null;

  const policyCards = [];
  if (pol.cancellable) {
    policyCards.push({
      icon: <Clock className="h-5 w-5 text-primary" aria-hidden />,
      title: "Cancellable",
      detail: cancellationHours
        ? `Free cancellation up to ${cancellationHours}h after ordering`
        : "Free cancellation available",
      text: pol.cancellation_policy_text || null,
    });
  }
  if (pol.returnable) {
    policyCards.push({
      icon: <RotateCcw className="h-5 w-5 text-primary" aria-hidden />,
      title: "Returnable",
      detail: returnDays ? `Returns accepted within ${returnDays} days of delivery` : "Easy returns available",
      text: pol.return_policy_text || null,
    });
  }
  if (pol.refundable) {
    policyCards.push({
      icon: <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />,
      title: "Refundable",
      detail: refundDays ? `Refund processed within ${refundDays} days` : "Refund issued after pickup",
      text: pol.refund_policy_text || null,
    });
  }
  if (pol.replaceable) {
    policyCards.push({
      icon: <Package className="h-5 w-5 text-primary" aria-hidden />,
      title: "Replacement",
      detail: replacementDays
        ? `Replacement within ${replacementDays} day${replacementDays === 1 ? "" : "s"}`
        : "Wrong size or damage — swap on the house",
      text: replacementText,
    });
  }
  if (pol.warranty_years) {
    policyCards.push({
      icon: <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />,
      title: `${pol.warranty_years}-year warranty`,
      detail: "Manufacturer-backed coverage on defects",
    });
  }

  const policyChips = [];
  if (pol.cancellable) policyChips.push("Cancellable");
  if (pol.returnable) policyChips.push("Returnable");
  if (pol.refundable) policyChips.push("Refundable");
  if (pol.replaceable) policyChips.push("Replacement");
  if (pol.warranty_years) policyChips.push(`${pol.warranty_years}y warranty`);

  const vendorInitial = (vendorName || "M").trim().charAt(0).toUpperCase();
  const vendorLogo = item.vendor_logo_url || item.vendor?.logo_url || "";
  const stockStatus = item.stock_status;
  const minOrderQty = item.attributes?.min_order_qty;

  const selectedStock = matchedVariant ? Number(matchedVariant.stock_quantity || 0) : null;
  const selectedOutOfStock = matchedVariant != null && selectedStock <= 0;

  const hasSpecs = item.attributes && Object.keys(item.attributes).length > 0;
  const desc = item.description || "";
  const isLongDesc = desc.length > 280;

  const galleryAspect = isShoppingItem ? "aspect-[4/5]" : "aspect-[4/3]";

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
              <Link href={viewAllHref || stepHref} className="hover:text-primary">
                {item.category_label}
              </Link>
            </>
          ) : null}
          <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate text-text">{item.name}</span>
        </nav>

        {/* Two-column: sticky gallery (left) + scrolling detail column (right) */}
        <section className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12 lg:items-start">
          {/* LEFT — sticky gallery */}
          <div
            className="space-y-3 lg:sticky lg:top-24 lg:self-start"
            onMouseEnter={() => setGalleryHover(true)}
            onMouseLeave={() => setGalleryHover(false)}
          >
            <button
              type="button"
              onClick={() => setZoomOpen(true)}
              className={`group relative mx-auto block ${galleryAspect} max-h-[78vh] w-full overflow-hidden rounded-lg bg-surface-muted shadow-[0_10px_40px_-12px_rgba(15,23,42,0.18)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40`}
              aria-label="Open image viewer"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: safeCssUrl(images[activeImage] || images[0]) }}
                role="img"
                aria-label={item.name}
              />
              <div className="pointer-events-none absolute inset-0 rounded-lg shadow-[inset_0_0_0_1px_rgba(15,23,42,0.05)]" />
              {hasDiscount ? (
                <span className="absolute left-4 top-4 rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-sm">
                  {item.discount_percentage}% OFF
                </span>
              ) : null}
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
                    className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-surface-muted transition ${
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

          {/* RIGHT — buy + detail column */}
          <div className="min-w-0">
            {item.category_label || item.subcategory_label ? (
              <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                {[item.category_label, item.subcategory_label].filter(Boolean).join(" · ")}
              </div>
            ) : null}

            <div className="mt-2 flex items-start justify-between gap-3">
              <h1 className="text-2xl font-medium leading-tight text-text">{item.name}</h1>
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
                <Heart className="h-5 w-5" fill={wishlisted ? "currentColor" : "none"} strokeWidth={2} />
              </button>
            </div>

            {/* Vendor identity — avatar (left) · name · verified tick (right) + rating */}
            <div className="mt-4 flex items-center gap-3 border-b border-border pb-4">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-sm font-bold text-primary">
                {vendorLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={vendorLogo} alt={vendorName} className="h-full w-full object-cover" />
                ) : (
                  vendorInitial
                )}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold text-text">{vendorName}</span>
                  {isSellerVerified ? <VerifiedBadge size="sm" /> : null}
                </div>
                {reviewsMode !== "disabled" && headlineRating ? (
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                    <Star className="h-3.5 w-3.5 text-warning" fill="currentColor" strokeWidth={2} aria-hidden />
                    <span className="font-semibold text-text">{headlineRating.value.toFixed(1)}</span>
                    <span>
                      ({headlineRating.count} review{headlineRating.count === 1 ? "" : "s"})
                    </span>
                  </div>
                ) : (
                  <div className="mt-0.5 text-xs text-muted">
                    {whiteLabelOn ? "Fulfilled by MyShaadiStore" : "Verified partner"}
                  </div>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="mt-5 flex gap-4 rounded-lg border border-border bg-surface p-5">
              {/* <span className="w-1 shrink-0 rounded-full bg-primary" aria-hidden /> */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-3xl font-semibold text-text sm:text-4xl">{formatRupees(finalPrice)}</span>
                  {hasDiscount && basePrice > finalPrice ? (
                    <>
                      <span className="text-sm text-muted line-through">{formatRupees(basePrice)}</span>
                      <span className="rounded-md bg-primary/10 px-2.5 py-1 text-sm font-bold text-primary">
                        {item.discount_percentage}% OFF
                      </span>
                    </>
                  ) : null}
                </div>
                {savings ? (
                  <div className="mt-2 text-sm font-semibold text-success">
                    You save {formatRupees(savings.amount)} ({savings.pct}%)
                  </div>
                ) : null}
                <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                  Best price guarantee · inclusive of all taxes
                </div>
                {countdown ? (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
                    <Timer className="h-3.5 w-3.5" aria-hidden />
                    Sale ends in {countdown}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Variant selector */}
            {hasVariants ? (
              <VariantSelector
                options={variantOptions}
                allVariants={variantsData?.variants || []}
                selected={selectedVariant}
                onChange={pickVariant}
                matched={matchedVariant}
                showSizeChart={isShoppingItem && hasSizes}
                onOpenSizeChart={() => setSizeChartOpen(true)}
              />
            ) : null}

            {/* Location + product extras */}
            {locationStr || stepNature === "product" ? (
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
                ) : null}
                {stepNature === "product" && minOrderQty ? (
                  <span className="rounded-md border border-border bg-surface-muted px-2 py-1 text-xs font-medium text-text">
                    Min order: {minOrderQty}
                  </span>
                ) : null}
              </div>
            ) : null}

            {/* Policy chips */}
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

            {/* CTAs — shopping: dual cart; others: single Add to cart */}
            {selectedOutOfStock ? (
              <p className="mt-6 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-semibold text-danger">
                This combination is out of stock. Pick another size or colour.
              </p>
            ) : null}

            {isShoppingItem ? (
              <div className="mt-6 grid gap-3">
                {inShoppingCart ? (
                  <CartQtyStepper
                    label="In shopping cart"
                    quantity={inShoppingCart.quantity}
                    onDecrease={() =>
                      updateCartQuantity("shopping", item.item_id, Math.max(1, inShoppingCart.quantity - 1))
                    }
                    onIncrease={() => updateCartQuantity("shopping", item.item_id, inShoppingCart.quantity + 1)}
                    onRemove={() => {
                      removeFromCart("shopping", item.item_id);
                      toast.message("Removed from shopping cart");
                    }}
                  />
                ) : (
                  <AddButton
                    primary
                    onClick={handleAddToShoppingCart}
                    icon={<ShoppingCart className="h-4 w-4" aria-hidden />}
                    label="Add to shopping cart"
                    justAdded={justAdded.shopping}
                    disabled={selectedOutOfStock}
                  />
                )}

                {inInquiryCart ? (
                  <CartQtyStepper
                    label="In quote cart"
                    quantity={inInquiryCart.quantity}
                    onDecrease={() =>
                      updateCartQuantity("quotation", item.item_id, Math.max(1, inInquiryCart.quantity - 1))
                    }
                    onIncrease={() => updateCartQuantity("quotation", item.item_id, inInquiryCart.quantity + 1)}
                    onRemove={() => {
                      removeFromCart("quotation", item.item_id);
                      toast.message("Removed from quote cart");
                    }}
                  />
                ) : (
                  <AddButton
                    primary={false}
                    onClick={handleAddToInquiry}
                    icon={<ClipboardList className="h-4 w-4" aria-hidden />}
                    label="Add to quote cart"
                    justAdded={justAdded.quotation}
                    disabled={selectedOutOfStock}
                  />
                )}
              </div>
            ) : (
              <div className="mt-6">
                {inInquiryCart ? (
                  <CartQtyStepper
                    label="In cart"
                    quantity={inInquiryCart.quantity}
                    onDecrease={() =>
                      updateCartQuantity("quotation", item.item_id, Math.max(1, inInquiryCart.quantity - 1))
                    }
                    onIncrease={() => updateCartQuantity("quotation", item.item_id, inInquiryCart.quantity + 1)}
                    onRemove={() => {
                      removeFromCart("quotation", item.item_id);
                      toast.message("Removed from cart");
                    }}
                  />
                ) : (
                  <AddButton
                    primary
                    onClick={handleAddToInquiry}
                    icon={<ClipboardList className="h-4 w-4" aria-hidden />}
                    label="Add to cart"
                    justAdded={justAdded.quotation}
                  />
                )}
              </div>
            )}

            {/* ── Detail sections (stacked, no tabs) ── */}
            <div className="mt-10 space-y-6">
              {desc ? (
                <Section title="About this item">
                  <p
                    className={`whitespace-pre-line text-sm leading-7 text-muted ${
                      !descExpanded && isLongDesc ? "line-clamp-4" : ""
                    }`}
                  >
                    {desc}
                  </p>
                  {isLongDesc ? (
                    <button
                      type="button"
                      onClick={() => setDescExpanded((v) => !v)}
                      className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-hover"
                    >
                      {descExpanded ? "Show less" : "Show more"}
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${descExpanded ? "rotate-180" : ""}`}
                        aria-hidden
                      />
                    </button>
                  ) : null}
                </Section>
              ) : null}

              {stepNature === "package" && inclusions.length > 0 ? (
                <Section title="What's included">
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {inclusions.map((line) => (
                      <li key={line} className="flex items-start gap-2 text-sm text-text">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              ) : null}

              {stepNature === "product" && bulkSlabs.length > 0 ? (
                <Section title="Bulk pricing">
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-surface-muted text-left text-xs uppercase tracking-wide text-muted">
                          <th className="px-3 py-2 font-semibold">Quantity</th>
                          <th className="px-3 py-2 font-semibold">Price / unit</th>
                          <th className="px-3 py-2 font-semibold">You save</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkSlabs.map((slab, idx) => (
                          <tr key={idx} className="border-b border-border last:border-0">
                            <td className="px-3 py-2 text-text">
                              {slab.min_qty ? `${slab.min_qty}+` : slab.range || `Tier ${idx + 1}`}
                            </td>
                            <td className="px-3 py-2 text-text">
                              {slab.price != null ? formatRupees(slab.price) : "—"}
                            </td>
                            <td className="px-3 py-2 text-success">
                              {slab.discount_pct ? `${slab.discount_pct}% off` : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Section>
              ) : null}

              {hasSpecs || matchedVariant ? (
                <Section title="Specifications">
                  <div className="space-y-6 rounded-lg border border-border bg-surface p-4 sm:p-5">
                    {/* The selected variant's own attributes — updates live as the
                        shopper switches colour / size / material. */}
                    {matchedVariant ? (
                      <div>
                        <h4 className="mb-1 text-[11px] font-bold uppercase tracking-wide text-subtle">
                          Selected variant
                        </h4>
                        <dl className="divide-y divide-border/70">
                          {[
                            ["Colour", matchedVariant.color],
                            ["Size", matchedVariant.size],
                            ["Material", matchedVariant.material],
                            ["SKU", matchedVariant.sku],
                          ]
                            .filter(([, v]) => v)
                            .map(([label, v]) => (
                              <div key={label} className="flex items-start justify-between gap-6 py-2.5">
                                <dt className="text-sm text-muted">{label}</dt>
                                <dd className="max-w-[60%] text-right text-sm font-medium text-text">{v}</dd>
                              </div>
                            ))}
                        </dl>
                      </div>
                    ) : null}
                    {hasSpecs ? <ItemAttributesSpec item={item} schema={schema} /> : null}
                  </div>
                </Section>
              ) : null}

              {stepNature === "package" && (durationLabel || citiesServed.length > 0 || outstationCharges) ? (
                <Section title="Service details">
                  <div className="space-y-4 text-sm">
                    {durationLabel ? (
                      <div className="flex items-start gap-3">
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-soft">
                          <Clock className="h-4 w-4 text-primary" aria-hidden />
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold uppercase tracking-wide text-muted">Duration</div>
                          <div className="mt-0.5 text-sm font-medium text-text">{durationLabel}</div>
                        </div>
                      </div>
                    ) : null}
                    {citiesServed.length > 0 ? (
                      <div className="flex items-start gap-3">
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-soft">
                          <MapPin className="h-4 w-4 text-primary" aria-hidden />
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold uppercase tracking-wide text-muted">Cities served</div>
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
                </Section>
              ) : null}

              {policyCards.length > 0 ? (
                <Section title="Returns & policies">
                  {/* Collapsed chips by default — tap a policy to expand its details. */}
                  <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                    {policyCards.map((p) => {
                      const open = !!openPolicies[p.title];
                      const expandable = !!p.text;
                      const Row = expandable ? "button" : "div";
                      return (
                        <div key={p.title}>
                          <Row
                            type={expandable ? "button" : undefined}
                            onClick={
                              expandable
                                ? () => setOpenPolicies((s) => ({ ...s, [p.title]: !s[p.title] }))
                                : undefined
                            }
                            aria-expanded={expandable ? open : undefined}
                            className={`flex w-full items-center gap-3 px-4 py-3 text-left ${
                              expandable ? "transition hover:bg-surface-muted" : ""
                            }`}
                          >
                            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-soft">
                              {p.icon}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-bold text-text">{p.title}</span>
                              <span className="block text-xs text-muted">{p.detail}</span>
                            </span>
                            {expandable ? (
                              <ChevronDown
                                className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
                                aria-hidden
                              />
                            ) : null}
                          </Row>
                          {expandable && open ? (
                            <p className="whitespace-pre-line border-t border-border bg-surface-muted/40 px-4 py-3 text-xs leading-5 text-muted">
                              {p.text}
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </Section>
              ) : null}
            </div>
          </div>
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
            <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 [scrollbar-width:thin]">
              {relatedItems.map((rel) => {
                const wlRel = !rel.vendor_id;
                const relVendor = wlRel
                  ? "MyShaadiStore"
                  : rel.vendor_business_name || rel.vendor_name || "Vendor";
                return (
                  <div key={rel.item_id} className="w-[260px] shrink-0 snap-start sm:w-[280px]">
                    <ItemCardV2 item={rel} vendorName={relVendor} whiteLabelOn={wlRel} step={step} />
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Ratings & Reviews — last. Skipped entirely when reviews are disabled. */}
        {reviewsMode !== "disabled" ? (
          <section className="mt-14 border-t border-border pt-10">
            <ProductReviews itemId={item.item_id} onSummary={handleReviewSummary} />
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
                label="In shopping cart"
                quantity={inShoppingCart.quantity}
                onDecrease={() =>
                  updateCartQuantity("shopping", item.item_id, Math.max(1, inShoppingCart.quantity - 1))
                }
                onIncrease={() => updateCartQuantity("shopping", item.item_id, inShoppingCart.quantity + 1)}
                onRemove={() => {
                  removeFromCart("shopping", item.item_id);
                  toast.message("Removed from shopping cart");
                }}
              />
            ) : null}
            {inInquiryCart ? (
              <CartQtyStepper
                compact
                label="In quote cart"
                quantity={inInquiryCart.quantity}
                onDecrease={() =>
                  updateCartQuantity("quotation", item.item_id, Math.max(1, inInquiryCart.quantity - 1))
                }
                onIncrease={() => updateCartQuantity("quotation", item.item_id, inInquiryCart.quantity + 1)}
                onRemove={() => {
                  removeFromCart("quotation", item.item_id);
                  toast.message("Removed from quote cart");
                }}
              />
            ) : null}
            <Link href="/cart" className="block text-center text-[11px] font-semibold text-muted hover:text-primary">
              View basket →
            </Link>
          </div>
        ) : (
          <div className="flex gap-2">
            {isShoppingItem ? (
              <>
                <button
                  type="button"
                  onClick={handleAddToShoppingCart}
                  disabled={selectedOutOfStock}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-bold shadow-sm transition-all duration-300 disabled:opacity-50 ${
                    justAdded.shopping
                      ? "bg-success text-primary-foreground"
                      : "bg-primary text-primary-foreground hover:bg-primary-hover"
                  }`}
                >
                  {justAdded.shopping ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden /> : <ShoppingCart className="h-4 w-4" aria-hidden />}
                  {justAdded.shopping ? "Added" : "Shopping cart"}
                </button>
                <button
                  type="button"
                  onClick={handleAddToInquiry}
                  disabled={selectedOutOfStock}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-bold transition-all duration-300 disabled:opacity-50 ${
                    justAdded.quotation
                      ? "bg-success text-primary-foreground"
                      : "border border-primary bg-surface text-primary hover:bg-primary-soft"
                  }`}
                >
                  {justAdded.quotation ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden /> : <ClipboardList className="h-4 w-4" aria-hidden />}
                  {justAdded.quotation ? "Added" : "Quote cart"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleAddToInquiry}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-bold transition-all duration-300 ${
                  justAdded.quotation
                    ? "bg-success text-primary-foreground"
                    : "bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover"
                }`}
              >
                {justAdded.quotation ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden /> : <ClipboardList className="h-4 w-4" aria-hidden />}
                {justAdded.quotation ? "Added" : "Add to cart"}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="hidden md:block">
        <BasketButton floating />
      </div>

      {zoomOpen ? (
        <ImageZoomModal images={images} index={activeImage} onClose={() => setZoomOpen(false)} onIndex={setActiveImage} />
      ) : null}
      {sizeChartOpen ? <SizeChartModal onClose={() => setSizeChartOpen(false)} /> : null}
    </main>
  );
}

/* ------------------------- Small subcomponents ------------------------- */

function AddButton({ onClick, icon, label, primary = true, justAdded = false, disabled = false }) {
  const flashCls = "bg-success text-primary-foreground";
  const baseCls = primary
    ? "bg-primary text-primary-foreground hover:bg-primary-hover"
    : "border border-primary bg-surface text-primary hover:bg-primary-soft";
  const sizeCls = primary ? "px-5 py-3.5 text-base" : "px-5 py-3 text-sm";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={justAdded || disabled}
      className={`flex w-full items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 ${sizeCls} ${
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
 * Variant selector — renders only the option groups the item actually has
 * (colour swatches with thumbnails; size + material pills). `matched` is the
 * concrete variant for the current selection; used for stock + SKU display.
 */
function bestVariantForValue(allVariants, dim, value, selection, allDims) {
  const candidates = allVariants.filter((v) => v[dim] === value);
  if (!candidates.length) return null;
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

// A value is AVAILABLE only if some in-stock variant has that value AND agrees
// with the current selection on every OTHER dimension. So picking size "L"
// greys out "Velvet" when no in-stock L+Velvet variant exists, and so on for
// every other permutation.
function valueAvailable(allVariants, dim, value, selected, dims) {
  return allVariants.some((v) => {
    if (v[dim] !== value) return false;
    if ((v.stock_quantity ?? 0) <= 0) return false;
    for (const d of dims) {
      if (d === dim) continue;
      if (selected[d] && v[d] !== selected[d]) return false;
    }
    return true;
  });
}

function VariantSelector({ options, allVariants, selected, onChange, matched, showSizeChart, onOpenSizeChart }) {
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
    <div className="mt-5 rounded-lg border border-border bg-surface p-5">
      <div className="space-y-5">
        {GROUPS.map((group) => (
          <div key={group.key}>
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-semibold uppercase tracking-wide text-muted">
                {group.label}: <span className="text-text">{selected[group.key] || "Pick one"}</span>
              </span>
              {group.key === "size" && showSizeChart ? (
                <button
                  type="button"
                  onClick={onOpenSizeChart}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-hover"
                >
                  <Ruler className="h-3.5 w-3.5" aria-hidden />
                  Size chart
                </button>
              ) : (
                <span className="text-[11px] text-muted">
                  {group.values.length} option{group.values.length === 1 ? "" : "s"}
                </span>
              )}
            </div>

            {group.key === "color" ? (
              <div className="flex flex-wrap gap-2.5">
                {group.values.map((v) => {
                  const active = selected[group.key] === v;
                  const inStock = valueAvailable(allVariants, group.key, v, selected, dims);
                  const bestV = bestVariantForValue(allVariants, group.key, v, selected, dims);
                  const thumb = bestV?.images?.[0];
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => onChange({ [group.key]: v })}
                      disabled={!inStock}
                      aria-pressed={active}
                      title={v + (inStock ? "" : " (unavailable for this selection)")}
                      className={`group relative flex flex-col items-center gap-1 ${
                        !inStock ? "cursor-not-allowed opacity-40" : ""
                      }`}
                    >
                      <span
                        className={`relative block size-14 overflow-hidden rounded-lg border-2 transition ${
                          active ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-border-strong"
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
                            N/A
                          </span>
                        )}
                      </span>
                      <span className={`max-w-16 truncate text-[11px] font-medium ${active ? "text-primary" : "text-text"}`}>
                        {v}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {group.values.map((v) => {
                  const active = selected[group.key] === v;
                  const inStock = valueAvailable(allVariants, group.key, v, selected, dims);
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
                          : "cursor-not-allowed border-border bg-surface-muted text-muted line-through"
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
      className={`flex items-center justify-between gap-3 rounded-lg border border-success/30 bg-success/5 ${padCls} shadow-[0_1px_0_rgba(15,23,42,0.02)]`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success text-primary-foreground">
          <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
        </span>
        <div className="min-w-0">
          <div className={`font-semibold uppercase tracking-wide text-success ${titleCls}`}>{label}</div>
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
          <span className="min-w-6 text-center text-sm font-bold text-text">{quantity}</span>
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
