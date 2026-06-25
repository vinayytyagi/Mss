"use client";

/**
 * ShoppingSidebar — facet filters for the /shopping catalog.
 *
 * Two presentations from the same component:
 *  - lg+   : inline sidebar that sits beside the items grid.
 *  - < lg  : floating "Filters" pill at the bottom-right of the viewport
 *            that opens an off-canvas drawer with the same content.
 *
 * Facets:
 *  - Shop for (single-select audience)
 *  - Subcategory (multi-select, toggles via router.push)
 *  - Attribute facets (Fabric, Occasion, Work, … — driven by SHOPPING_FACETS;
 *    each renders only when the current items have ≥2 distinct values for it,
 *    so every category shows just its relevant filters)
 *  - Price (min/max with Apply)
 *
 * Selection state lives entirely in the URL so the server component
 * re-runs and re-renders the grid with the filtered items — no client
 * state for "what's selected", only for the price draft and the
 * mobile drawer open/closed.
 */

import { useMemo, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { facetValuesFromItems } from "@/lib/shopUi";

function priceBoundsFromItems(items) {
  const prices = (items || [])
    .map((it) => Number(it?.final_price ?? it?.price ?? 0))
    .filter((p) => Number.isFinite(p) && p > 0);
  if (!prices.length) return { min: 0, max: 0 };
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

function buildHref(pathname, current, patch) {
  const qs = new URLSearchParams();
  const merged = { ...current, ...patch };
  Object.entries(merged).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    if (Array.isArray(value)) {
      if (value.length > 0) qs.set(key, value.join(","));
    } else {
      qs.set(key, String(value));
    }
  });
  const q = qs.toString();
  return q ? `${pathname}?${q}` : pathname;
}

