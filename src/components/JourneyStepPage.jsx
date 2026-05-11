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

function categoryUrlSegment(c) {
  if (!c) return "";
  const s = String(c.slug || "").trim();
  return s || c.category_id || "";
}

function buildJourneyHref(
  slug,
  {
    categorySlug,
    subcategorySlug,
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
            index < value ? "fill-[#ffbb28] text-[#ffbb28]" : "fill-slate-200 text-slate-200"
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
const BUDGET_STEP = 50000;

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
      className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/45 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="budget-modal-title"
        className="w-full max-w-lg rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.2)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 id="budget-modal-title" className="text-lg font-semibold text-slate-800">
            {stepTitle} budget planner
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full p-2 transition-colors hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        <div className="space-y-5">
          {planPreview.hasSavedPlan ? (
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Estimated full plan total</p>
              <p className="mt-1 text-xl font-semibold text-slate-800">{formatCurrency(planPreview.projectedTotal)}</p>
              {planPreview.delta !== 0 ? (
                <p
                  className={`mt-1 text-sm font-semibold ${planPreview.delta > 0 ? "text-amber-700" : "text-emerald-700"}`}
                >
                  {planPreview.delta > 0 ? (
                    <ArrowUp className="mr-1 inline-block h-4 w-4 align-[-2px]" aria-hidden="true" />
                  ) : (
                    <ArrowDown className="mr-1 inline-block h-4 w-4 align-[-2px]" aria-hidden="true" />
                  )}
                  {formatCurrency(Math.abs(planPreview.delta))} from your saved plan
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-500">Matches your saved plan total</p>
              )}
            </div>
          ) : null}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">This step</label>
              <div className="text-sm font-semibold text-slate-800">{formatCurrency(amount)}</div>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">Rs</span>
              <input
                type="number"
                min="0"
                max={effectiveMaxBudget}
                step={BUDGET_STEP}
                value={amount}
                onChange={(e) =>
                  setAmount(Math.max(0, Math.min(effectiveMaxBudget, Number(e.target.value) || 0)))
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#ff4f86]"
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
                className="h-2 w-full cursor-pointer accent-[#ff4f86]"
              />
              <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                <span>Min</span>
                <span>Max {formatAmount(effectiveMaxBudget)}</span>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              Choose how much you want to spend on this part of the wedding. We’ll narrow the list to ideas that fit —
              adjust anytime.
            </p>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                onClearCap?.();
                onClose();
              }}
              className="text-xs font-semibold text-slate-500 underline-offset-2 hover:text-[#ff4f86] hover:underline"
            >
              Show everything (no price limit)
            </button>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="h-10 rounded-xl bg-[#ff4f86] px-4 text-sm font-semibold text-white hover:bg-[#ff3d79]"
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
      className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/45 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="price-filter-title"
        className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.2)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 id="price-filter-title" className="text-lg font-semibold text-slate-800">
            Product budget
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full p-2 transition-colors hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>
        <p className="mb-2 text-sm text-slate-500">
          Starts the same as your step budget. Change it here to filter listings by maximum offer price (after
          discount). Step budget still drives your plan row above.
        </p>
        {summaryLine ? (
          <p className="mb-4 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold leading-snug text-slate-700 ring-1 ring-slate-100">
            {summaryLine}
          </p>
        ) : null}
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
          Max offer price (₹)
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={capS}
          onChange={(e) => setCapS(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="e.g. 500000"
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-[#ff4f86]"
          aria-label="Maximum offer price"
        />
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          {onClearUrl ? (
            <button
              type="button"
              onClick={() => {
                onClearUrl();
                onClose();
              }}
              className="text-xs font-semibold text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
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
              className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              className="h-10 rounded-xl bg-[#ff4f86] px-4 text-sm font-semibold text-white hover:bg-[#ff3d79]"
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
      className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/45 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-filter-title"
        className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.2)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 id="guest-filter-title" className="text-lg font-semibold text-slate-800">
            Guest count
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full p-2 transition-colors hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>
        <p className="mb-3 text-sm text-slate-500">
          Venues with a listed capacity are filtered so the space can reasonably host your party size.
        </p>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
          Expected guests
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyUrl()}
          placeholder="e.g. 250"
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-[#ff4f86]"
        />
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={applyUrl}
            className="h-10 rounded-xl bg-[#ff4f86] px-4 text-sm font-semibold text-white hover:bg-[#ff3d79]"
          >
            Apply for this page
          </button>
          {onSaveToProfile ? (
            <button
              type="button"
              disabled={saving}
              onClick={saveProfile}
              className="h-10 rounded-xl border border-pink-200 bg-pink-50 px-4 text-sm font-semibold text-[#ff4f86] hover:bg-pink-100 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save to my account"}
            </button>
          ) : null}
        </div>
        {onFilterOff ? (
          <button
            type="button"
            className="mt-4 w-full text-center text-xs font-semibold text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
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
      className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/45 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="loc-filter-title"
        className="w-full max-w-lg rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.2)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 id="loc-filter-title" className="text-lg font-semibold text-slate-800">
            Wedding city &amp; state
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full p-2 transition-colors hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>
        <p className="mb-4 text-sm text-slate-500">
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
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={applyUrl}
            className="h-10 rounded-xl bg-[#ff4f86] px-4 text-sm font-semibold text-white hover:bg-[#ff3d79]"
          >
            Apply for this page
          </button>
          {onSaveToProfile ? (
            <button
              type="button"
              disabled={saving}
              onClick={saveProfile}
              className="h-10 rounded-xl border border-pink-200 bg-pink-50 px-4 text-sm font-semibold text-[#ff4f86] hover:bg-pink-100 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save to my account"}
            </button>
          ) : null}
        </div>
        {onFilterOff ? (
          <button
            type="button"
            className="mt-4 w-full text-center text-xs font-semibold text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
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
  const suffix = customizedInUrl ? " (your product budget)" : " (same as step budget)";
  return `Showing listings up to ${formatCurrency(n)}${suffix}`;
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
  selectedCategorySlug = "",
  selectedSubcategorySlug = "",
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
  const [categorySearch, setCategorySearch] = useState("");
  const [subcategorySearch, setSubcategorySearch] = useState("");
  const filtersWrapRef = useRef(null);

  const capOrBudgetQs = capOffActive
    ? { capOff: true }
    : budgetQueryValue !== undefined
      ? { budget: budgetQueryValue }
      : {};

  function makeJourneyHref(overrides = {}) {
    const merged = {
      categorySlug: selectedCategorySlug,
      subcategorySlug: selectedSubcategorySlug || undefined,
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
      subcategoryMenuOpen;
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
  ]);

  useEffect(() => {
    if (subcategoryMenuOpen) setSubcategorySearch("");
  }, [subcategoryMenuOpen]);

  useEffect(() => {
    if (!categoryMenuOpen && !subcategoryMenuOpen) return;
    function onDocMouseDown(e) {
      if (filtersWrapRef.current && !filtersWrapRef.current.contains(e.target)) {
        setCategoryMenuOpen(false);
        setSubcategoryMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [categoryMenuOpen, subcategoryMenuOpen]);

  const activeIndex = Math.max(
    0,
    steps.findIndex((item) => item.step_id === step.step_id)
  );
  const progress = Math.round(((activeIndex + 1) / Math.max(steps.length, 1)) * 100);

  const topCategories = categories.filter((category) => !category.parent_category_id);
  const selectedCategory =
    topCategories.find((category) => category.category_id === selectedCategoryId) || topCategories[0] || null;
  const selectedSubcategory = selectedSubcategoryId
    ? categories.find((c) => c.category_id === selectedSubcategoryId) || null
    : null;

  const visibleItems = Array.isArray(items) ? items : [];
  const hasVisibleItems = visibleItems.length > 0;

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

  const subsForSelectedCategory = categories.filter((c) => c.parent_category_id === selectedCategoryId);
  const hasSubcategoryOptions = subsForSelectedCategory.length > 0;
  const subSearchLower = subcategorySearch.trim().toLowerCase();
  const filteredSubs = subSearchLower
    ? subsForSelectedCategory.filter((c) => (c.name || "").toLowerCase().includes(subSearchLower))
    : subsForSelectedCategory;

  const searchPlaceholder = step.slug === "venues" ? "Search Venue" : `Search ${step.title}`;

  function handleSearch() {
    router.push(makeJourneyHref({ search: searchQuery.trim() }));
  }

  return (
    <div className="mx-auto w-full px-4 py-8 sm:px-6 lg:px-20 overflow-hidden">
      <div className="flex justify-center">
        <div className="inline-flex items-center overflow-x-auto rounded-full bg-white px-1 py-1 shadow-[0_12px_30px_rgba(0,0,0,0.03)] ring-1 ring-slate-100 no-scrollbar">
          <div className="flex items-center">
            {steps.map((item, index) => {
              const active = item.step_id === step.step_id;
              const isLast = index === steps.length - 1;

              return (
                <div key={item.step_id} className="flex items-center">
                  <a
                    href={`/journey/${item.slug}`}
                    className={`flex items-center gap-2 rounded-full px-4 py-1 transition-all duration-300 shrink-0 transform active:scale-95 cursor-pointer ${
                      index<=activeIndex ? "bg-[#fff1f6]" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all shadow-sm ${
                      (index <= activeIndex) 
                        ? "bg-[#ff4f86] text-white" 
                        : "bg-[#d98fa3] text-white"
                    }`}>
                      {(index <= activeIndex) ? <Check className="h-3 w-3" strokeWidth={4} /> : <LockKeyhole className="h-3.5 w-3.5" strokeWidth={3} />}
                    </div>
                    <span className={`text-sm font-semibold transition-colors duration-300 ${
                      index<=activeIndex ? "text-slate-800" : "text-slate-400"
                    }`}>
                      {item.title}
                    </span>
                  </a>
                  {!isLast && (
                    <div className="h-[4px] w-6 bg-linear-to-r from-pink-100 via-pink-500 to-pink-100 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-4 max-w-4xl">
        <div className="rounded-full bg-white/80 px-2 py-1 shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-3">
            <div className="h-4 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#ff4f86] shadow-[0_10px_20px_rgba(255,79,134,0.35)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-slate-500">{progress}% Completed</span>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-4xl px-6 py-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-700 sm:text-4xl">{step.title}</h1>
        <p className="mt-3 text-sm text-slate-500">{step.subtitle || "Select the perfect option for your special day."}</p>
      </div>

      <div className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-center">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {/* Budget Section */}
          <div
            onClick={() => setIsBudgetModalOpen(true)}
            className="flex cursor-pointer select-none items-center gap-3 rounded-xl bg-white px-4 py-3 text-slate-700 shadow-sm ring-1 ring-slate-100 transition-all hover:bg-slate-50"
          >
            <div className="rounded-lg bg-pink-50 p-2 text-pink-500">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium whitespace-nowrap">
              {step.title} Budget:{" "}
              <span className="font-bold text-slate-900 leading-none">
                <BudgetBadge
                  noLimit={capOffActive}
                  effectiveCap={appliedBudgetCap}
                  defaultBudget={step.default_budget}
                />
              </span>
            </div>
            <button className="ml-1 p-1 text-slate-300 pointer-events-none">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsPriceModalOpen(true)}
            className={`flex max-w-[min(100%,17rem)] cursor-pointer select-none flex-col items-start gap-0.5 rounded-xl px-4 py-2.5 text-left text-sm font-semibold shadow-sm ring-1 transition-all ${
              productPriceCap != null
                ? "bg-[#fff1f6] text-[#ff4f86] ring-pink-200"
                : "bg-white text-slate-700 ring-slate-100 hover:bg-slate-50"
            }`}
          >
            <span className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 shrink-0" aria-hidden />
              <span className="whitespace-nowrap">Product budget</span>
            </span>
            <span className="line-clamp-2 pl-6 text-[11px] font-medium leading-snug text-slate-600">{priceFilterSummary}</span>
          </button>

          {showSignupLocFilter ? (
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              aria-pressed={!matchLocOff}
              className={`flex max-w-[min(100%,17rem)] cursor-pointer select-none flex-col items-start gap-0.5 rounded-xl px-4 py-2.5 text-left text-sm font-semibold shadow-sm ring-1 transition-all ${
                !matchLocOff
                  ? "bg-[#fff1f6] text-[#ff4f86] ring-pink-200"
                  : "bg-white text-slate-600 ring-slate-100 hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                <span className="whitespace-nowrap">Your area</span>
              </span>
              <span className="line-clamp-2 pl-6 text-[11px] font-medium leading-snug text-slate-600">{areaFilterSummary}</span>
            </button>
          ) : null}

          {showSignupGuestFilter ? (
            <button
              type="button"
              onClick={() => setIsGuestModalOpen(true)}
              aria-pressed={!matchGuestsOff}
              className={`flex max-w-[min(100%,17rem)] cursor-pointer select-none flex-col items-start gap-0.5 rounded-xl px-4 py-2.5 text-left text-sm font-semibold shadow-sm ring-1 transition-all ${
                !matchGuestsOff
                  ? "bg-[#fff1f6] text-[#ff4f86] ring-pink-200"
                  : "bg-white text-slate-600 ring-slate-100 hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 shrink-0" aria-hidden />
                <span className="whitespace-nowrap">Guest size</span>
              </span>
              <span className="line-clamp-2 pl-6 text-[11px] font-medium leading-snug text-slate-600">{guestFilterSummary}</span>
            </button>
          ) : null}
        </div>

        <div
          ref={filtersWrapRef}
          className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch lg:w-auto lg:justify-center"
        >
          {/* Category — own button + popover */}
          <div className="relative z-30 w-full sm:min-w-[200px] sm:flex-1 lg:w-auto lg:max-w-xs lg:flex-none">
            <button
              type="button"
              onClick={() => {
                setSubcategoryMenuOpen(false);
                setCategoryMenuOpen((open) => !open);
              }}
              aria-expanded={categoryMenuOpen}
              aria-haspopup="listbox"
              className="flex w-full cursor-pointer items-center gap-3 rounded-2xl bg-white px-5 py-4 text-left text-sm font-bold text-slate-700 shadow-[0_12px_30px_rgba(0,0,0,0.03)] ring-1 ring-slate-100 ring-inset transition-all hover:bg-slate-50"
            >
              <div className={`text-slate-400 transition-colors ${categoryMenuOpen ? "text-[#ff4f86]" : ""}`}>
                <LayoutGrid className="h-5 w-5" />
              </div>
              <span className="min-w-0 flex-1 truncate">{selectedCategory ? selectedCategory.name : "Category"}</span>
            </button>
            {categoryMenuOpen && topCategories.length > 0 ? (
              <div
                className="absolute left-0 top-full z-50 mt-2 w-[min(calc(100vw-2rem),360px)] overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_25px_80px_rgba(16,24,40,0.15)] sm:min-w-[280px]"
                role="presentation"
                onWheel={(e) => e.stopPropagation()}
              >
                <div className="border-b border-slate-100 p-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      placeholder="Search categories…"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#ff4f86]"
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Search categories"
                    />
                  </div>
                </div>
                <div className="scrollbar-themed max-h-[min(280px,50vh)] touch-pan-y overflow-y-auto overscroll-contain p-2" role="listbox">
                  {filteredCategories.length === 0 ? (
                    <p className="px-3 py-4 text-center text-sm text-slate-500">No categories match your search.</p>
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
                              search: searchQuery.trim(),
                            })}
                            onClick={() => {
                              setCategoryMenuOpen(false);
                              setCategorySearch("");
                            }}
                            className={`rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                              active ? "bg-[#fff1f6] text-[#ff4f86]" : "text-slate-600 hover:bg-slate-50"
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
            <div className="relative z-30 w-full sm:min-w-[200px] sm:flex-1 lg:w-auto lg:max-w-xs lg:flex-none">
              <button
                type="button"
                onClick={() => {
                  setCategoryMenuOpen(false);
                  setSubcategoryMenuOpen((open) => !open);
                }}
                aria-expanded={subcategoryMenuOpen}
                aria-haspopup="listbox"
                className="flex w-full cursor-pointer items-center gap-3 rounded-2xl bg-white px-5 py-4 text-left text-sm font-bold text-slate-700 shadow-[0_12px_30px_rgba(0,0,0,0.03)] ring-1 ring-slate-100 ring-inset transition-all hover:bg-slate-50"
              >
                <div className={`text-slate-400 transition-colors ${subcategoryMenuOpen ? "text-[#ff4f86]" : ""}`}>
                  <Tags className="h-5 w-5" />
                </div>
                <span className="min-w-0 flex-1 truncate">
                  {selectedSubcategory ? selectedSubcategory.name : "All types"}
                </span>
              </button>
              {subcategoryMenuOpen ? (
                <div
                  className="absolute left-0 top-full z-50 mt-2 w-[min(calc(100vw-2rem),360px)] overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_25px_80px_rgba(16,24,40,0.15)] sm:min-w-[280px]"
                  role="presentation"
                  onWheel={(e) => e.stopPropagation()}
                >
                  <div className="border-b border-slate-100 p-2">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={subcategorySearch}
                        onChange={(e) => setSubcategorySearch(e.target.value)}
                        placeholder="Search types…"
                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#ff4f86]"
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
                          search: searchQuery.trim(),
                        })}
                        onClick={() => {
                          setSubcategoryMenuOpen(false);
                          setSubcategorySearch("");
                        }}
                        className={`rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                          !selectedSubcategoryId ? "bg-[#fff1f6] text-[#ff4f86]" : "text-slate-600 hover:bg-slate-50"
                        }`}
                        role="option"
                      >
                        All in category
                      </Link>
                      {filteredSubs.length === 0 ? (
                        <p className="px-2 py-3 text-center text-xs text-slate-500">No match</p>
                      ) : (
                        filteredSubs.map((sub) => {
                          const active = sub.category_id === selectedSubcategoryId;
                          return (
                            <Link
                              key={sub.category_id}
                              href={makeJourneyHref({
                                categorySlug: selectedCategorySlug,
                                subcategorySlug: categoryUrlSegment(sub),
                                search: searchQuery.trim(),
                              })}
                              onClick={() => {
                                setSubcategoryMenuOpen(false);
                                setSubcategorySearch("");
                              }}
                              className={`rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                                active ? "bg-[#fff1f6] text-[#ff4f86]" : "text-slate-600 hover:bg-slate-50"
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
        </div>

        {/* Search Section */}
        <div className="flex flex-1 items-center gap-3 rounded-2xl bg-white p-1.5 pl-6 shadow-[0_12px_30px_rgba(0,0,0,0.03)] ring-1 ring-slate-100 lg:max-w-xl">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-slate-600 outline-none placeholder:text-slate-400"
            placeholder={searchPlaceholder}
          />
          <div className="flex items-center gap-1.5 pr-1">
            <button 
              onClick={handleSearch}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ff4f86] text-white transition-all active:scale-95 hover:bg-[#ff3d79]"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-6 flex w-full max-w-[1600px] justify-center px-4 sm:px-6">
        <div className="w-full max-w-3xl rounded-2xl border border-pink-100/90 bg-linear-to-br from-pink-50/90 to-white px-4 py-3 text-sm text-slate-700 shadow-[0_12px_30px_rgba(0,0,0,0.03)] ring-1 ring-pink-50/80">
          <p className="text-xs font-bold uppercase tracking-wide text-pink-600/90">This step</p>
          {stepPlanRupees != null ? (
            <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-4 sm:gap-y-1">
              <span>
                <span className="text-slate-500">Plan </span>
                <span className="font-bold text-slate-900">{formatCurrency(stepPlanRupees)}</span>
              </span>
              <span>
                <span className="text-slate-500">In quotation </span>
                <span className="font-bold text-slate-900">{formatCurrency(quotationTotalThisStep)}</span>
              </span>
              <span>
                <span className="text-slate-500">Remaining </span>
                <span className="font-bold text-[#ff4f86]">{formatCurrency(stepRemainingRupees)}</span>
              </span>
            </div>
          ) : (
            <p className="mt-1 leading-relaxed">
              <span className="font-semibold text-slate-900">{formatCurrency(quotationTotalThisStep)}</span>
              <span className="text-slate-600"> in your quotation basket for this step.</span>
              <span className="mt-1 block text-xs text-slate-500">
                Set a step budget (tap budget above) or save allocations in your profile to track what’s left.
              </span>
            </p>
          )}
        </div>
      </div>

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

      <div className="mt-10 flex w-full max-w-[1600px] mx-auto items-start gap-4 md:gap-6">
        {/* Left Phase Control — top-aligned so row height follows content only */}
        <a
          href={activeIndex > 0 ? `/journey/${steps[activeIndex - 1].slug}` : "#"}
          className={`group sticky top-24 z-10 mt-1 hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-xl ring-1 ring-slate-100 transition-all hover:bg-[#fff1f6] hover:shadow-2xl active:scale-90 md:flex ${
            activeIndex === 0 ? "pointer-events-none opacity-10" : "cursor-pointer"
          }`}
          aria-label="Previous Phase"
        >
          <ChevronLeft className="h-6 w-6 text-[#ff4f86] transition-colors group-hover:text-[#ff3d79]" />
        </a>

        <div className="min-w-0 flex-1">
          {hasVisibleItems ? (
            <div className="grid gap-6 sm:grid-cols-2 sm:gap-8 xl:grid-cols-4 pb-20">
              {visibleItems.map((item, index) => {
                const image = item.images?.[0] || fallbackImages[index % fallbackImages.length];
                const subForItem = item.subcategory_id
                  ? categories.find((c) => c.category_id === item.subcategory_id)
                  : null;
                const label = subForItem?.name || selectedCategory?.name || step.title;

                return (
                  <article key={item.item_id} className="group flex h-full min-w-0 flex-col">
                    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-[0_16px_40px_rgba(255,79,134,0.2)]">
                      <div className="relative aspect-4/3 w-full shrink-0 overflow-hidden rounded-[24px] bg-linear-to-br from-slate-100 to-slate-50">
                        <div
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                          style={{ backgroundImage: safeCssUrl(image) }}
                          aria-label={item.name}
                          role="img"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        <span className="absolute bottom-3 left-3 rounded-full bg-[#ffbb28]/95 px-3 py-1.5 text-xs font-bold text-slate-800 backdrop-blur-sm">
                          {label}
                        </span>
                        <button
                          type="button"
                          className="absolute top-3 right-3 rounded-full bg-white/90 p-2 text-slate-400 backdrop-blur-sm transition-all duration-300 hover:bg-[#fff1f6] hover:text-[#ff4f86] opacity-0 group-hover:opacity-100"
                          aria-label="Add to wishlist"
                        >
                          <Heart className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-4 flex min-h-0 flex-1 flex-col space-y-3 px-1 pb-1">
                        <div className="flex items-center justify-between">
                          <StarRating value={item.is_discount_active ? 5 : 4} />
                          {item.is_discount_active && (
                            <span className="rounded-full bg-[#fff1f6] px-2.5 py-1 text-xs font-bold text-[#ff4f86]">
                              {item.discount_percentage}% OFF
                            </span>
                          )}
                        </div>
                        
                        <div className="min-w-0 space-y-2">
                          <h3 className="text-lg font-bold leading-snug text-slate-700 line-clamp-2 sm:text-xl">
                            {item.name}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">
                              {[item.location_city, item.location_state].filter(Boolean).join(", ") ||
                                item.location ||
                                "Available for service"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-auto space-y-3">
                          <div className="flex items-end justify-between">
                            <div>
                              <div className="text-[9px] font-bold uppercase tracking-[0.25em] text-slate-400">Starting from</div>
                              <div className="text-xl font-black text-[#ff4f86]">
                                {formatCurrency(item.final_price || item.price)}
                              </div>
                            </div>
                          </div>
                          
                          {(() => {
                            const inCart = cartState.quotation.find((c) => c.item_id === item.item_id);
                            if (inCart) {
                              return (
                                <div className="flex h-[46px] items-center justify-between gap-2 overflow-hidden rounded-2xl bg-linear-to-r from-[#ff4f86] to-[#ff6ba8] p-1 shadow-[0_8px_20px_rgba(255,79,134,0.3)] transition-all duration-300">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (inCart.quantity > 1) {
                                        updateCartQuantity("quotation", item.item_id, inCart.quantity - 1);
                                      } else {
                                        removeFromCart("quotation", item.item_id);
                                        toast.error("Removed from basket");
                                      }
                                    }}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white transition-all hover:bg-white/30 active:scale-90"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </button>
                                  <span className="min-w-6 text-center text-base font-black text-white">
                                    {inCart.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      updateCartQuantity("quotation", item.item_id, inCart.quantity + 1);
                                    }}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white transition-all hover:bg-white/30 active:scale-90"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                </div>
                              );
                            }
                            return (
                              <button
                                type="button"
                                onClick={() => {
                                  addToCart('quotation', {
                                    ...item,
                                    image,
                                    category_label: selectedCategory?.name || step.title,
                                    subcategory_label: subForItem?.name || "",
                                    journey_title: step.title,
                                    journey_step_id: step.step_id,
                                    source: "journey",
                                  }, 1);
                                  toast.success("Added to basket! 🎉");
                                }}
                                className="group/btn relative w-full overflow-hidden rounded-2xl bg-linear-to-r from-[#ff4f86] to-[#ff6ba8] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(255,79,134,0.3)] transition-all duration-300 hover:shadow-[0_12px_28px_rgba(255,79,134,0.45)] active:scale-[0.98]"
                              >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                  <Plus className="h-4 w-4" />
                                  Add to Basket
                                </span>
                                <div className="absolute inset-0 bg-linear-to-r from-[#ff6ba8] to-[#ff4f86] opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100" />
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[28px] border border-slate-100 bg-white px-6 py-40 text-center shadow-[0_28px_60px_rgba(15,23,42,0.06)]">
              <p className="text-base font-semibold text-slate-700">
                {productPriceCap != null
                  ? "No items within this product budget"
                  : search
                    ? "No items match your search"
                    : selectedCategoryId
                      ? "No items in this category yet"
                      : "No items in this step yet"}
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
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
                  className="mt-6 rounded-xl bg-[#ff4f86] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#ff3d79]"
                >
                  Match step budget again
                </button>
              ) : null}
            </div>
          )}
        </div>

        <a
          href={activeIndex < steps.length - 1 ? `/journey/${steps[activeIndex + 1].slug}` : "#"}
          className={`group sticky top-24 z-10 mt-1 hidden h-12 w-12 shrink-0 bg-[#ff4f86] items-center justify-center rounded-xl ring-1 ring-slate-100 transition-all hover:bg-[#ff1f86] hover:shadow-2xl active:scale-90 md:flex ${
            activeIndex === steps.length - 1 ? "pointer-events-none opacity-10" : "cursor-pointer"
          }`}
          aria-label="Next Phase"
        >
          <ChevronRight className="h-6 w-6 text-white transition-colors" />        </a>
      </div>

      <div>
        <BasketButton floating />
      </div>
    </div>
  );
}
