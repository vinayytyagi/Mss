"use client";

import BudgetBadge from "@/components/BudgetBadge";
import BasketButton from "@/components/BasketButton";
import {
  Pencil,
  LayoutGrid,
  Search,
  X,
  MapPin,
  SlidersHorizontal,
  Tags,
  Users,
} from "lucide-react";
import { useAuthUser, getAuthToken, saveAuthCookies } from "@/lib/authCookies";
import { updateMyProfile } from "@/lib/api";
import CityStateDropdown from "@/components/CityStateDropdown";
import Dropdown from "@/components/ui/Dropdown";
import { buildLocationLabel } from "@/lib/indiaLocations";
import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Pagination from "@/components/Pagination";
import ProductCard from "@/components/journey/ProductCard";
import JourneyListingCard from "@/components/journey/JourneyListingCard";
import JourneyStepStrip from "@/components/journey/JourneyStepStrip";
import JourneyStepNav from "@/components/journey/JourneyStepNav";
import TrustStrip from "@/components/journey/TrustStrip";
import { getListingConfig, getTrustItems } from "@/lib/journeyStepUi";
import { capturesDetails } from "@/lib/journeyMode";

// Customer journey page items grid pagination — 24 divides evenly into the
// responsive grid (1 / 2 / 3 columns) so the last row never sits half-empty.
const JOURNEY_PAGE_SIZE = 24;

// Results sort options for mockup-configured listing steps (venue / decor …).
const JOURNEY_SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "price_asc", label: "Price: Low to high" },
  { value: "price_desc", label: "Price: High to low" },
  { value: "rating", label: "Rating: High to low" },
];

function categoryUrlSegment(c) {
  if (!c) return "";
  const s = String(c.slug || "").trim();
  return s || c.category_id || "";
}

/**
 * Fallback nature lookup when a journey step doc doesn't carry `nature`
 * yet (mirrors `mss-admin/src/lib/constants/journeySteps.js`).
 */
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

/**
 * Per-step bullet recipes for the item card. Each recipe receives the
 * item.attributes object + the item itself, returns at most 2-3 short
 * strings. Render order: first non-empty wins.
 *
 * The map is intentionally inline + small — when we add more steps we
 * add entries here; falls back gracefully when a step is missing.
 */
function highlightsForItem(step, item) {
  const a = item?.attributes || {};
  const slug = String(step?.slug || "").trim().toLowerCase();
  const out = [];
  function add(label, value) {
    if (value == null || value === "") return;
    out.push(`${label}: ${value}`);
  }

  switch (slug) {
    case "shopping":
      add("Fabric", a.fabric_material);
      add("Work", Array.isArray(a.work_embroidery) ? a.work_embroidery[0] : a.work_embroidery);
      add("Occasion", Array.isArray(a.occasion) ? a.occasion.slice(0, 2).join(", ") : a.occasion);
      break;
    case "streedhan":
      add("Capacity", a.capacity);
      add("Warranty", a.warranty_years ? `${a.warranty_years}y` : a.warranty);
      add("Brand", a.brand);
      break;
    case "gifting":
      add("Type", a.gift_type || a.category);
      add("Pack of", a.pack_size);
      break;
    case "venue":
      add("Capacity", a.capacity || a.max_guests);
      add("Type", a.venue_type);
      break;
    case "photography":
      add("Coverage", a.coverage_hours ? `${a.coverage_hours}h coverage` : a.coverage);
      add("Outfits", a.outfit_changes);
      add("Includes", a.deliverables);
      break;
    case "decor":
      add("Theme", a.theme);
      add("Includes", a.inclusions);
      break;
    case "catering":
      add("Menu", a.menu_type);
      add("Per plate", a.per_plate_price ? `Rs ${a.per_plate_price}` : null);
      add("Min guests", a.min_guests);
      break;
    case "makeup-and-mehndi":
      add("Looks", a.looks_count);
      add("Includes", a.includes || a.deliverables);
      break;
    case "wedding-invitation":
      add("Format", a.format);
      add("Qty", a.quantity);
      break;
    case "pagfera":
      add("Inclusions", a.inclusions || (a.pandit_included ? "Pandit + Samagri included" : null));
      add("Duration", a.duration_hours ? `${a.duration_hours}h` : a.duration);
      break;
    case "honeymoon":
      add("Nights", a.nights);
      add("Destination", a.destination);
      add("Includes", a.inclusions);
      break;
    default:
      break;
  }
  return out.slice(0, 3);
}

function buildJourneyHref(
  slug,
  {
    categorySlug,
    subcategorySlug,
    subSubcategorySlug,
    search: searchTerm,
    budget,
    capOff,
    matchLocOff = false,
    matchGuestsOff = false,
    priceMax = null,
    guestCount,
    venueLoc,
  } = {},
) {
  const qs = new URLSearchParams();
  if (categorySlug) qs.set("category", categorySlug);
  if (subcategorySlug) qs.set("subcategory", subcategorySlug);
  if (subSubcategorySlug) qs.set("subSubcategory", subSubcategorySlug);
  if (searchTerm && String(searchTerm).trim()) qs.set("search", String(searchTerm).trim());
  if (capOff === true) {
    qs.set("cap", "off");
  } else if (
    budget !== undefined &&
    budget !== null &&
    budget !== false &&
    Number.isFinite(Number(budget))
  ) {
    qs.set("budget", String(Math.max(0, Math.round(Number(budget)))));
  }
  if (matchLocOff === true) qs.set("matchLoc", "0");
  if (matchGuestsOff === true) qs.set("matchGuests", "0");
  if (priceMax != null && Number.isFinite(Number(priceMax)) && Number(priceMax) >= 0) {
    qs.set("pmax", String(Math.round(Number(priceMax))));
  }
  if (guestCount != null && guestCount !== undefined && Number(guestCount) > 0) {
    qs.set("guestCount", String(Math.round(Number(guestCount))));
  }
  if (venueLoc != null && venueLoc !== undefined && String(venueLoc).trim()) {
    qs.set("venueLoc", String(venueLoc).trim());
  }
  const q = qs.toString();
  return `/journey/${slug}${q ? `?${q}` : ""}`;
}

function formatAmount(value) {
  const amount = Number(value || 0);
  if (amount >= 100000) {
    return `${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1)}L`;
  }
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount);
}