export default function ShoppingSidebar({
  items = [],
  facets = [],
  filterSubcategories = [],
  selectedCategoryId = "",
  selectedSubcategoryIds = [],
  search = "",
  selectedAttributes = {},
  selectedAudience = "",
  minPrice = null,
  maxPrice = null,
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Attribute-driven facet sections — fully schema-driven. The facet list,
  // order, labels and options all come from the admin Journey-Options schema
  // (passed in as `facets`). Options = the admin list (in admin order) + any
  // extra values items carry. A facet appears once ≥1 item in scope uses it, so
  // facets stay relevant per category (jewellery shows Purity/Stone, not Fabric)
  // and a NEW filter shows as soon as a listing uses it.
  const facetSections = useMemo(
    () =>
      (facets || [])
        .map((facet) => {
          const itemValues = facetValuesFromItems(items, facet.key);
          const adminOpts = Array.isArray(facet.options) ? facet.options : [];
          const seen = new Set(adminOpts.map((v) => String(v).toLowerCase()));
          const values = [...adminOpts];
          for (const v of itemValues) {
            if (!seen.has(String(v).toLowerCase())) values.push(v);
          }
          return { ...facet, values, itemCount: itemValues.length };
        })
        .filter((facet) => facet.itemCount >= 1 && facet.values.length >= 2),
    [items, facets],
  );
  const bounds = useMemo(() => priceBoundsFromItems(items), [items]);

  // Price inputs are a draft so the user can type freely before Apply.
  const [minDraft, setMinDraft] = useState(minPrice ?? "");
  const [maxDraft, setMaxDraft] = useState(maxPrice ?? "");
  useEffect(() => {
    setMinDraft(minPrice ?? "");
    setMaxDraft(maxPrice ?? "");
  }, [minPrice, maxPrice]);

  // Mobile drawer state. Close on Escape.
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  // Currently-selected values per facet key, read straight off the URL-driven
  // `selectedAttributes` map so toggles preserve the other facets.
  const selectedByKey = useMemo(() => {
    const map = {};
    for (const facet of facets || []) {
      const v = selectedAttributes?.[facet.key];
      map[facet.key] = Array.isArray(v) ? v : [];
    }
    return map;
  }, [selectedAttributes, facets]);

  const currentParams = {
    category: selectedCategoryId,
    // Multi-select sub: stored as a comma list in the URL.
    subcategory: selectedSubcategoryIds.length > 0 ? selectedSubcategoryIds.join(",") : "",
    search,
    audience: selectedAudience,
    minPrice: minPrice ?? "",
    maxPrice: maxPrice ?? "",
    // One comma-list param per facet key. We always emit the legacy `fabric`
    // alias as "" so a stale `?fabric=` from an old link is cleared once the
    // user touches the canonical `fabric_material` facet.
    fabric: "",
    ...Object.fromEntries((facets || []).map((facet) => [facet.key, selectedByKey[facet.key]])),
  };

  function navigateTo(patch) {
    router.push(buildHref(pathname, currentParams, patch));
    setMobileOpen(false);
  }

  function toggleSubcategory(catId) {
    const next = selectedSubcategoryIds.includes(catId)
      ? selectedSubcategoryIds.filter((id) => id !== catId)
      : [...selectedSubcategoryIds, catId];
    navigateTo({ subcategory: next.length > 0 ? next.join(",") : "" });
  }

  function toggleAudience(value) {
    navigateTo({ audience: selectedAudience === value ? "" : value });
  }

  function toggleFacet(key, value) {
    const current = selectedByKey[key] || [];
    const next = current.some((v) => v.toLowerCase() === value.toLowerCase())
      ? current.filter((v) => v.toLowerCase() !== value.toLowerCase())
      : [...current, value];
    navigateTo({ [key]: next });
  }

  function applyPrice() {
    const minN = minDraft === "" ? "" : Number(minDraft);
    const maxN = maxDraft === "" ? "" : Number(maxDraft);
    navigateTo({
      minPrice: Number.isFinite(minN) && minN > 0 ? minN : "",
      maxPrice: Number.isFinite(maxN) && maxN > 0 ? maxN : "",
    });
  }

  function clearAll() {
    // Clear all facets; keep only the top-category and search context.
    router.push(
      buildHref(
        pathname,
        {},
        {
          category: selectedCategoryId,
          search,
        },
      ),
    );
    setMobileOpen(false);
  }

  const selectedFacetCount = (facets || []).reduce(
    (sum, facet) => sum + (selectedByKey[facet.key]?.length || 0),
    0,
  );
  const activeCount =
    selectedFacetCount +
    (selectedAudience ? 1 : 0) +
    (minPrice != null ? 1 : 0) +
    (maxPrice != null ? 1 : 0) +
    selectedSubcategoryIds.length;
  const hasAnyFilter = activeCount > 0;

  const content = (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-medium text-secondary">Filters</h3>
        {hasAnyFilter ? (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-semibold text-secondary underline-offset-2 hover:underline"
          >
            Clear all
          </button>
        ) : null}
      </div>

      {/* Shop for — gender / audience facet (single-select) */}
      <div>
        <p className="text-sm font-medium text-secondary">Shop for</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {[
            { label: "Women", value: "bride" },
            { label: "Men", value: "groom" },
          ].map((opt) => {
            const active = selectedAudience === opt.value;
            return (
              <button
                type="button"
                key={opt.value}
                onClick={() => toggleAudience(opt.value)}
                aria-pressed={active}
                className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-primary-accent bg-surface text-secondary hover:bg-primary-soft/50"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="h-px w-full bg-primary-accent" />

      {filterSubcategories.length > 0 ? (
        <>
          <div>
            <p className="text-sm font-medium text-secondary">Subcategory</p>
            <p className="mt-0.5 text-[11px] text-secondary/70">Tick any combination.</p>
            <div className="mt-2 space-y-1">
              {filterSubcategories.map((sub) => {
                const active = selectedSubcategoryIds.includes(sub.category_id);
                return (
                  <button
                    type="button"
                    key={sub.category_id}
                    onClick={() => toggleSubcategory(sub.category_id)}
                    className={`flex w-full items-center gap-2 rounded px-1 py-1 text-left text-sm transition hover:bg-primary-soft/50 ${
                      active ? "font-semibold text-secondary" : "text-secondary"
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-primary-accent bg-surface"
                      }`}
                      aria-hidden
                    >
                      {active ? (
                        <svg
                          viewBox="0 0 16 16"
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 8.5l3 3 7-7" />
                        </svg>
                      ) : null}
                    </span>
                    {sub.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="h-px w-full bg-primary-accent" />
        </>
      ) : null}

      {/* Attribute-driven facets — only the ones with ≥2 distinct values in
          the current items render, so each category shows just its relevant
          filters (Clothing → Fabric/Occasion/Work; Jewellery → Purity/Stone). */}
      {facetSections.map((facet) => {
        const selected = selectedByKey[facet.key] || [];
        const selectedLower = new Set(selected.map((v) => v.toLowerCase()));
        return (
          <div key={facet.key} className="contents">
            <div>
              <p className="text-sm font-medium text-secondary">{facet.label}</p>
              <div className="mt-2 space-y-1 text-sm text-secondary">
                {facet.values.map((value) => {
                  const active = selectedLower.has(value.toLowerCase());
                  return (
                    <button
                      type="button"
                      key={value}
                      onClick={() => toggleFacet(facet.key, value)}
                      className={`flex w-full items-center gap-2 rounded px-1 py-1 text-left transition hover:bg-primary-soft/50 ${
                        active ? "font-semibold" : ""
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-primary-accent bg-surface"
                        }`}
                        aria-hidden
                      >
                        {active ? (
                          <svg
                            viewBox="0 0 16 16"
                            className="h-3 w-3"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 8.5l3 3 7-7" />
                          </svg>
                        ) : null}
                      </span>
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="h-px w-full bg-primary-accent" />
          </div>
        );
      })}

      <div>
        <p className="text-sm font-medium text-secondary">Price</p>
        {bounds.max > 0 ? (
          <p className="mt-1 text-[11px] text-secondary/70">
            In stock: ₹{bounds.min.toLocaleString("en-IN")} – ₹
            {bounds.max.toLocaleString("en-IN")}
          </p>
        ) : null}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyPrice();
          }}
          className="mt-2"
        >
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={minDraft}
              onChange={(e) => setMinDraft(e.target.value)}
              className="h-9 w-full rounded border border-primary-accent bg-surface px-2 text-xs"
              placeholder={bounds.min ? String(bounds.min) : "Min"}
            />
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={maxDraft}
              onChange={(e) => setMaxDraft(e.target.value)}
              className="h-9 w-full rounded border border-primary-accent bg-surface px-2 text-xs"
              placeholder={bounds.max ? String(bounds.max) : "Max"}
            />
          </div>
          <button
            type="submit"
            className="mt-4 h-9 w-full rounded-full bg-primary text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
          >
            Apply price
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop inline sidebar — visible at lg+. Sticky: scrolls with the page
          until it reaches the top offset, then pins while the items column keeps
          scrolling. max-h + overflow so a tall filter list can scroll internally. */}
      <aside className="scrollbar-themed hidden h-fit rounded-[22px] bg-primary-soft p-5 lg:block lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto">
        {content}
      </aside>

      {/* Mobile floating trigger — visible < lg */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[0_12px_28px_rgba(15,23,42,0.18)] lg:hidden"
        aria-label="Open filters"
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden />
        Filters
        {activeCount > 0 ? (
          <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-surface px-1 text-[11px] font-bold text-primary">
            {activeCount}
          </span>
        ) : null}
      </button>

      {/* Mobile drawer — slides from the right */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-dvh w-[88%] max-w-90 flex-col bg-primary-soft shadow-[-24px_0_60px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between border-b border-primary-accent px-5 py-4">
              <h3 className="text-lg font-semibold text-secondary">Filters</h3>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-full p-1 text-secondary hover:bg-surface/60"
                aria-label="Close filters"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="scrollbar-themed flex-1 overflow-y-auto px-5 py-4">{content}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
