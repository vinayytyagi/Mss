"use client";

import BudgetBadge from "@/components/BudgetBadge";
import BasketButton from "@/components/BasketButton";
import CartActionButtons from "@/components/CartActionButtons";
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
} from "lucide-react";
import { useAuthUser } from "@/lib/authCookies";
import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function categoryUrlSegment(c) {
  if (!c) return "";
  const s = String(c.slug || "").trim();
  return s || c.category_id || "";
}

function buildJourneyHref(
  slug,
  { categorySlug, subcategorySlug, search: searchTerm, budget, capOff } = {},
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
  const q = qs.toString();
  return `/journey/${slug}${q ? `?${q}` : ""}`;
}

function formatInrBudget(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function StarRating({ value = 4 }) {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2, 3, 4].map((index) => (
        <span
          key={index}
          className={`h-2.5 w-2.5 rounded-full ${index < value ? "bg-[#ffbb28]" : "bg-slate-200"}`}
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
                  {planPreview.delta > 0 ? "↑" : "↓"} {formatCurrency(Math.abs(planPreview.delta))} from your saved plan
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
}) {
  const router = useRouter();
  const authUser = useAuthUser();
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
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
    const lock = isBudgetModalOpen || categoryMenuOpen || subcategoryMenuOpen;
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
  }, [isBudgetModalOpen, categoryMenuOpen, subcategoryMenuOpen]);

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

  const visibleItems = items;
  const hasVisibleItems = visibleItems.length > 0;
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

      <div className="mt-10 flex w-full max-w-[1600px] mx-auto items-start gap-4 md:gap-6">
        {/* Left Phase Control — top-aligned so row height follows content only */}
        <a
          href={activeIndex > 0 ? `/journey/${steps[activeIndex - 1].slug}` : "#"}
          className={`sticky top-24 z-10 mt-1 hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-xl ring-1 ring-slate-100 transition-all hover:bg-slate-50 hover:shadow-2xl active:scale-90 md:flex ${
            activeIndex === 0 ? "pointer-events-none opacity-10" : "cursor-pointer"
          }`}
          aria-label="Previous Phase"
        >
          <ChevronLeft className="h-6 w-6 text-slate-500" />
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
                    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] bg-white p-3 shadow-[0_0px_5px_5px_rgba(15,23,42,0.08)] transition duration-300 group-hover:-translate-y-1">
                      <div className="relative aspect-4/3 w-full shrink-0 overflow-hidden rounded-[24px] bg-slate-100">
                        <div
                          className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                          style={{ backgroundImage: image ? `url("${image}")` : "none" }}
                          aria-label={item.name}
                          role="img"
                        />
                        <span className="absolute bottom-3 left-3 rounded-full bg-[#ffbb28] px-3 py-1 text-xs font-semibold text-slate-700">
                          {label}
                        </span>
                      </div>

                      <div className="mt-4 flex min-h-0 flex-1 flex-col space-y-3 px-1 pb-1">
                        <StarRating value={item.is_discount_active ? 4 : 3} />
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-lg font-bold leading-snug text-slate-700 sm:text-xl">{item.name}</h3>
                            <div className="shrink-0">
                              <CartActionButtons
                                item={{
                                  ...item,
                                  image,
                                  category_label: selectedCategory?.name || step.title,
                                  subcategory_label: subForItem?.name || "",
                                  journey_title: step.title,
                                  source: "journey",
                                }}
                                quotationLabel="Select"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{item.location_city || "Bekasi, Jawa Barat"}</span>
                          </div>
                        </div>

                        <div className="mt-auto flex items-end justify-between gap-3 pt-1">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Starting from</div>
                            <div className="text-lg font-black text-slate-700">
                              {formatCurrency(item.final_price || item.price)}
                            </div>
                          </div>
                          {item.is_discount_active ? (
                            <span className="shrink-0 rounded-full bg-[#fff1f6] px-3 py-1 text-xs font-bold text-[#ff4f86]">
                              {item.discount_percentage}% off
                            </span>
                          ) : null}
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
                {appliedBudgetCap === 0
                  ? "No free listings here"
                  : appliedBudgetCap != null && appliedBudgetCap > 0
                    ? `Nothing here fits within ${formatInrBudget(appliedBudgetCap)}`
                    : search
                      ? "No items match your search"
                      : selectedCategoryId
                        ? "No items in this category yet"
                        : "No items in this step yet"}
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                {appliedBudgetCap === 0
                  ? "You’re viewing only items with a final price of ₹0. If nothing shows, nothing in this category is free right now — clear the cap or pick another category."
                  : appliedBudgetCap != null && appliedBudgetCap > 0
                    ? "Prices use the current offer (discount) shown on each card. Try raising the budget filter or pick another category."
                    : search
                      ? "Try different keywords or clear search to see everything in this category."
                      : "Check back soon—new options for this journey step will show up here once they are added."}
              </p>
            </div>
          )}
        </div>

        <a
          href={activeIndex < steps.length - 1 ? `/journey/${steps[activeIndex + 1].slug}` : "#"}
          className={`sticky top-24 z-10 mt-1 hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-xl ring-1 ring-slate-100 transition-all hover:bg-slate-50 hover:shadow-2xl active:scale-90 md:flex ${
            activeIndex === steps.length - 1 ? "pointer-events-none opacity-10" : "cursor-pointer"
          }`}
          aria-label="Next Phase"
        >
          <ChevronRight className="h-6 w-6 text-slate-500" />
        </a>
      </div>

      <div>
        <BasketButton floating />
      </div>
    </div>
  );
}
