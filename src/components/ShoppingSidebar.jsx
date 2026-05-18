"use client";

/**
 * ShoppingSidebar — left-rail filters on the /shopping catalog.
 *
 * Reads facets (subcategories within the selected top category, fabric set
 * derived from `item.attributes.fabric`, min/max price across the result
 * set) and renders them as real, working URL-driven filters. Updates push
 * to the router via `router.push`, which re-runs the server component and
 * re-renders the grid with the filtered items.
 *
 * Why a client component? The price filter needs a "type, then Apply"
 * interaction that doesn't fit a pure `<Link>`. Subcategory selection
 * still works as a link (so users can shift+click in a new tab) but is
 * wrapped in a button-ish label for visual consistency.
 */

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

function fabricsFromItems(items) {
  const set = new Set();
  for (const item of items || []) {
    const f = item?.attributes?.fabric || item?.attributes?.material;
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
  selectedSubcategoryId = "",
  search = "",
  selectedFabrics = [],
  minPrice = null,
  maxPrice = null,
}) {
  const router = useRouter();
  const pathname = usePathname();

  const fabricFacets = useMemo(() => fabricsFromItems(items), [items]);
  const bounds = useMemo(() => priceBoundsFromItems(items), [items]);

  // Track price inputs in local state so the user can type freely before
  // hitting Apply. We seed from URL params and re-sync if those change.
  const [minDraft, setMinDraft] = useState(minPrice ?? "");
  const [maxDraft, setMaxDraft] = useState(maxPrice ?? "");
  useEffect(() => {
    setMinDraft(minPrice ?? "");
    setMaxDraft(maxPrice ?? "");
  }, [minPrice, maxPrice]);

  const currentParams = {
    category: selectedCategoryId,
    subcategory: selectedSubcategoryId,
    search,
    fabric: selectedFabrics,
    minPrice: minPrice ?? "",
    maxPrice: maxPrice ?? "",
  };

  function toggleFabric(fabric) {
    const next = selectedFabrics.includes(fabric)
      ? selectedFabrics.filter((f) => f !== fabric)
      : [...selectedFabrics, fabric];
    router.push(buildHref(pathname, currentParams, { fabric: next }));
  }

  function applyPrice() {
    const minN = minDraft === "" ? "" : Number(minDraft);
    const maxN = maxDraft === "" ? "" : Number(maxDraft);
    router.push(
      buildHref(pathname, currentParams, {
        minPrice: Number.isFinite(minN) && minN > 0 ? minN : "",
        maxPrice: Number.isFinite(maxN) && maxN > 0 ? maxN : "",
      }),
    );
  }

  function clearAll() {
    router.push(
      buildHref(pathname, {}, {
        category: selectedCategoryId,
        subcategory: selectedSubcategoryId,
        search,
      }),
    );
  }

  const hasAnyFilter =
    selectedFabrics.length > 0 || minPrice != null || maxPrice != null;

  return (
    <aside className="h-fit rounded-[22px] bg-primary-soft p-5">
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

      <div className="mt-4 space-y-4">
        {filterSubcategories.length > 0 ? (
          <>
            <div>
              <p className="text-sm font-medium text-secondary">Subcategory</p>
              <div className="mt-2 space-y-2">
                {filterSubcategories.map((sub) => {
                  const active = selectedSubcategoryId === sub.category_id;
                  return (
                    <label
                      key={sub.category_id}
                      className="flex items-center gap-2 text-sm text-secondary"
                    >
                      <input
                        type="checkbox"
                        checked={active}
                        readOnly
                        className="h-3.5 w-3.5 rounded border border-primary-accent accent-primary"
                      />
                      <Link
                        href={buildHref(pathname, currentParams, {
                          subcategory: active ? "" : sub.category_id,
                        })}
                        className={active ? "font-semibold text-secondary" : ""}
                      >
                        {sub.name}
                      </Link>
                    </label>
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
              <div className="mt-2 space-y-2 text-sm text-secondary">
                {fabricFacets.map((fabric) => {
                  const active = selectedFabrics.includes(fabric);
                  return (
                    <label
                      key={fabric}
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => toggleFabric(fabric)}
                        className="h-3.5 w-3.5 rounded border border-primary-accent accent-primary"
                      />
                      {fabric}
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="h-px w-full bg-primary-accent" />
          </>
        ) : null}

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
    </aside>
  );
}
