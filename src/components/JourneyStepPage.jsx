"use client";

import BudgetBadge from "@/components/BudgetBadge";
import BasketButton from "@/components/BasketButton";
import { Plus, Minus, Heart, ShoppingCart } from "lucide-react";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  LayoutGrid,
  Search,
  Check,
  LockKeyhole,
  X,
  MapPin,
  SlidersHorizontal,
  Tags,
  Star,
  ArrowUp,
  ArrowDown,
  IndianRupee,
  Users,
} from "lucide-react";
import { useAuthUser, getAuthToken, saveAuthCookies } from "@/lib/authCookies";
import { updateMyProfile } from "@/lib/api";
import CityStateDropdown from "@/components/CityStateDropdown";
import { buildLocationLabel } from "@/lib/indiaLocations";
import { safeCssUrl } from "@/lib/utils";
import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addToCart, useCartState, updateCartQuantity, removeFromCart } from "@/lib/cartStore";
import Pagination from "@/components/Pagination";
import ItemCardV2 from "@/components/ItemCardV2";

// Customer journey page items grid pagination — 24 fits a 4-col grid in 6 rows.
const JOURNEY_PAGE_SIZE = 24;

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
      add("Fabric", a.fabric || a.material);
      add("Color", a.color);
      add("Occasion", a.occasion);
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

function StarRating({ value = 4 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2, 3, 4].map((index) => (
        <Star
          key={index}
          className={`h-3.5 w-3.5 ${
            index < value ? "fill-warning text-warning" : "fill-border-strong text-border-strong"
          }`}
        />
      ))}
    </div>
  );
}

function formatAmount(value) {
  const amount = Number(value || 0);
  if (amount >= 100000) {
    return `${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1)}L`;
  }
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount);
}

const MAX_BUDGET_PER_STEP = 10000000;
// Sliders now move in ₹1,000 increments — a much finer drag than the
// old 50k step, while still keeping the slider thumb usable across the
// full ₹0..₹1 crore range.
const BUDGET_STEP = 1000;

/**
 * BudgetStatusStrip — slim "Plan / In basket / Remaining" status row
 * rendered at the top of the BudgetModal. Tints red when the basket is
 * over plan, green otherwise. When the basket has items for this step
 * we also surface a one-line "biggest category" summary so the user
 * can see where the spend went without leaving the planner.
 */
function BudgetStatusStrip({
  stepTitle,
  planRupees,
  spentRupees,
  remainingRupees,
  quotationItemsForStep = [],
}) {
  const plan = planRupees != null ? Number(planRupees) || 0 : null;
  const spent = Number(spentRupees) || 0;
  const remaining = remainingRupees != null ? Number(remainingRupees) || 0 : null;
  const overBudget = plan != null && spent > plan;
  const pct = plan && plan > 0 ? Math.min(100, Math.round((spent / plan) * 100)) : 0;

  // Group basket items by category so we can show the biggest spender.
  const byCategory = (quotationItemsForStep || []).reduce((acc, it) => {
    const key = it?.category_label || it?.subcategory_label || "Other";
    if (!acc[key]) acc[key] = 0;
    acc[key] += (Number(it?.final_price ?? it?.price ?? 0)) * Number(it?.quantity || 1);
    return acc;
  }, {});
  const top = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="mb-5 rounded-2xl border border-border bg-surface-muted/40 px-4 py-3 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
          {stepTitle} basket vs plan
        </p>
        <p className="text-xs font-medium text-muted">
          {plan != null ? `${formatCurrency(spent)} of ${formatCurrency(plan)}` : `${formatCurrency(spent)} committed`}
        </p>
      </div>

      {plan != null ? (
        <>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface">
            <div
              className={`h-full rounded-full ${overBudget ? "bg-danger" : "bg-success"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Plan</div>
              <div className="font-bold text-text-strong">{formatCurrency(plan)}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted">In basket</div>
              <div className="font-bold text-text-strong">{formatCurrency(spent)}</div>
            </div>
            <div>
              <div
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  overBudget ? "text-danger" : "text-success"
                }`}
              >
                {overBudget ? "Over by" : "Remaining"}
              </div>
              <div className={`font-bold ${overBudget ? "text-danger" : "text-success"}`}>
                {overBudget ? formatCurrency(spent - plan) : formatCurrency(remaining || 0)}
              </div>
            </div>
          </div>
        </>
      ) : (
        <p className="mt-1.5 text-xs text-muted">
          No plan set yet — pick an amount below and the strip will start tracking.
        </p>
      )}

      {top ? (
        <p className="mt-2 text-[11px] text-muted">
          Biggest line in your basket:{" "}
          <span className="font-semibold text-text">{top[0]}</span>
          <span className="text-muted"> ({formatCurrency(top[1])})</span>
        </p>
      ) : null}
    </div>
  );
}