// Exact "₹1,23,456" rupee label for the price-range pill + modal.
function formatRupees(value) {
  return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    Math.max(0, Math.round(Number(value) || 0)),
  )}`;
}

/**
 * Label for the per-item price-range pill. `range` is { min, max } | null
 * (either side may be null for an open end). Falls back to `fallbackLabel`
 * ("Price") when no range is set.
 */
function describePriceRange(range, fallbackLabel) {
  if (!range) return fallbackLabel;
  const { min, max } = range;
  const hasMin = min != null;
  const hasMax = max != null;
  if (hasMin && hasMax) return `${formatRupees(min)} – ${formatRupees(max)}`;
  if (hasMin) return `From ${formatRupees(min)}`;
  if (hasMax) return `Up to ${formatRupees(max)}`;
  return fallbackLabel;
}

const MAX_BUDGET_PER_STEP = 10000000;
// Sliders now move in ₹1,000 increments — a much finer drag than the
// old 50k step, while still keeping the slider thumb usable across the
// full ₹0..₹1 crore range.
const BUDGET_STEP = 1000;

/**
 * FilterPopover — portals the category / subcategory / sub-subcategory
 * dropdown menus to document.body with position:fixed so the filter
 * strip's `overflow-x-auto` can't clip them. Mirrors the positioning
 * pattern in `ui/Dropdown.jsx`: position computed from the trigger's
 * bounding rect, re-run on scroll(capture)+resize while open, and
 * outside-click closes when the click is in NEITHER the trigger nor the
 * portaled menu. Children are the existing search input + Link list.
 */
const FILTER_POPOVER_WIDTH = 320;

function FilterPopover({ open, triggerRef, onClose, children }) {
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState(null);

  // Position (and reposition) the portaled menu while open.
  useEffect(() => {
    if (!open) return undefined;
    function update() {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const width = Math.min(FILTER_POPOVER_WIDTH, window.innerWidth - 16);
      const left = Math.min(Math.max(8, r.left), Math.max(8, window.innerWidth - width - 8));
      const spaceBelow = window.innerHeight - r.bottom;
      const maxHeight = Math.min(360, Math.max(160, spaceBelow - 16));
      setMenuStyle({
        position: "fixed",
        left,
        top: r.bottom + 6,
        width,
        maxHeight,
        zIndex: 9999,
      });
    }
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, triggerRef]);

  // Outside-click close — account for both the trigger and the portaled menu.
  useEffect(() => {
    if (!open) return undefined;
    function onDoc(e) {
      const t = e.target;
      if (triggerRef.current && triggerRef.current.contains(t)) return;
      if (menuRef.current && menuRef.current.contains(t)) return;
      onClose?.();
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onClose, triggerRef]);

  if (!open || !menuStyle) return null;
  return createPortal(
    <div
      ref={menuRef}
      style={menuStyle}
      className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-[0_16px_40px_rgba(15,23,42,0.16)]"
      role="presentation"
      onWheel={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body,
  );
}

// The old `BudgetStatusStrip` (a plan / spent / remaining + per-category
// breakdown row rendered at the top of BudgetModal) and the older
// `BudgetSummaryButton` + `BudgetSummaryDialog` lived here. They were
// removed when BudgetModal was simplified down to a single budget-amount
// control with three actions — don't reintroduce a standalone budget
// summary surface.

function BudgetModal({
  onClose,
  stepTitle,
  defaultBudget = 0,
  maxBudget = MAX_BUDGET_PER_STEP,
  seedAmount = 0,
  onApply,
  onSaveToProfile,
  onClearCap,
}) {
  const effectiveMaxBudget = Math.max(Number(maxBudget) || 0, Number(defaultBudget) || 0, 500000);
  const [amount, setAmount] = useState(() =>
    Math.max(0, Math.min(effectiveMaxBudget, Number(seedAmount ?? defaultBudget) || 0)),
  );
  const [saving, setSaving] = useState(false);

  const clamp = (n) => Math.max(0, Math.min(effectiveMaxBudget, Number(n) || 0));

  function applyUrl() {
    onApply?.(clamp(amount));
    onClose();
  }

  async function saveProfile() {
    setSaving(true);
    try {
      await onSaveToProfile?.(clamp(amount));
      onClose();
    } catch (e) {
      toast.error(e?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 flex items-center justify-center p-4 z-100 bg-text-strong/45"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="budget-modal-title"
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-[0_24px_80px_rgba(15,23,42,0.2)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 id="budget-modal-title" className="text-lg font-semibold text-text-strong">
            {stepTitle} budget
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 transition-colors rounded-full cursor-pointer hover:bg-surface-muted"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-subtle" />
          </button>
        </div>
        <p className="mb-3 text-sm text-muted">
          We’ll narrow the list to ideas that fit this amount. This is the budget you set at signup — adjust anytime.
        </p>
        <label className="block mb-1 text-xs font-semibold tracking-wide uppercase text-subtle">
          Budget for this step
        </label>
        <div className="relative">
          <span className="absolute text-sm font-semibold -translate-y-1/2 left-4 top-1/2 text-subtle">Rs</span>
          <input
            type="number"
            min="0"
            max={effectiveMaxBudget}
            step={BUDGET_STEP}
            value={amount}
            onChange={(e) => setAmount(clamp(e.target.value))}
            onKeyDown={(e) => e.key === "Enter" && applyUrl()}
            className="w-full pl-10 pr-4 text-sm font-semibold border outline-none h-11 rounded-xl border-border-strong bg-surface-muted text-text-strong focus:border-primary"
            autoFocus
          />
        </div>
        <div className="pt-3">
          <input
            type="range"
            min="0"
            max={effectiveMaxBudget}
            step={BUDGET_STEP}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full h-2 cursor-pointer accent-primary"
            aria-label="Budget for this step"
          />
          <div className="mt-2 flex justify-between text-[11px] text-muted">
            <span>Min</span>
            <span>Max {formatAmount(effectiveMaxBudget)}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 mt-6 sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 text-sm font-medium border rounded-xl border-border-strong text-muted hover:bg-surface-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={applyUrl}
            className="h-10 px-4 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover"
          >
            Apply for this page
          </button>
          {onSaveToProfile ? (
            <button
              type="button"
              disabled={saving}
              onClick={saveProfile}
              className="h-10 px-4 text-sm font-semibold border rounded-xl border-primary/40 bg-primary-soft text-primary hover:bg-primary-soft disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save to my account"}
            </button>
          ) : null}
        </div>
        {onClearCap ? (
          <button
            type="button"
            className="w-full mt-4 text-xs font-semibold text-center text-muted underline-offset-2 hover:text-text-strong hover:underline"
            onClick={() => {
              onClearCap();
              onClose();
            }}
          >
            Turn off this filter (show all prices)
          </button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * PriceRangeModal — per-item price filter for decor / shopping. A dual-thumb
 * range slider (two overlapped <input type="range">) plus Min/Max number
 * inputs that stay in sync. "Apply" commits { min, max } (nulls allowed for an
 * open side — bound at the slider extreme counts as "open"); "Clear" wipes the
 * range. min <= max is kept while dragging/typing.
 */
function PriceRangeModal({
  onClose,
  stepTitle,
  min = 0,
  max = 500000,
  step = 1000,
  seedRange = null,
  onApply,
  onClear,
}) {
  const clamp = (n) => Math.max(min, Math.min(max, Number(n) || 0));
  const [lo, setLo] = useState(() => clamp(seedRange?.min ?? min));
  const [hi, setHi] = useState(() => clamp(seedRange?.max ?? max));

  // Keep the lower thumb/input from crossing the upper and vice-versa.
  function changeLo(next) {
    setLo(Math.min(clamp(next), hi));
  }
  function changeHi(next) {
    setHi(Math.max(clamp(next), lo));
  }

  function apply() {
    if (lo > hi) {
      toast.error("Minimum can’t be more than maximum.");
      return;
    }
    // A side parked at the slider extreme is treated as "open" (null).
    const nextMin = lo <= min ? null : lo;
    const nextMax = hi >= max ? null : hi;
    // Both sides open == no constraint; clear instead of an empty range.
    if (nextMin == null && nextMax == null) {
      onClear?.();
    } else {
      onApply?.({ min: nextMin, max: nextMax });
    }
    onClose();
  }

  function clearRange() {
    onClear?.();
    onClose();
  }

  // Fill the slider track between the two thumbs.
  const span = Math.max(1, max - min);
  const leftPct = ((lo - min) / span) * 100;
  const rightPct = ((hi - min) / span) * 100;

  return (
    <div
      role="presentation"
      className="fixed inset-0 flex items-center justify-center p-4 z-100 bg-text-strong/45"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="price-range-title"
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-[0_24px_80px_rgba(15,23,42,0.2)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 id="price-range-title" className="text-lg font-semibold text-text-strong">
            {stepTitle ? `${stepTitle} price` : "Price range"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 transition-colors rounded-full cursor-pointer hover:bg-surface-muted"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-subtle" />
          </button>
        </div>
        <p className="mb-4 text-sm text-muted">
          Show only items whose price falls in this range. Leave a side at the end to keep it open.
        </p>

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label
              htmlFor="price-range-min"
              className="block mb-1 text-xs font-semibold tracking-wide uppercase text-subtle"
            >
              Min ₹
            </label>
            <input
              id="price-range-min"
              type="number"
              min={min}
              max={max}
              step={step}
              value={lo}
              onChange={(e) => changeLo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && apply()}
              className="w-full px-3 text-sm font-semibold border outline-none h-11 rounded-xl border-border-strong bg-surface-muted text-text-strong focus:border-primary"
            />
          </div>
          <span className="pb-3 text-sm font-semibold text-subtle">–</span>
          <div className="flex-1">
            <label
              htmlFor="price-range-max"
              className="block mb-1 text-xs font-semibold tracking-wide uppercase text-subtle"
            >
              Max ₹
            </label>
            <input
              id="price-range-max"
              type="number"
              min={min}
              max={max}
              step={step}
              value={hi}
              onChange={(e) => changeHi(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && apply()}
              className="w-full px-3 text-sm font-semibold border outline-none h-11 rounded-xl border-border-strong bg-surface-muted text-text-strong focus:border-primary"
            />
          </div>
        </div>

        {/* Dual-thumb slider — two overlapped range inputs. The lower input
            sits above the upper one near the left thumb so both stay grabbable;
            pointer-events are re-enabled on the thumbs only. */}
        <div className="relative h-10 mt-6">
          <div className="absolute left-0 right-0 h-1.5 -translate-y-1/2 rounded-full top-1/2 bg-border-strong" />
          <div
            className="absolute h-1.5 -translate-y-1/2 rounded-full top-1/2 bg-primary"
            style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }}
          />
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={lo}
            onChange={(e) => changeLo(e.target.value)}
            aria-label="Minimum price"
            className="pointer-events-none absolute left-0 top-1/2 h-1.5 w-full -translate-y-1/2 cursor-pointer appearance-none bg-transparent accent-primary [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:pointer-events-auto"
            style={{ zIndex: lo > max - step ? 5 : 3 }}
          />
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={hi}
            onChange={(e) => changeHi(e.target.value)}
            aria-label="Maximum price"
            className="pointer-events-none absolute left-0 top-1/2 h-1.5 w-full -translate-y-1/2 cursor-pointer appearance-none bg-transparent accent-primary [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:pointer-events-auto"
            style={{ zIndex: 4 }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-muted">
          <span>{formatRupees(lo)}</span>
          <span>{formatRupees(hi)}</span>
        </div>

        <div className="flex flex-col gap-2 mt-6 sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            type="button"
            onClick={clearRange}
            className="h-10 px-4 text-sm font-medium border rounded-xl border-border-strong text-muted hover:bg-surface-muted"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={apply}
            className="h-10 px-4 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

function GuestFilterModal({ onClose, seedCount, onApplyUrl, onSaveToProfile, onFilterOff }) {
  const [val, setVal] = useState(() => (Number(seedCount) > 0 ? String(seedCount) : ""));
  const [saving, setSaving] = useState(false);

  function applyUrl() {
    const n = Number(String(val).replace(/[^\d]/g, ""));
    if (!n || n < 1) {
      toast.error("Enter a positive guest count.");
      return;
    }
    onApplyUrl(n);
    onClose();
  }

  async function saveProfile() {
    const n = Number(String(val).replace(/[^\d]/g, ""));
    if (!n || n < 1) {
      toast.error("Enter a positive guest count.");
      return;
    }
    setSaving(true);
    try {
      await onSaveToProfile?.(n);
      onClose();
    } catch (e) {
      toast.error(e?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 flex items-center justify-center p-4 z-100 bg-text-strong/45"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-filter-title"
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-[0_24px_80px_rgba(15,23,42,0.2)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 id="guest-filter-title" className="text-lg font-semibold text-text-strong">
            Guest count
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 transition-colors rounded-full cursor-pointer hover:bg-surface-muted"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-subtle" />
          </button>
        </div>
        <p className="mb-3 text-sm text-muted">
          Venues with a listed capacity are filtered so the space can reasonably host your party size.
        </p>
        <label className="block mb-1 text-xs font-semibold tracking-wide uppercase text-subtle">
          Expected guests
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyUrl()}
          placeholder="e.g. 250"
          className="w-full px-3 text-sm font-semibold border outline-none h-11 rounded-xl border-border-strong bg-surface-muted text-text-strong focus:border-primary"
        />
        <div className="flex flex-col gap-2 mt-6 sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 text-sm font-medium border rounded-xl border-border-strong text-muted hover:bg-surface-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={applyUrl}
            className="h-10 px-4 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover"
          >
            Apply for this page
          </button>
          {onSaveToProfile ? (
            <button
              type="button"
              disabled={saving}
              onClick={saveProfile}
              className="h-10 px-4 text-sm font-semibold border rounded-xl border-primary/40 bg-primary-soft text-primary hover:bg-primary-soft disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save to my account"}
            </button>
          ) : null}
        </div>
        {onFilterOff ? (
          <button
            type="button"
            className="w-full mt-4 text-xs font-semibold text-center text-muted underline-offset-2 hover:text-text-strong hover:underline"
            onClick={() => {
              onFilterOff();
              onClose();
            }}
          >
            Turn off guest filter for this page
          </button>
        ) : null}
      </div>
    </div>
  );
}

function LocationFilterModal({ onClose, seedLabel, onApplyUrl, onSaveToProfile, onFilterOff }) {
  const parsed = parseCityStateForDropdown(seedLabel);
  const [city, setCity] = useState(parsed.city);
  const [state, setState] = useState(parsed.state);
  const [saving, setSaving] = useState(false);

  function applyUrl() {
    const label = buildLocationLabel(city, state).trim();
    if (!label) {
      toast.error("Select or enter city and state.");
      return;
    }
    onApplyUrl(label);
    onClose();
  }

  async function saveProfile() {
    const label = buildLocationLabel(city, state).trim();
    if (!label) {
      toast.error("Select or enter city and state.");
      return;
    }
    setSaving(true);
    try {
      await onSaveToProfile?.(label);
      onClose();
    } catch (e) {
      toast.error(e?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 flex items-center justify-center p-4 z-100 bg-text-strong/45"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="loc-filter-title"
        className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-[0_24px_80px_rgba(15,23,42,0.2)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 id="loc-filter-title" className="text-lg font-semibold text-text-strong">
            Wedding city &amp; state
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 transition-colors rounded-full cursor-pointer hover:bg-surface-muted"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-subtle" />
          </button>
        </div>
        <p className="mb-4 text-sm text-muted">
          Listings on venue, décor, and catering steps are matched to this area when the filter is on.
        </p>
        <CityStateDropdown
          cityValue={city}
          stateValue={state}
          onChange={(loc) => {
            setCity(loc.city || "");
            setState(loc.state || "");
          }}
        />
        <div className="flex flex-col gap-2 mt-6 sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 text-sm font-medium border rounded-xl border-border-strong text-muted hover:bg-surface-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={applyUrl}
            className="h-10 px-4 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover"
          >
            Apply for this page
          </button>
          {onSaveToProfile ? (
            <button
              type="button"
              disabled={saving}
              onClick={saveProfile}
              className="h-10 px-4 text-sm font-semibold border rounded-xl border-primary/40 bg-primary-soft text-primary hover:bg-primary-soft disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save to my account"}
            </button>
          ) : null}
        </div>
        {onFilterOff ? (
          <button
            type="button"
            className="w-full mt-4 text-xs font-semibold text-center text-muted underline-offset-2 hover:text-text-strong hover:underline"
            onClick={() => {
              onFilterOff();
              onClose();
            }}
          >
            Turn off area filter for this page
          </button>
        ) : null}
      </div>
    </div>
  );
}

const fallbackImages = [
  "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=80",
];

function describeGuestFilterLine(count, filterOff) {
  if (filterOff) return "Guest capacity filter is off";
  const n = Number(count);
  if (!Number.isFinite(n) || n < 1) return "Set guest count to match venue capacity";
  return `~${n} guests`;
}

function describeAreaFilterLine(areaLabel, filterOff) {
  if (filterOff) return "Area / city filter is off";
  const s = String(areaLabel || "").trim();
  if (!s) return "Set your wedding city to match listings";
  return `${s}`;
}

function parseCityStateForDropdown(label) {
  const parts = String(label || "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return { city: parts[0] || "", state: parts.slice(1).join(", ") || "" };
}

export default function JourneyStepPage({
  steps,
  step,
  categories,
  items,
  selectedCategoryId = "",
  selectedSubcategoryId = "",
  selectedSubSubcategoryId = "",
  selectedCategorySlug = "",
  selectedSubcategorySlug = "",
  selectedSubSubcategorySlug = "",
  search = "",
  appliedBudgetCap = null,
  budgetQueryValue = undefined,
  capOffActive = false,
  showSignupLocFilter = false,
  showSignupGuestFilter = false,
  matchLocOff = false,
  matchGuestsOff = false,
  guestCountForUrl = undefined,
  venueLocForUrl = undefined,
  effectiveGuestCount = 0,
  effectiveVenueLocation = "",
}) {
  const router = useRouter();
  const authUser = useAuthUser();
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(search);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [subcategoryMenuOpen, setSubcategoryMenuOpen] = useState(false);
  const [subSubcategoryMenuOpen, setSubSubcategoryMenuOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [subcategorySearch, setSubcategorySearch] = useState("");
  const [subSubcategorySearch, setSubSubcategorySearch] = useState("");
  const filtersWrapRef = useRef(null);
  // Trigger refs for the category cascade — the popovers are portaled to
  // document.body (so the scroll strip's overflow-x-auto can't clip them),
  // positioned from these triggers' bounding rects (see FilterPopover).
  const categoryTriggerRef = useRef(null);
  const subcategoryTriggerRef = useRef(null);
  const subSubcategoryTriggerRef = useRef(null);
  const stepNature = useMemo(() => resolveStepNature(step), [step]);

  // Per-step mockup config: step-specific attribute filters + card
  // recipe + trust strip (venue / decor / catering / gifting / shopping).
  // Null only for steps that keep the legacy generic layout.
  const listingCfg = useMemo(() => getListingConfig(step.slug), [step.slug]);
  const trustItems = useMemo(() => getTrustItems(step.slug), [step.slug]);
  const [attrFilters, setAttrFilters] = useState({});
  const [sortBy, setSortBy] = useState("recommended");
  // Per-item price-range modal (decor / shopping "Price" pill). The matching
  // filter config carries the slider bounds (min / max / step).
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const priceFilterCfg = useMemo(
    () => listingCfg?.filters?.find((f) => f.kind === "price-range") || null,
    [listingCfg],
  );

  // Decor: adding a product opens a small theme / colour / notes modal whose
  // values are stored on the cart line meta. Canonical: capturesDetails().
  const captureDetailsOn = useMemo(() => capturesDetails(step.slug), [step.slug]);

  const capOrBudgetQs = capOffActive
    ? { capOff: true }
    : budgetQueryValue !== undefined
      ? { budget: budgetQueryValue }
      : {};

  function makeJourneyHref(overrides = {}) {
    const merged = {
      categorySlug: selectedCategorySlug,
      subcategorySlug: selectedSubcategorySlug || undefined,
      subSubcategorySlug: selectedSubSubcategorySlug || undefined,
      search: searchQuery.trim(),
      // Preserve the active guest-size + destination chips across navigation
      // (category/filter clicks) so they don't reset.
      guestCount: guestCountForUrl,
      venueLoc: venueLocForUrl,
      matchLocOff,
      matchGuestsOff,
      ...capOrBudgetQs,
      ...overrides,
    };
    if (merged.subcategorySlug === null || merged.subcategorySlug === "") {
      delete merged.subcategorySlug;
    }
    if (merged.subSubcategorySlug === null || merged.subSubcategorySlug === "") {
      delete merged.subSubcategorySlug;
    }
    return buildJourneyHref(step.slug, merged);
  }

  const allocations = Array.isArray(authUser?.onboarding?.budget_allocations)
    ? authUser.onboarding.budget_allocations
    : [];
  const profileStepBudget = allocations.find((a) => a.step_id === step.step_id)?.amount;
  const budgetModalSeed = capOffActive
    ? Number(profileStepBudget ?? step.default_budget ?? 0)
    : budgetQueryValue !== undefined
      ? budgetQueryValue
      : appliedBudgetCap ??
        (profileStepBudget !== undefined && profileStepBudget !== null
          ? Number(profileStepBudget)
          : null) ??
        Number(step.default_budget ?? 0);

  useEffect(() => {
    setSearchQuery(search);
  }, [search]);

  useEffect(() => {
    const lock =
      isBudgetModalOpen ||
      isGuestModalOpen ||
      isLocationModalOpen ||
      priceModalOpen ||
      categoryMenuOpen ||
      subcategoryMenuOpen ||
      subSubcategoryMenuOpen;
    if (!lock) return undefined;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, [
    isBudgetModalOpen,
    isGuestModalOpen,
    isLocationModalOpen,
    priceModalOpen,
    categoryMenuOpen,
    subcategoryMenuOpen,
    subSubcategoryMenuOpen,
  ]);

  useEffect(() => {
    if (subcategoryMenuOpen) setSubcategorySearch("");
  }, [subcategoryMenuOpen]);

  useEffect(() => {
    if (subSubcategoryMenuOpen) setSubSubcategorySearch("");
  }, [subSubcategoryMenuOpen]);

  // Outside-click + scroll-following are owned per-popover by FilterPopover
  // (each checks BOTH its trigger and its portaled menu), since the menus are
  // now portaled to document.body and live outside `filtersWrapRef`.

  const activeIndex = Math.max(
    0,
    steps.findIndex((item) => item.step_id === step.step_id)
  );

  const topCategories = categories.filter((category) => !category.parent_category_id);
  const stepHasCategories = topCategories.length > 0;
  const selectedCategory =
    topCategories.find((category) => category.category_id === selectedCategoryId) || topCategories[0] || null;
  const selectedSubcategory = selectedSubcategoryId
    ? categories.find((c) => c.category_id === selectedSubcategoryId) || null
    : null;
  const selectedSubSubcategory = selectedSubSubcategoryId
    ? categories.find((c) => c.category_id === selectedSubSubcategoryId) || null
    : null;

  // Gifting mockup shows top-level categories as segmented occasion tabs
  // instead of a dropdown. Only sensible for a handful of categories.
  const useCategoryTabs =
    listingCfg?.categoryStyle === "tabs" &&
    topCategories.length > 1 &&
    topCategories.length <= 5;

  // Apply the guest + venue-city filters client-side. The server returns
  // every item for the step + category; the URL params `guestCount` and
  // `venueLoc` get applied here so the result set actually shrinks when
  // the user picks "Match capacity" or "Match my city". The "off" toggles
  // bypass the predicate entirely so the user can clear with one click.
  const baseItems = Array.isArray(items) ? items : [];
  const guestNeed = matchGuestsOff ? 0 : Number(effectiveGuestCount) || 0;
  const cityNeed = matchLocOff
    ? ""
    : String(effectiveVenueLocation || "").trim().toLowerCase();

  function itemMatchesGuests(item) {
    if (guestNeed <= 0) return true;
    const attrs = item?.attributes || {};
    const capacity = Number(
      attrs.max_guests ?? attrs.guest_capacity ?? attrs.capacity ?? item?.capacity ?? 0,
    );
    // Items without a capacity should still appear — we only filter OUT
    // venues whose declared max is smaller than what the customer needs.
    if (!Number.isFinite(capacity) || capacity <= 0) return true;
    return capacity >= guestNeed;
  }

  function itemMatchesCity(item) {
    if (!cityNeed) return true;
    // `effectiveVenueLocation` is a "City, State" label. Match on either
    // segment so "Mumbai" picks up "Mumbai, Maharashtra" items + vice-
    // versa.
    const haystack = [item?.location_city, item?.location_state]
      .filter(Boolean)
      .map((s) => String(s).toLowerCase());
    if (!haystack.length) return false;
    const needleParts = cityNeed.split(",").map((s) => s.trim()).filter(Boolean);
    return needleParts.some((part) => haystack.some((h) => h.includes(part)));
  }

  let filteredItems = baseItems.filter(
    (item) => itemMatchesGuests(item) && itemMatchesCity(item),
  );
  // Mockup-driven per-step attribute filters (venue type, cuisine,
  // theme, packaging…) + sort. Items missing an attribute stay visible
  // — we only filter OUT explicit mismatches.
  if (listingCfg) {
    for (const f of listingCfg.filters) {
      const v = attrFilters[f.key];
      if (v) filteredItems = filteredItems.filter((item) => f.match(item, v));
    }
    if (sortBy === "price_asc" || sortBy === "price_desc") {
      filteredItems = [...filteredItems].sort((a, b) => {
        const pa = Number(a.final_price ?? a.price) || 0;
        const pb = Number(b.final_price ?? b.price) || 0;
        return sortBy === "price_asc" ? pa - pb : pb - pa;
      });
    } else if (sortBy === "rating") {
      const ratingOf = (it) => Number(it?.average_rating ?? it?.rating ?? it?.rating_avg) || 0;
      filteredItems = [...filteredItems].sort((a, b) => ratingOf(b) - ratingOf(a));
    }
  }
  const visibleItems = filteredItems;
  const hasVisibleItems = visibleItems.length > 0;

  // Pagination — client-side slice. Resets to page 1 whenever the filtered
  // set's identity changes (filter pills, search, category change).
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [
    visibleItems.length,
    selectedCategoryId,
    selectedSubcategoryId,
    selectedSubSubcategoryId,
    searchQuery,
    attrFilters,
    sortBy,
  ]);
  const totalItems = visibleItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / JOURNEY_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedItems = visibleItems.slice(
    (currentPage - 1) * JOURNEY_PAGE_SIZE,
    currentPage * JOURNEY_PAGE_SIZE
  );

  const canSaveProfile = !!getAuthToken() && !!authUser;

  async function saveGuestCountToProfile(n) {
    const t = getAuthToken();
    if (!t) throw new Error("Please log in to save.");
    const result = await updateMyProfile(t, {
      onboarding: {
        ...(authUser?.onboarding || {}),
        guests_count: n,
      },
    });
    saveAuthCookies({ token: t, user: result.user });
    toast.success("Guest count saved to your account");
    router.replace(makeJourneyHref({ guestCount: undefined, matchGuestsOff: false }));
    router.refresh();
  }

  async function saveVenueLocationToProfile(label) {
    const t = getAuthToken();
    if (!t) throw new Error("Please log in to save.");
    const result = await updateMyProfile(t, {
      onboarding: {
        ...(authUser?.onboarding || {}),
        venue_location: label,
      },
    });
    saveAuthCookies({ token: t, user: result.user });
    toast.success("Location saved to your account");
    router.replace(makeJourneyHref({ venueLoc: undefined, matchLocOff: false }));
    router.refresh();
  }

  // Persist the chosen per-step budget into the profile's budget_allocations
  // (the same signup/profile allocation budgetModalSeed reads from). After
  // saving we drop the ?budget / ?capOff overrides so the page falls back to
  // the freshly-saved profile amount.
  async function saveBudgetToProfile(amount) {
    const t = getAuthToken();
    if (!t) throw new Error("Please log in to save.");
    const existing = Array.isArray(authUser?.onboarding?.budget_allocations)
      ? authUser.onboarding.budget_allocations
      : [];
    const nextAllocations = existing.some((a) => a.step_id === step.step_id)
      ? existing.map((a) => (a.step_id === step.step_id ? { ...a, amount } : a))
      : [...existing, { step_id: step.step_id, amount }];
    const result = await updateMyProfile(t, {
      onboarding: {
        ...(authUser?.onboarding || {}),
        budget_allocations: nextAllocations,
      },
    });
    saveAuthCookies({ token: t, user: result.user });
    toast.success("Budget saved to your account");
    router.replace(makeJourneyHref({ capOff: false, budget: undefined }));
    router.refresh();
  }

  const guestFilterSummary = describeGuestFilterLine(effectiveGuestCount, matchGuestsOff);
  const areaFilterSummary = describeAreaFilterLine(effectiveVenueLocation, matchLocOff);
  // The Step Budget caps item price (server filters by appliedBudgetCap when
  // no explicit override). When that cap is on and nothing fits, the empty
  // state nudges the user to the budget tile instead of a removed control.
  const budgetCapActive =
    !capOffActive && appliedBudgetCap != null && Number.isFinite(Number(appliedBudgetCap));
  // Count of active attribute-filter dropdowns — drives the "Filters" badge
  // + the "Clear all" affordance on the per-step filter bar.
  const activeAttrCount = Object.values(attrFilters).filter(Boolean).length;

  const categorySearchLower = categorySearch.trim().toLowerCase();
  const filteredCategories = categorySearchLower
    ? topCategories.filter((c) => (c.name || "").toLowerCase().includes(categorySearchLower))
    : topCategories;

  const subsForSelectedCategory = categories.filter(
    (c) => c.parent_category_id === (selectedCategory?.category_id || "")
  );
  const hasSubcategoryOptions = subsForSelectedCategory.length > 0;
  const subSearchLower = subcategorySearch.trim().toLowerCase();
  const filteredSubs = subSearchLower
    ? subsForSelectedCategory.filter((c) => (c.name || "").toLowerCase().includes(subSearchLower))
    : subsForSelectedCategory;

  const subSubsForSelectedSubcategory = selectedSubcategory
    ? categories.filter((c) => c.parent_category_id === selectedSubcategory.category_id)
    : [];
  const hasSubSubcategoryOptions = subSubsForSelectedSubcategory.length > 0;
  const subSubSearchLower = subSubcategorySearch.trim().toLowerCase();
  const filteredSubSubs = subSubSearchLower
    ? subSubsForSelectedSubcategory.filter((c) => (c.name || "").toLowerCase().includes(subSubSearchLower))
    : subSubsForSelectedSubcategory;

  // Step-specific search hints — use the provider/product noun the customer
  // actually types ("photographers", not "Photography"). Falls back to the
  // step title if a step isn't in the map.
  const SEARCH_HINTS = {
    venue: "Search venues by name or city…",
    venues: "Search venues by name or city…",
    decor: "Search decorators or themes…",
    catering: "Search caterers or cuisines…",
    photography: "Search photographers…",
    "makeup-and-mehndi": "Search makeup & mehndi artists…",
    "wedding-invitation": "Search invitations…",
    shopping: "Search products, brands or categories…",
    gifting: "Search gifts and hampers…",
    streedhan: "Search streedhan items…",
    pagfera: "Search pagfera services…",
    honeymoon: "Search honeymoon destinations…",
  };
  const searchPlaceholder =
    SEARCH_HINTS[step.slug] || `Search ${step.title?.toLowerCase() || "items"}…`;

  function handleSearch() {
    router.push(makeJourneyHref({ search: searchQuery.trim() }));
  }

  return (
    <div className="w-full px-4 py-8 mx-auto sm:px-6 lg:px-20">
      <JourneyStepStrip steps={steps} step={step} />

      {/* Mockup trust strip ("All venues verified by MyShaadi" …) — hidden on
          mobile to keep the top of the page compact. */}
      <div className="hidden sm:block">
        <TrustStrip items={trustItems} />
      </div>

      {/* Occasion tabs (gifting mockup) — top categories as segmented
          tabs instead of the dropdown button. */}
      {useCategoryTabs ? (
        <div className="mx-auto mt-6 flex max-w-2xl overflow-hidden rounded-2xl border border-border bg-surface p-1 shadow-[0_12px_30px_rgba(0,0,0,0.03)]">
          {topCategories.map((category) => {
            const active = category.category_id === selectedCategory?.category_id;
            return (
              <Link
                key={category.category_id}
                href={makeJourneyHref({
                  categorySlug: categoryUrlSegment(category),
                  subcategorySlug: undefined,
                  subSubcategorySlug: undefined,
                })}
                className={`flex-1 rounded-xl px-3 py-2.5 text-center text-sm font-bold transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted hover:bg-surface-muted"
                }`}
              >
                {category.name}
              </Link>
            );
          })}
        </div>
      ) : null}

      {/* Filter toolbar — ONE cohesive row. A single horizontally
          scrollable strip holds every filter control (plan chips →
          category cascade → attribute pills → clear-all), with the
          search box pinned (non-scrolling) on the right. Children are
          shrink-0 so they slide off-screen and you scroll left/right
          instead of compressing. */}
      <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="scrollbar-hide order-last flex min-w-0 flex-1 items-center gap-2.5 overflow-x-auto pb-1.5 sm:order-none">
          {/* Step Budget pill — the SINGLE price control for the step.
              The signup per-step budget caps which items show. */}
          <button
            type="button"
            onClick={() => setIsBudgetModalOpen(true)}
            className="flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface px-3.5 text-sm font-medium text-text transition-colors hover:border-primary/40"
          >
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              {step.title} Budget:
              <span className="font-bold leading-none text-text-strong">
                <BudgetBadge
                  noLimit={capOffActive}
                  effectiveCap={appliedBudgetCap}
                  defaultBudget={step.default_budget}
                />
              </span>
            </span>
            <Pencil className="h-3.5 w-3.5 shrink-0 text-border-strong" aria-hidden />
          </button>

          {showSignupLocFilter ? (
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              aria-pressed={!matchLocOff}
              className={`flex h-11 shrink-0 max-w-56 cursor-pointer items-center gap-2 rounded-xl border bg-surface px-3.5 text-sm font-medium transition-colors ${
                !matchLocOff
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border text-text hover:border-primary/40"
              }`}
            >
              <MapPin className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">
                {!matchLocOff && areaFilterSummary ? areaFilterSummary : "Destination"}
              </span>
            </button>
          ) : null}

          {showSignupGuestFilter ? (
            <button
              type="button"
              onClick={() => setIsGuestModalOpen(true)}
              aria-pressed={!matchGuestsOff}
              className={`flex h-11 shrink-0 max-w-56 cursor-pointer items-center gap-2 rounded-xl border bg-surface px-3.5 text-sm font-medium transition-colors ${
                !matchGuestsOff
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border text-text hover:border-primary/40"
              }`}
            >
              <Users className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">
                {!matchGuestsOff && guestFilterSummary ? guestFilterSummary : "Guest size"}
              </span>
            </button>
          ) : null}

        {stepHasCategories ? (
        <div
          ref={filtersWrapRef}
          className="flex shrink-0 items-center gap-2.5"
        >
          {/* Category — own button + popover (hidden when the occasion
              tabs above already cover top-level category selection) */}
          {!useCategoryTabs ? (
          <div className="relative z-30 shrink-0 w-44 sm:w-52">
            <button
              ref={categoryTriggerRef}
              type="button"
              onClick={() => {
                setSubcategoryMenuOpen(false);
                setSubSubcategoryMenuOpen(false);
                setCategoryMenuOpen((open) => !open);
              }}
              aria-expanded={categoryMenuOpen}
              aria-haspopup="listbox"
              className="flex h-11 w-full cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface px-3.5 text-left text-sm font-medium text-text shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-primary/40"
            >
              <div className={`text-subtle transition-colors ${categoryMenuOpen ? "text-primary" : ""}`}>
                <LayoutGrid className="w-5 h-5" />
              </div>
              <span className="flex-1 min-w-0 truncate">{selectedCategory ? selectedCategory.name : "Category"}</span>
            </button>
            <FilterPopover
              open={categoryMenuOpen && topCategories.length > 0}
              triggerRef={categoryTriggerRef}
              onClose={() => setCategoryMenuOpen(false)}
            >
                <div className="p-2 border-b border-border">
                  <div className="relative">
                    <Search className="absolute w-4 h-4 -translate-y-1/2 pointer-events-none left-3 top-1/2 text-subtle" />
                    <input
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      placeholder="Search categories…"
                      className="w-full h-9 pr-3 text-sm border outline-none rounded-lg border-border bg-surface pl-9 text-text placeholder:text-subtle focus:border-primary focus:ring-2 focus:ring-primary/15"
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Search categories"
                    />
                  </div>
                </div>
                <div className="scrollbar-themed min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain p-2" role="listbox">
                  {filteredCategories.length === 0 ? (
                    <p className="px-3 py-4 text-sm text-center text-muted">No categories match your search.</p>
                  ) : (
                    <div className="grid gap-1">
                      {filteredCategories.map((category) => {
                        const active = category.category_id === selectedCategory?.category_id;
                        return (
                          <Link
                            key={category.category_id}
                            href={makeJourneyHref({
                              categorySlug: categoryUrlSegment(category),
                              subcategorySlug: undefined,
                              subSubcategorySlug: undefined,
                              search: searchQuery.trim(),
                            })}
                            onClick={() => {
                              setCategoryMenuOpen(false);
                              setCategorySearch("");
                            }}
                            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                              active ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-muted"
                            }`}
                            role="option"
                            aria-selected={active}
                          >
                            {category.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
            </FilterPopover>
          </div>
          ) : null}

          {/* Subcategory — separate button + popover (only if this category has subs) */}
          {hasSubcategoryOptions ? (
            <div className="relative z-30 w-full sm:min-w-50 sm:flex-1 lg:w-auto lg:max-w-xs lg:flex-none">
              <button
                ref={subcategoryTriggerRef}
                type="button"
                onClick={() => {
                  setCategoryMenuOpen(false);
                  setSubSubcategoryMenuOpen(false);
                  setSubcategoryMenuOpen((open) => !open);
                }}
                aria-expanded={subcategoryMenuOpen}
                aria-haspopup="listbox"
                className="flex h-11 w-full cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface px-3.5 text-left text-sm font-medium text-text shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-primary/40"
              >
                <div className={`text-subtle transition-colors ${subcategoryMenuOpen ? "text-primary" : ""}`}>
                  <Tags className="w-5 h-5" />
                </div>
                <span className="flex-1 min-w-0 truncate">
                  {selectedSubcategory ? selectedSubcategory.name : "All types"}
                </span>
              </button>
              <FilterPopover
                open={subcategoryMenuOpen}
                triggerRef={subcategoryTriggerRef}
                onClose={() => setSubcategoryMenuOpen(false)}
              >
                  <div className="p-2 border-b border-border">
                    <div className="relative">
                      <Search className="absolute w-4 h-4 -translate-y-1/2 pointer-events-none left-3 top-1/2 text-subtle" />
                      <input
                        value={subcategorySearch}
                        onChange={(e) => setSubcategorySearch(e.target.value)}
                        placeholder="Search types…"
                        className="w-full h-9 pr-3 text-sm border outline-none rounded-lg border-border bg-surface pl-9 text-text placeholder:text-subtle focus:border-primary focus:ring-2 focus:ring-primary/15"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Search subcategories"
                      />
                    </div>
                  </div>
                  <div
                    className="scrollbar-themed min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain p-2"
                    role="listbox"
                    aria-label="Subcategories"
                  >
                    <div className="grid gap-1">
                      <Link
                        href={makeJourneyHref({
                          categorySlug: selectedCategorySlug,
                          subcategorySlug: undefined,
                          subSubcategorySlug: undefined,
                          search: searchQuery.trim(),
                        })}
                        onClick={() => {
                          setSubcategoryMenuOpen(false);
                          setSubcategorySearch("");
                        }}
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          !selectedSubcategoryId ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-muted"
                        }`}
                        role="option"
                      >
                        All in category
                      </Link>
                      {filteredSubs.length === 0 ? (
                        <p className="px-2 py-3 text-xs text-center text-muted">No match</p>
                      ) : (
                        filteredSubs.map((sub) => {
                          const active = sub.category_id === selectedSubcategoryId;
                          return (
                            <Link
                              key={sub.category_id}
                              href={makeJourneyHref({
                                categorySlug: selectedCategorySlug,
                                subcategorySlug: categoryUrlSegment(sub),
                                subSubcategorySlug: undefined,
                                search: searchQuery.trim(),
                              })}
                              onClick={() => {
                                setSubcategoryMenuOpen(false);
                                setSubcategorySearch("");
                              }}
                              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                active ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-muted"
                              }`}
                              role="option"
                              aria-selected={active}
                            >
                              {sub.name}
                            </Link>
                          );
                        })
                      )}
                    </div>
                  </div>
              </FilterPopover>
            </div>
          ) : null}

          {/* Sub-subcategory — 3rd level, shown only when this subcategory has children */}
          {hasSubcategoryOptions && hasSubSubcategoryOptions ? (
            <div className="relative z-30 w-full sm:min-w-50 sm:flex-1 lg:w-auto lg:max-w-xs lg:flex-none">
              <button
                ref={subSubcategoryTriggerRef}
                type="button"
                onClick={() => {
                  setCategoryMenuOpen(false);
                  setSubcategoryMenuOpen(false);
                  setSubSubcategoryMenuOpen((open) => !open);
                }}
                aria-expanded={subSubcategoryMenuOpen}
                aria-haspopup="listbox"
                className="flex h-11 w-full cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface px-3.5 text-left text-sm font-medium text-text shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-primary/40"
              >
                <div className={`text-subtle transition-colors ${subSubcategoryMenuOpen ? "text-primary" : ""}`}>
                  <Tags className="w-5 h-5" />
                </div>
                <span className="flex-1 min-w-0 truncate">
                  {selectedSubSubcategory ? selectedSubSubcategory.name : "All sub-types"}
                </span>
              </button>
              <FilterPopover
                open={subSubcategoryMenuOpen}
                triggerRef={subSubcategoryTriggerRef}
                onClose={() => setSubSubcategoryMenuOpen(false)}
              >
                  <div className="p-2 border-b border-border">
                    <div className="relative">
                      <Search className="absolute w-4 h-4 -translate-y-1/2 pointer-events-none left-3 top-1/2 text-subtle" />
                      <input
                        value={subSubcategorySearch}
                        onChange={(e) => setSubSubcategorySearch(e.target.value)}
                        placeholder="Search sub-types…"
                        className="w-full h-9 pr-3 text-sm border outline-none rounded-lg border-border bg-surface pl-9 text-text placeholder:text-subtle focus:border-primary focus:ring-2 focus:ring-primary/15"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Search sub-subcategories"
                      />
                    </div>
                  </div>
                  <div
                    className="scrollbar-themed min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain p-2"
                    role="listbox"
                    aria-label="Sub-subcategories"
                  >
                    <div className="grid gap-1">
                      <Link
                        href={makeJourneyHref({
                          categorySlug: selectedCategorySlug,
                          subcategorySlug: selectedSubcategorySlug,
                          subSubcategorySlug: undefined,
                          search: searchQuery.trim(),
                        })}
                        onClick={() => {
                          setSubSubcategoryMenuOpen(false);
                          setSubSubcategorySearch("");
                        }}
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          !selectedSubSubcategoryId ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-muted"
                        }`}
                        role="option"
                      >
                        All in sub-type
                      </Link>
                      {filteredSubSubs.length === 0 ? (
                        <p className="px-2 py-3 text-xs text-center text-muted">No match</p>
                      ) : (
                        filteredSubSubs.map((ss) => {
                          const active = ss.category_id === selectedSubSubcategoryId;
                          return (
                            <Link
                              key={ss.category_id}
                              href={makeJourneyHref({
                                categorySlug: selectedCategorySlug,
                                subcategorySlug: selectedSubcategorySlug,
                                subSubcategorySlug: categoryUrlSegment(ss),
                                search: searchQuery.trim(),
                              })}
                              onClick={() => {
                                setSubSubcategoryMenuOpen(false);
                                setSubSubcategorySearch("");
                              }}
                              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                active ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-muted"
                              }`}
                              role="option"
                              aria-selected={active}
                            >
                              {ss.name}
                            </Link>
                          );
                        })
                      )}
                    </div>
                  </div>
              </FilterPopover>
            </div>
          ) : null}
        </div>
        ) : null}

        {/* Mockup-driven per-step attribute filters — venue type /
            cuisine / theme / packaging dropdowns etc. Applied client-side
            over the loaded item set; items without the attribute stay
            visible. Rendered inline in the same scrollable strip. */}
        {listingCfg ? (
          <div className="flex shrink-0 items-center gap-2.5">
            {listingCfg.filters.map((f) => {
              // Price-range filter renders a pill button that opens the
              // dual-thumb PriceRangeModal; its value is { min, max } | null.
              if (f.kind === "price-range") {
                const range = attrFilters[f.key] || null;
                const rangeActive = !!range;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setPriceModalOpen(true)}
                    aria-label={f.label}
                    className={`flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl border px-3.5 text-sm font-medium transition-colors ${
                      rangeActive
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border bg-surface text-text hover:border-primary/40"
                    }`}
                  >
                    <Tags className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="whitespace-nowrap">
                      {describePriceRange(range, f.label)}
                    </span>
                  </button>
                );
              }
              const active = !!attrFilters[f.key];
              const filterOptions = [
                { value: "", label: f.label },
                ...f.options.map((o) => ({ value: o.value, label: o.label })),
              ];
              return (
                <Dropdown
                  key={f.key}
                  value={attrFilters[f.key] || ""}
                  onChange={(next) =>
                    setAttrFilters((prev) => ({ ...prev, [f.key]: next }))
                  }
                  options={filterOptions}
                  placeholder={f.label}
                  ariaLabel={f.label}
                  className={`shrink-0 w-auto min-w-44 max-w-56 ${
                    active
                      ? "[&>button]:border-primary [&>button]:bg-primary-soft [&>button]:text-primary"
                      : ""
                  }`}
                />
              );
            })}
          </div>
        ) : null}

        {/* Clear-all attribute filters — last item in the strip. */}
        {activeAttrCount > 0 ? (
          <button
            type="button"
            onClick={() => setAttrFilters({})}
            className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold text-muted transition-colors hover:bg-surface-muted hover:text-primary"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Clear all
          </button>
        ) : null}
        </div>

        {/* Search — pinned (non-scrolling) on the right, fixed width. */}
        <div className="w-full sm:w-56 sm:shrink-0 lg:w-72">
          <div className="group flex h-11 items-center gap-1.5 rounded-xl bg-surface pl-3 pr-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-border transition-all focus-within:ring-2 focus-within:ring-primary/50">
            <Search
              className="h-4 w-4 shrink-0 text-subtle transition-colors group-focus-within:text-primary"
              aria-hidden
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-text outline-none placeholder:text-subtle"
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  router.push(makeJourneyHref({ search: "" }));
                }}
                aria-label="Clear search"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-surface-muted hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleSearch}
              aria-label="Search"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_6px_16px_rgba(255,79,134,0.25)] transition-all hover:bg-primary-hover active:scale-95"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* The "Plan / In quotation / Remaining" summary used to live
          here as its own button. It now sits inside the BudgetModal
          itself (opened by the "<Step> Budget" filter chip above), so
          the journey strip stays focused on filters + items. */}

      {isBudgetModalOpen ? (
        <BudgetModal
          key={`${step.step_id}-${budgetModalSeed}-${capOffActive}`}
          onClose={() => setIsBudgetModalOpen(false)}
          stepTitle={step.title}
          defaultBudget={step.default_budget || 0}
          maxBudget={step.max_budget || MAX_BUDGET_PER_STEP}
          seedAmount={budgetModalSeed}
          onApply={(amount) => {
            router.replace(
              makeJourneyHref({
                capOff: false,
                budget: amount,
              }),
            );
          }}
          onSaveToProfile={canSaveProfile ? saveBudgetToProfile : null}
          onClearCap={() => {
            router.replace(
              makeJourneyHref({
                capOff: true,
                budget: undefined,
              }),
            );
          }}
        />
      ) : null}

      {isGuestModalOpen ? (
        <GuestFilterModal
          key={`g-${effectiveGuestCount}-${matchGuestsOff ? "off" : "on"}`}
          seedCount={effectiveGuestCount}
          onClose={() => setIsGuestModalOpen(false)}
          onApplyUrl={(n) => router.replace(makeJourneyHref({ guestCount: n, matchGuestsOff: false }))}
          onSaveToProfile={canSaveProfile ? saveGuestCountToProfile : null}
          onFilterOff={() => router.replace(makeJourneyHref({ matchGuestsOff: true, guestCount: undefined }))}
        />
      ) : null}

      {isLocationModalOpen ? (
        <LocationFilterModal
          key={`loc-${effectiveVenueLocation || "empty"}-${venueLocForUrl || "p"}`}
          seedLabel={effectiveVenueLocation}
          onClose={() => setIsLocationModalOpen(false)}
          onApplyUrl={(label) => router.replace(makeJourneyHref({ venueLoc: label, matchLocOff: false }))}
          onSaveToProfile={canSaveProfile ? saveVenueLocationToProfile : null}
          onFilterOff={() => router.replace(makeJourneyHref({ matchLocOff: true, venueLoc: undefined }))}
        />
      ) : null}

      {priceModalOpen && priceFilterCfg ? (
        <PriceRangeModal
          key={`price-${step.step_id}`}
          stepTitle={step.title}
          min={priceFilterCfg.min}
          max={priceFilterCfg.max}
          step={priceFilterCfg.step}
          seedRange={attrFilters[priceFilterCfg.key] || null}
          onClose={() => setPriceModalOpen(false)}
          onApply={(range) =>
            setAttrFilters((prev) => ({ ...prev, [priceFilterCfg.key]: range }))
          }
          onClear={() =>
            setAttrFilters((prev) => {
              const next = { ...prev };
              delete next[priceFilterCfg.key];
              return next;
            })
          }
        />
      ) : null}

      <JourneyStepNav
        prevHref={activeIndex > 0 ? `/journey/${steps[activeIndex - 1].slug}` : null}
        nextHref={
          activeIndex === steps.length - 1
            ? "/cart?tab=quotation"
            : `/journey/${steps[activeIndex + 1].slug}`
        }
        nextIsCart={activeIndex === steps.length - 1}
      >
          {/* Results count + sort row (mockup: "24 venues found · Sort:
              Recommended") — only on mockup-configured listing steps. */}
          {listingCfg && hasVisibleItems ? (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-text">
                {totalItems} {totalItems === 1 ? "option" : "options"} found
              </p>
              <label className="flex items-center gap-2 text-xs font-medium text-muted">
                Sort:
                <Dropdown
                  value={sortBy}
                  onChange={setSortBy}
                  options={JOURNEY_SORT_OPTIONS}
                  placeholder="Recommended"
                  ariaLabel="Sort results"
                  className="w-48 [&>button]:h-9 [&>button]:rounded-lg [&>button]:border-border-strong [&>button]:text-xs [&>button]:font-semibold"
                />
              </label>
            </div>
          ) : null}
          {hasVisibleItems ? (
            <>
            <div className="grid gap-6 sm:grid-cols-2 sm:gap-7 lg:grid-cols-3 lg:gap-8">
              {pagedItems.map((item, index) => {
                const whiteLabelOn = !item.vendor_id;
                const vendorName = whiteLabelOn
                  ? "MyShaadiStore"
                  : item.vendor_business_name || item.vendor_name || "Vendor";
                const subForItem = item.subcategory_id
                  ? categories.find((c) => c.category_id === item.subcategory_id)
                  : null;
                const categoryLabel = subForItem?.name || selectedCategory?.name || step.title;
                const v2Highlights = stepNature ? highlightsForItem(step, item) : [];
                // Mockup-configured steps render the step-specific card
                // (badge / spec chips / metrics block); others keep the
                // generic premium card.
                return listingCfg ? (
                  <JourneyListingCard
                    key={item.item_id}
                    item={item}
                    cardCfg={listingCfg.card}
                    fallbackImage={fallbackImages[index % fallbackImages.length]}
                    captureDetails={captureDetailsOn}
                  />
                ) : (
                  <ProductCard
                    key={item.item_id}
                    item={item}
                    vendorName={vendorName}
                    whiteLabelOn={whiteLabelOn}
                    step={step}
                    fallbackImage={fallbackImages[index % fallbackImages.length]}
                    highlights={v2Highlights}
                    categoryLabel={categoryLabel}
                    cartKind="quotation"
                    captureDetails={captureDetailsOn}
                  />
                );
              })}
            </div>
            <Pagination
              page={currentPage}
              pageSize={JOURNEY_PAGE_SIZE}
              total={totalItems}
              onPageChange={setPage}
            />
            </>
          ) : (
            <div className="px-6 text-center border rounded-[28px] border-border bg-surface py-40 shadow-[0_28px_60px_rgba(15,23,42,0.06)]">
              <p className="text-base font-semibold text-text">
                {budgetCapActive
                  ? "No items within your budget"
                  : search
                    ? "No items match your search"
                    : selectedCategoryId
                      ? "No items in this category yet"
                      : "No items in this step yet"}
              </p>
              <p className="max-w-md mx-auto mt-2 text-sm text-muted">
                {budgetCapActive
                  ? `Raise your ${(step.title || "step").toLowerCase()} budget — or show every price — from the budget tile above.`
                  : search
                    ? "Try different keywords or clear search to see everything in this category."
                    : "Check back soon—new options for this journey step will show up here once they are added."}
              </p>
              {budgetCapActive ? (
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(true)}
                  className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary-hover"
                >
                  Adjust budget
                </button>
              ) : null}
            </div>
          )}
      </JourneyStepNav>

      <div>
        <BasketButton floating />
      </div>
    </div>
  );
}
