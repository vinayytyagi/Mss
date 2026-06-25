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
 *  - Subcategory (single-select, navigates via router.push)
 *  - Fabric (multi-select, toggles via router.push)
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

function fabricsFromItems(items) {
  const set = new Set();
  for (const item of items || []) {
    const f =
      item?.attributes?.fabric_material || item?.attributes?.fabric || item?.attributes?.material;
    if (typeof f === "string" && f.trim()) {
      set.add(f.trim());
    } else if (Array.isArray(f)) {
      f.forEach((v) => {
        if (typeof v === "string" && v.trim()) set.add(v.trim());
      });
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

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
  filterSubcategories = [],
  selectedCategoryId = "",
  selectedSubcategoryIds = [],
  search = "",
  selectedFabrics = [],
  minPrice = null,
  maxPrice = null,
  attributeFacets = [],
  selectedAttributes = {},
}) {
  const router = useRouter();
  const pathname = usePathname();

  const fabricFacets = useMemo(() => fabricsFromItems(items), [items]);
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

  const currentParams = {
    category: selectedCategoryId,
    // Multi-select sub: stored as a comma list in the URL.
    subcategory: selectedSubcategoryIds.length > 0 ? selectedSubcategoryIds.join(",") : "",
    search,
    fabric: selectedFabrics,
    minPrice: minPrice ?? "",
    maxPrice: maxPrice ?? "",
    // Schema-driven attribute filters — one `attr_<key>` param per facet so
    // they survive navigation through the other facets.
    ...Object.fromEntries(
      Object.entries(selectedAttributes || {}).map(([k, v]) => [`attr_${k}`, v]),
    ),
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

  function toggleFabric(fabric) {
    const next = selectedFabrics.includes(fabric)
      ? selectedFabrics.filter((f) => f !== fabric)
      : [...selectedFabrics, fabric];
    navigateTo({ fabric: next });
  }

  function toggleAttribute(key, value) {
    const cur = Array.isArray(selectedAttributes[key]) ? selectedAttributes[key] : [];
    const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
    navigateTo({ [`attr_${key}`]: next });
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

  const activeCount =
    (selectedFabrics?.length || 0) +
    (minPrice != null ? 1 : 0) +
    (maxPrice != null ? 1 : 0) +
    selectedSubcategoryIds.length +
    Object.values(selectedAttributes || {}).reduce(
      (n, arr) => n + (Array.isArray(arr) ? arr.length : 0),
      0,
    );
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

      {fabricFacets.length > 0 ? (
        <>
          <div>
            <p className="text-sm font-medium text-secondary">Fabric</p>
            <div className="mt-2 space-y-1 text-sm text-secondary">
              {fabricFacets.map((fabric) => {
                const active = selectedFabrics.includes(fabric);
                return (
                  <button
                    type="button"
                    key={fabric}
                    onClick={() => toggleFabric(fabric)}
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
                    {fabric}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="h-px w-full bg-primary-accent" />
        </>
      ) : null}

      {/* Schema-driven attribute facets (admin owns these via the item form's
          "In filter bar" toggle). Multi-select, URL-driven (?attr_<key>=). */}
      {attributeFacets.map((facet) => {
        const selected = Array.isArray(selectedAttributes[facet.key])
          ? selectedAttributes[facet.key]
          : [];
        return (
          <div key={facet.key}>
            <p className="text-sm font-medium text-secondary">{facet.label}</p>
            <div className="mt-2 space-y-1 text-sm text-secondary">
              {facet.options.map((opt) => {
                const active = selected.includes(opt);
                return (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => toggleAttribute(facet.key, opt)}
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
                    {opt}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 h-px w-full bg-primary-accent" />
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
      {/* Desktop inline sidebar — visible at lg+ */}
      <aside className="hidden h-fit rounded-[22px] bg-primary-soft p-5 lg:block">
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
            <div className="flex-1 overflow-y-auto px-5 py-4">{content}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