// The old `BudgetSummaryButton` + `BudgetSummaryDialog` (a separate
// summary card mounted under the filter row) lived here. They were
// removed once the same data started rendering inside BudgetModal via
// BudgetStatusStrip — keep that pattern; don't reintroduce a
// standalone summary surface.

function BudgetModal({
  onClose,
  stepId,
  stepTitle,
  defaultBudget = 0,
  maxBudget = MAX_BUDGET_PER_STEP,
  seedAmount = 0,
  onboarding = {},
  onApply,
  onClearCap,
  // Live "what's in the basket vs the plan" summary — used to live in a
  // separate card below the filter row; now rendered at the top of this
  // modal so the user sees plan/spent/remaining in the same place where
  // they edit it.
  planRupees = null,
  spentRupees = 0,
  remainingRupees = null,
  quotationItemsForStep = [],
}) {
  const [amount, setAmount] = useState(() => Number(seedAmount ?? defaultBudget) || 0);
  const [error, setError] = useState("");

  const effectiveMaxBudget = Math.max(Number(maxBudget) || 0, Number(defaultBudget) || 0, 500000);

  const planPreview = useMemo(() => {
    const allocations = Array.isArray(onboarding?.budget_allocations) ? onboarding.budget_allocations : [];
    const stepInPlan = Number(allocations.find((a) => a.step_id === stepId)?.amount) || 0;
    const budgetTotal = Number(onboarding?.budget_total) || 0;
    const hasSavedPlan = allocations.length > 0 || budgetTotal > 0;
    const projectedTotal = Math.max(0, budgetTotal - stepInPlan + (Number(amount) || 0));
    const delta = projectedTotal - budgetTotal;
    return { hasSavedPlan, projectedTotal, delta, budgetTotal, stepInPlan };
  }, [onboarding, stepId, amount]);

  function handleApply() {
    setError("");
    try {
      onApply?.(Math.max(0, Math.min(effectiveMaxBudget, Number(amount) || 0)));
      onClose();
    } catch (err) {
      setError(err?.message || "Something went wrong");
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
        className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-[0_24px_80px_rgba(15,23,42,0.2)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 id="budget-modal-title" className="text-lg font-semibold text-text-strong">
            {stepTitle} budget planner
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

        {/* Live status row — plan vs basket vs remaining for THIS step.
            Tints red when the basket is over plan; green otherwise. */}
        <BudgetStatusStrip
          stepTitle={stepTitle}
          planRupees={planRupees}
          spentRupees={spentRupees}
          remainingRupees={remainingRupees}
          quotationItemsForStep={quotationItemsForStep}
        />

        <div className="space-y-5">
          {planPreview.hasSavedPlan ? (
            <div className="px-4 py-3 border rounded-xl border-border bg-surface-muted">
              <p className="text-xs font-semibold tracking-wide uppercase text-subtle">Estimated full plan total</p>
              <p className="mt-1 text-xl font-semibold text-text-strong">{formatCurrency(planPreview.projectedTotal)}</p>
              {planPreview.delta !== 0 ? (
                <p
                  className={`mt-1 text-sm font-semibold ${planPreview.delta > 0 ? "text-warning-strong" : "text-success"}`}
                >
                  {planPreview.delta > 0 ? (
                    <ArrowUp className="mr-1 inline-block h-4 w-4 align-[-2px]" aria-hidden="true" />
                  ) : (
                    <ArrowDown className="mr-1 inline-block h-4 w-4 align-[-2px]" aria-hidden="true" />
                  )}
                  {formatCurrency(Math.abs(planPreview.delta))} from your saved plan
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted">Matches your saved plan total</p>
              )}
            </div>
          ) : null}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold tracking-wide uppercase text-muted">This step</label>
              <div className="text-sm font-semibold text-text-strong">{formatCurrency(amount)}</div>
            </div>

            <div className="relative">
              <span className="absolute text-sm font-semibold -translate-y-1/2 left-4 top-1/2 text-subtle">Rs</span>
              <input
                type="number"
                min="0"
                max={effectiveMaxBudget}
                step={BUDGET_STEP}
                value={amount}
                onChange={(e) =>
                  setAmount(Math.max(0, Math.min(effectiveMaxBudget, Number(e.target.value) || 0)))
                }
                className="w-full pl-10 pr-4 text-sm font-semibold border outline-none h-11 rounded-xl border-border-strong bg-surface text-text focus:border-primary"
                autoFocus
              />
            </div>

            <div className="pt-1">
              <input
                type="range"
                min="0"
                max={effectiveMaxBudget}
                step={BUDGET_STEP}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full h-2 cursor-pointer accent-primary"
              />
              <div className="mt-2 flex justify-between text-[11px] text-muted">
                <span>Min</span>
                <span>Max {formatAmount(effectiveMaxBudget)}</span>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted">
              Choose how much you want to spend on this part of the wedding. We’ll narrow the list to ideas that fit —
              adjust anytime.
            </p>
          </div>

          {error ? (
            <div className="px-3 py-2 text-sm border rounded-xl border-danger/30 bg-danger/10 text-danger">{error}</div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                onClearCap?.();
                onClose();
              }}
              className="text-xs font-semibold text-muted underline-offset-2 hover:text-primary hover:underline"
            >
              Show everything (no price limit)
            </button>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 text-sm font-medium border rounded-xl border-border-strong text-muted hover:bg-surface-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="h-10 px-4 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PriceFilterModal({ onClose, seedCap, summaryLine, onApply, onClearUrl }) {
  const [capS, setCapS] = useState(() => (seedCap != null && Number.isFinite(Number(seedCap)) ? String(seedCap) : ""));
  const [error, setError] = useState("");

  function submit() {
    setError("");
    const raw = String(capS).replace(/[^\d]/g, "");
    if (!raw) {
      setError("Enter a maximum price in rupees.");
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) {
      setError("Enter a valid amount.");
      return;
    }
    onApply?.(Math.round(n));
    onClose();
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
        aria-labelledby="price-filter-title"
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-[0_24px_80px_rgba(15,23,42,0.2)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 id="price-filter-title" className="text-lg font-semibold text-text-strong">
            Product budget
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
        <label className="block mb-1 text-xs font-semibold tracking-wide uppercase text-subtle">
          Max offer price (₹)
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={capS}
          onChange={(e) => setCapS(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="e.g. 500000"
          className="w-full px-3 text-sm font-semibold border outline-none h-11 rounded-xl border-border-strong bg-surface-muted text-text-strong focus:border-primary"
          aria-label="Maximum offer price"
        />
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-6">
          {onClearUrl ? (
            <button
              type="button"
              onClick={() => {
                onClearUrl();
                onClose();
              }}
              className="text-xs font-semibold text-muted underline-offset-2 hover:text-text-strong hover:underline"
            >
              Match step budget again (remove product override)
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 text-sm font-medium border rounded-xl border-border-strong text-muted hover:bg-surface-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              className="h-10 px-4 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover"
            >
              Apply
            </button>
          </div>
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

function formatCurrency(value) {
  const amount = Number(value || 0);
  if (amount >= 100000) {
    return `${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1)}L`;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function describeProductPriceCapLine(cap, customizedInUrl) {
  if (cap == null || !Number.isFinite(Number(cap))) return "Showing all offer prices";
  const n = Number(cap);
  if (n === 0) return "Showing listings with ₹0 offer price only";
  return `${formatCurrency(n)}`;
}

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
  productPriceCap = null,
  productPriceMaxForUrl = undefined,
  guestCountForUrl = undefined,
  venueLocForUrl = undefined,
  effectiveGuestCount = 0,
  effectiveVenueLocation = "",
}) {
  const router = useRouter();
  const authUser = useAuthUser();
  const cartState = useCartState();
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
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
  const stepNature = useMemo(() => resolveStepNature(step), [step]);

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
      matchLocOff,
      matchGuestsOff,
      priceMax: productPriceMaxForUrl,
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
      isPriceModalOpen ||
      isGuestModalOpen ||
      isLocationModalOpen ||
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
    isPriceModalOpen,
    isGuestModalOpen,
    isLocationModalOpen,
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

  useEffect(() => {
    if (!categoryMenuOpen && !subcategoryMenuOpen && !subSubcategoryMenuOpen) return;
    function onDocMouseDown(e) {
      if (filtersWrapRef.current && !filtersWrapRef.current.contains(e.target)) {
        setCategoryMenuOpen(false);
        setSubcategoryMenuOpen(false);
        setSubSubcategoryMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [categoryMenuOpen, subcategoryMenuOpen, subSubcategoryMenuOpen]);

  const activeIndex = Math.max(
    0,
    steps.findIndex((item) => item.step_id === step.step_id)
  );
  const progress = Math.round(((activeIndex + 1) / Math.max(steps.length, 1)) * 100);

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

  // Audience (bride/groom) filter was removed per ask — shoppers
  // see every item that passes the guest + city predicates. The
  // `item.audience` field is still written by admin/vendor forms and
  // can be re-surfaced later if the UX brings the pill row back.
  const visibleItems = baseItems.filter(
    (item) => itemMatchesGuests(item) && itemMatchesCity(item),
  );
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
  ]);
  const totalItems = visibleItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / JOURNEY_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedItems = visibleItems.slice(
    (currentPage - 1) * JOURNEY_PAGE_SIZE,
    currentPage * JOURNEY_PAGE_SIZE
  );

  const quotationTotalThisStep = useMemo(() => {
    const sid = String(step.step_id || "");
    return cartState.quotation.reduce((sum, line) => {
      if (String(line.journey_step_id || "") !== sid) return sum;
      const unit = Number(line.final_price ?? line.price) || 0;
      const qty = Number(line.quantity) || 0;
      return sum + unit * qty;
    }, 0);
  }, [cartState.quotation, step.step_id]);

  const stepPlanRupees = useMemo(() => {
    if (!capOffActive && appliedBudgetCap != null && Number.isFinite(Number(appliedBudgetCap))) {
      return Math.max(0, Number(appliedBudgetCap));
    }
    const alloc = Number(profileStepBudget);
    if (Number.isFinite(alloc) && alloc > 0) return alloc;
    const def = Number(step.default_budget);
    if (Number.isFinite(def) && def > 0) return def;
    return null;
  }, [capOffActive, appliedBudgetCap, profileStepBudget, step.default_budget]);

  const stepRemainingRupees =
    stepPlanRupees != null ? Math.max(0, stepPlanRupees - quotationTotalThisStep) : null;

  function applyProductPriceToUrl(maxN) {
    if (!Number.isFinite(maxN) || maxN < 0) {
      toast.error("Enter a valid maximum price.");
      return;
    }
    router.replace(makeJourneyHref({ priceMax: Math.round(maxN) }));
  }

  function clearPriceFilter() {
    router.replace(makeJourneyHref({ priceMax: undefined }));
  }

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

  const productPriceCustomized = productPriceMaxForUrl != null && Number.isFinite(Number(productPriceMaxForUrl));
  const priceFilterSummary = describeProductPriceCapLine(productPriceCap, productPriceCustomized);
  const guestFilterSummary = describeGuestFilterLine(effectiveGuestCount, matchGuestsOff);
  const areaFilterSummary = describeAreaFilterLine(effectiveVenueLocation, matchLocOff);

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

  const searchPlaceholder = step.slug === "venues" ? "Search Venue" : `Search ${step.title}`;

  function handleSearch() {
    router.push(makeJourneyHref({ search: searchQuery.trim() }));
  }

  return (
    <div className="w-full px-4 py-8 mx-auto sm:px-6 lg:px-20">
      {/*
        Step strip — fully responsive:
        • Each pill sizes to its own label width via `whitespace-nowrap` so
          long titles like "Wedding invitation" / "Makeup & Mehndi" never
          wrap inside the pill.
        • Outer container allows horizontal scroll on small screens; on
          wide screens the whole row fits comfortably. No `overflow-hidden`
          on the parent — that was clipping the right edge.
        • Connector between pills shrinks to `w-4` on small screens so the
          11-step row fits more compactly without losing the visual link.
      */}
      <div className="w-full overflow-x-auto no-scrollbar">
        <div className="inline-flex min-w-full items-center justify-start rounded-full bg-surface px-1 py-1 shadow-[0_12px_30px_rgba(0,0,0,0.03)] ring-1 ring-border md:justify-center">
          <div className="flex items-center">
            {steps.map((item, index) => {
              const isLast = index === steps.length - 1;

              return (
                <div key={item.step_id} className="flex items-center">
                  <a
                    href={`/journey/${item.slug}`}
                    title={item.title}
                    className={`flex items-center gap-2 rounded-full px-3 py-1 transition-all duration-300 shrink-0 transform active:scale-95 cursor-pointer ${
                      index<=activeIndex ? "bg-primary-soft" : "hover:bg-surface-muted"
                    }`}
                  >
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all shadow-sm ${
                      (index <= activeIndex)
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary-accent text-primary-foreground"
                    }`}>
                      {(index <= activeIndex) ? <Check className="w-3 h-3" strokeWidth={4} /> : <LockKeyhole className="h-3.5 w-3.5" strokeWidth={3} />}
                    </div>
                    <span className={`whitespace-nowrap text-sm font-semibold transition-colors duration-300 ${
                      index<=activeIndex ? "text-text-strong" : "text-subtle"
                    }`}>
                      {item.title}
                    </span>
                  </a>
                  {!isLast && (
                    <div className="h-1 w-4 lg:w-6 bg-linear-to-r from-primary-soft via-primary to-primary-soft shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-4">
        <div className="rounded-full bg-surface/80 px-2 py-1 shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-4 overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-primary shadow-[0_10px_20px_rgba(255,79,134,0.35)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-muted">{progress}% Completed</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl px-6 py-6 mx-auto mt-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">{step.title}</h1>
        <p className="mt-3 text-sm text-muted">{step.subtitle || "Select the perfect option for your special day."}</p>
      </div>

      {/* Filter row — restored chunky tile buttons (icon + label + value)
          we had before the pill experiment, but the row is now a
          horizontally scrollable strip. Filter chips never wrap to a
          second line — when there's no room they slide off-screen and
          you scroll left/right. */}
      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-center">
        <div className="-mx-4 flex items-stretch gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-6 sm:pb-1 [scrollbar-width:thin] lg:overflow-visible lg:px-0">
          <div
            onClick={() => setIsBudgetModalOpen(true)}
            className="flex shrink-0 cursor-pointer select-none items-center gap-3 rounded-xl bg-surface px-4 py-3 text-text shadow-sm ring-1 ring-border transition-all hover:bg-surface-muted"
          >
            <div className="rounded-lg bg-primary-soft p-2 text-primary">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <div className="whitespace-nowrap text-sm font-medium">
              {step.title} Budget:{" "}
              <span className="font-bold leading-none text-text-strong">
                <BudgetBadge
                  noLimit={capOffActive}
                  effectiveCap={appliedBudgetCap}
                  defaultBudget={step.default_budget}
                />
              </span>
            </div>
            <button className="ml-1 p-1 text-border-strong pointer-events-none">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsPriceModalOpen(true)}
            className={`flex shrink-0 max-w-[min(100%,17rem)] cursor-pointer select-none flex-col items-start gap-0.5 rounded-xl px-4 py-2.5 text-left text-sm font-semibold shadow-sm ring-1 transition-all ${
              productPriceCap != null
                ? "bg-primary-soft text-primary ring-primary/40"
                : "bg-surface text-text ring-border hover:bg-surface-muted"
            }`}
          >
            <span className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 shrink-0" aria-hidden />
              <span className="whitespace-nowrap">Product budget</span>
            </span>
            <span className="line-clamp-2 pl-6 text-[11px] font-medium leading-snug text-muted">
              {priceFilterSummary}
            </span>
          </button>

          {showSignupLocFilter ? (
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              aria-pressed={!matchLocOff}
              className={`flex shrink-0 max-w-[min(100%,17rem)] cursor-pointer select-none flex-col items-start gap-0.5 rounded-xl px-4 py-2.5 text-left text-sm font-semibold shadow-sm ring-1 transition-all ${
                !matchLocOff
                  ? "bg-primary-soft text-primary ring-primary/40"
                  : "bg-surface text-muted ring-border hover:bg-surface-muted"
              }`}
            >
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                <span className="whitespace-nowrap">Your dream destination</span>
              </span>
              <span className="line-clamp-2 pl-6 text-[11px] font-medium leading-snug text-muted">
                {areaFilterSummary}
              </span>
            </button>
          ) : null}

          {showSignupGuestFilter ? (
            <button
              type="button"
              onClick={() => setIsGuestModalOpen(true)}
              aria-pressed={!matchGuestsOff}
              className={`flex shrink-0 max-w-[min(100%,17rem)] cursor-pointer select-none flex-col items-start gap-0.5 rounded-xl px-4 py-2.5 text-left text-sm font-semibold shadow-sm ring-1 transition-all ${
                !matchGuestsOff
                  ? "bg-primary-soft text-primary ring-primary/40"
                  : "bg-surface text-muted ring-border hover:bg-surface-muted"
              }`}
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 shrink-0" aria-hidden />
                <span className="whitespace-nowrap">Guest size</span>
              </span>
              <span className="line-clamp-2 pl-6 text-[11px] font-medium leading-snug text-muted">
                {guestFilterSummary}
              </span>
            </button>
          ) : null}
        </div>

        {stepHasCategories ? (
        <div
          ref={filtersWrapRef}
          className="flex flex-col w-full gap-3 sm:flex-row sm:flex-wrap sm:items-stretch lg:w-auto lg:justify-center"
        >
          {/* Category — own button + popover */}
          <div className="relative z-30 w-full sm:min-w-50 sm:flex-1 lg:w-auto lg:max-w-xs lg:flex-none">
            <button
              type="button"
              onClick={() => {
                setSubcategoryMenuOpen(false);
                setSubSubcategoryMenuOpen(false);
                setCategoryMenuOpen((open) => !open);
              }}
              aria-expanded={categoryMenuOpen}
              aria-haspopup="listbox"
              className="flex w-full cursor-pointer items-center gap-3 rounded-2xl bg-surface px-5 py-4 text-left text-sm font-bold text-text shadow-[0_12px_30px_rgba(0,0,0,0.03)] ring-1 ring-border ring-inset transition-all hover:bg-surface-muted"
            >
              <div className={`text-subtle transition-colors ${categoryMenuOpen ? "text-primary" : ""}`}>
                <LayoutGrid className="w-5 h-5" />
              </div>
              <span className="flex-1 min-w-0 truncate">{selectedCategory ? selectedCategory.name : "Category"}</span>
            </button>
            {categoryMenuOpen && topCategories.length > 0 ? (
              <div
                className="absolute left-0 top-full z-50 mt-2 w-[min(calc(100vw-2rem),360px)] overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_25px_80px_rgba(16,24,40,0.15)] sm:min-w-70"
                role="presentation"
                onWheel={(e) => e.stopPropagation()}
              >
                <div className="p-2 border-b border-border">
                  <div className="relative">
                    <Search className="absolute w-4 h-4 -translate-y-1/2 pointer-events-none left-3 top-1/2 text-subtle" />
                    <input
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      placeholder="Search categories…"
                      className="w-full h-10 pr-3 text-sm border outline-none rounded-xl border-border-strong bg-surface-muted pl-9 text-text placeholder:text-subtle focus:border-primary"
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Search categories"
                    />
                  </div>
                </div>
                <div className="scrollbar-themed max-h-[min(280px,50vh)] touch-pan-y overflow-y-auto overscroll-contain p-2" role="listbox">
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
                            className={`rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
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
              </div>
            ) : null}
          </div>

          {/* Subcategory — separate button + popover (only if this category has subs) */}
          {hasSubcategoryOptions ? (
            <div className="relative z-30 w-full sm:min-w-50 sm:flex-1 lg:w-auto lg:max-w-xs lg:flex-none">
              <button
                type="button"
                onClick={() => {
                  setCategoryMenuOpen(false);
                  setSubSubcategoryMenuOpen(false);
                  setSubcategoryMenuOpen((open) => !open);
                }}
                aria-expanded={subcategoryMenuOpen}
                aria-haspopup="listbox"
                className="flex w-full cursor-pointer items-center gap-3 rounded-2xl bg-surface px-5 py-4 text-left text-sm font-bold text-text shadow-[0_12px_30px_rgba(0,0,0,0.03)] ring-1 ring-border ring-inset transition-all hover:bg-surface-muted"
              >
                <div className={`text-subtle transition-colors ${subcategoryMenuOpen ? "text-primary" : ""}`}>
                  <Tags className="w-5 h-5" />
                </div>
                <span className="flex-1 min-w-0 truncate">
                  {selectedSubcategory ? selectedSubcategory.name : "All types"}
                </span>
              </button>
              {subcategoryMenuOpen ? (
                <div
                  className="absolute left-0 top-full z-50 mt-2 w-[min(calc(100vw-2rem),360px)] overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_25px_80px_rgba(16,24,40,0.15)] sm:min-w-70"
                  role="presentation"
                  onWheel={(e) => e.stopPropagation()}
                >
                  <div className="p-2 border-b border-border">
                    <div className="relative">
                      <Search className="absolute w-4 h-4 -translate-y-1/2 pointer-events-none left-3 top-1/2 text-subtle" />
                      <input
                        value={subcategorySearch}
                        onChange={(e) => setSubcategorySearch(e.target.value)}
                        placeholder="Search types…"
                        className="w-full h-10 pr-3 text-sm border outline-none rounded-xl border-border-strong bg-surface-muted pl-9 text-text placeholder:text-subtle focus:border-primary"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Search subcategories"
                      />
                    </div>
                  </div>
                  <div
                    className="scrollbar-themed max-h-[min(280px,50vh)] touch-pan-y overflow-y-auto overscroll-contain p-2"
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
                        className={`rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
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
                              className={`rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
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
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Sub-subcategory — 3rd level, shown only when this subcategory has children */}
          {hasSubcategoryOptions && hasSubSubcategoryOptions ? (
            <div className="relative z-30 w-full sm:min-w-50 sm:flex-1 lg:w-auto lg:max-w-xs lg:flex-none">
              <button
                type="button"
                onClick={() => {
                  setCategoryMenuOpen(false);
                  setSubcategoryMenuOpen(false);
                  setSubSubcategoryMenuOpen((open) => !open);
                }}
                aria-expanded={subSubcategoryMenuOpen}
                aria-haspopup="listbox"
                className="flex w-full cursor-pointer items-center gap-3 rounded-2xl bg-surface px-5 py-4 text-left text-sm font-bold text-text shadow-[0_12px_30px_rgba(0,0,0,0.03)] ring-1 ring-border ring-inset transition-all hover:bg-surface-muted"
              >
                <div className={`text-subtle transition-colors ${subSubcategoryMenuOpen ? "text-primary" : ""}`}>
                  <Tags className="w-5 h-5" />
                </div>
                <span className="flex-1 min-w-0 truncate">
                  {selectedSubSubcategory ? selectedSubSubcategory.name : "All sub-types"}
                </span>
              </button>
              {subSubcategoryMenuOpen ? (
                <div
                  className="absolute left-0 top-full z-50 mt-2 w-[min(calc(100vw-2rem),360px)] overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_25px_80px_rgba(16,24,40,0.15)] sm:min-w-70"
                  role="presentation"
                  onWheel={(e) => e.stopPropagation()}
                >
                  <div className="p-2 border-b border-border">
                    <div className="relative">
                      <Search className="absolute w-4 h-4 -translate-y-1/2 pointer-events-none left-3 top-1/2 text-subtle" />
                      <input
                        value={subSubcategorySearch}
                        onChange={(e) => setSubSubcategorySearch(e.target.value)}
                        placeholder="Search sub-types…"
                        className="w-full h-10 pr-3 text-sm border outline-none rounded-xl border-border-strong bg-surface-muted pl-9 text-text placeholder:text-subtle focus:border-primary"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Search sub-subcategories"
                      />
                    </div>
                  </div>
                  <div
                    className="scrollbar-themed max-h-[min(280px,50vh)] touch-pan-y overflow-y-auto overscroll-contain p-2"
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
                        className={`rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
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
                              className={`rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
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
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        ) : null}

        {/* Search Section */}
        <div className="flex flex-1 items-center gap-3 rounded-2xl bg-surface p-1.5 pl-6 shadow-[0_12px_30px_rgba(0,0,0,0.03)] ring-1 ring-border lg:max-w-xl">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-muted outline-none placeholder:text-subtle"
            placeholder={searchPlaceholder}
          />
          <div className="flex items-center gap-1.5 pr-1">
            <button 
              onClick={handleSearch}
              className="flex items-center justify-center transition-all h-11 w-11 rounded-2xl bg-primary text-primary-foreground active:scale-95 hover:bg-primary-hover"
            >
              <Search className="w-5 h-5" />
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
          stepId={step.step_id}
          stepTitle={step.title}
          defaultBudget={step.default_budget || 0}
          maxBudget={step.max_budget || MAX_BUDGET_PER_STEP}
          seedAmount={budgetModalSeed}
          onboarding={authUser?.onboarding || {}}
          planRupees={stepPlanRupees}
          spentRupees={quotationTotalThisStep}
          remainingRupees={stepRemainingRupees}
          quotationItemsForStep={(cartState?.quotation || []).filter(
            (c) => String(c?.journey_step_id || "") === String(step.step_id),
          )}
          onApply={(amount) => {
            router.replace(
              makeJourneyHref({
                capOff: false,
                budget: amount,
              }),
            );
          }}
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

      {isPriceModalOpen ? (
        <PriceFilterModal
          key={`p-${productPriceCap ?? "x"}-${productPriceMaxForUrl ?? "s"}`}
          seedCap={productPriceCap}
          summaryLine={priceFilterSummary}
          onClose={() => setIsPriceModalOpen(false)}
          onApply={(maxN) => applyProductPriceToUrl(maxN)}
          onClearUrl={productPriceCustomized ? clearPriceFilter : null}
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

      <div className="mt-10 flex w-full max-w-400 mx-auto items-start gap-4 md:gap-6">
        {/* Left Phase Control — top-aligned so row height follows content only */}
        <a
          href={activeIndex > 0 ? `/journey/${steps[activeIndex - 1].slug}` : "#"}
          className={`group sticky top-24 z-10 mt-1 hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface shadow-xl ring-1 ring-border transition-all hover:bg-primary-soft hover:shadow-2xl active:scale-90 md:flex ${
            activeIndex === 0 ? "pointer-events-none opacity-10" : "cursor-pointer"
          }`}
          aria-label="Previous Phase"
        >
          <ChevronLeft className="w-6 h-6 transition-colors text-primary group-hover:text-primary-hover" />
        </a>

        <div className="flex-1 min-w-0 pb-20">
          {hasVisibleItems ? (
            <>
            <div className="grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 xl:grid-cols-4">
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
                return (
                  <ItemCardV2
                    key={item.item_id}
                    item={item}
                    vendorName={vendorName}
                    whiteLabelOn={whiteLabelOn}
                    step={step}
                    fallbackImage={fallbackImages[index % fallbackImages.length]}
                    highlights={v2Highlights}
                    categoryLabel={categoryLabel}
                    cartKind="quotation"
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
                {productPriceCap != null
                  ? "No items within this product budget"
                  : search
                    ? "No items match your search"
                    : selectedCategoryId
                      ? "No items in this category yet"
                      : "No items in this step yet"}
              </p>
              <p className="max-w-md mx-auto mt-2 text-sm text-muted">
                {productPriceCap != null
                  ? "Try raising the max price in Product budget, or remove the product override to follow your step budget again."
                  : search
                    ? "Try different keywords or clear search to see everything in this category."
                    : "Check back soon—new options for this journey step will show up here once they are added."}
              </p>
              {productPriceCustomized ? (
                <button
                  type="button"
                  onClick={clearPriceFilter}
                  className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary-hover"
                >
                  Match step budget again
                </button>
              ) : null}
            </div>
          )}
        </div>

        <a
          href={activeIndex < steps.length - 1 ? `/journey/${steps[activeIndex + 1].slug}` : "#"}
          className={`group sticky top-24 z-10 mt-1 hidden h-12 w-12 shrink-0 bg-primary items-center justify-center rounded-xl ring-1 ring-border transition-all hover:bg-primary hover:shadow-2xl active:scale-90 md:flex ${
            activeIndex === steps.length - 1 ? "pointer-events-none opacity-10" : "cursor-pointer"
          }`}
          aria-label="Next Phase"
        >
          <ChevronRight className="w-6 h-6 transition-colors text-primary-foreground" />        </a>
      </div>

      <div>
        <BasketButton floating />
      </div>
    </div>
  );
}
