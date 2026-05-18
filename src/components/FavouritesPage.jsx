"use client";

/**
 * FavouritesPage — `/favourites` route landing.
 *
 * Reads the persistent wishlist via `useWishlistState()` and renders the
 * two buckets ("journey" + "shopping") as separate tabs. We pass the
 * matching `cartKind` down to ItemCardV2 so the heart on each card shows
 * as filled (and toggling it removes from the same bucket).
 *
 * Why reuse ItemCardV2? The product brief explicitly forbids a separate
 * "wishlist card" variant — every surface that shows an item shows the
 * same card so the catalog feels coherent.
 */

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Heart, Trash2 } from "lucide-react";
import ItemCardV2 from "@/components/ItemCardV2";
import {
  clearWishlist,
  useWishlistState,
} from "@/lib/wishlistStore";

const TABS = [
  {
    key: "journey",
    label: "Journey items",
    // ItemCardV2 wishlist-kind mapping uses cartKind "quotation" → "journey".
    cartKind: "quotation",
    emptyCtaHref: "/journey/venue",
    emptyCtaLabel: "Browse journey items",
  },
  {
    key: "shopping",
    label: "Shopping items",
    cartKind: "shopping",
    emptyCtaHref: "/shopping",
    emptyCtaLabel: "Browse shopping",
  },
];

export default function FavouritesPage() {
  const state = useWishlistState();
  const [activeKey, setActiveKey] = useState("journey");
  const [clearOpen, setClearOpen] = useState(false);

  const counts = useMemo(
    () => ({
      journey: state.journey.length,
      shopping: state.shopping.length,
      total: state.journey.length + state.shopping.length,
    }),
    [state],
  );

  const activeTab = TABS.find((t) => t.key === activeKey) || TABS[0];
  const activeItems = state[activeTab.key] || [];

  function handleClearTab() {
    if (activeItems.length === 0) return;
    setClearOpen(true);
  }

  function confirmClear() {
    clearWishlist(activeTab.key);
    setClearOpen(false);
  }

  return (
    <main className="mx-auto w-full px-4 pb-8 pt-5 sm:px-6 lg:px-8">
      {/* Header */}
      <section className="rounded-2xl border border-border bg-surface px-5 py-6 shadow-[0_4px_18px_rgba(15,23,42,0.04)] sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 text-[11px] font-semibold text-primary">
              <Heart className="h-3 w-3" fill="currentColor" strokeWidth={2} />
              Favourites
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-text-strong sm:text-3xl">
              Your favourites
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted sm:text-base">
              Items you&apos;ve saved from across your journey.
            </p>
          </div>

          {counts.total > 0 ? (
            <span className="inline-flex shrink-0 items-center self-start rounded-full bg-surface-muted px-3 py-1.5 text-xs font-semibold text-text">
              {counts.total} item{counts.total === 1 ? "" : "s"} saved
            </span>
          ) : null}
        </div>
      </section>

      {/* Tabs */}
      <div className="mt-6 border-b border-border">
        <div className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeKey === tab.key;
            const tabCount = counts[tab.key] || 0;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveKey(tab.key)}
                aria-pressed={isActive}
                className={[
                  "shrink-0 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-text",
                ].join(" ")}
              >
                {tab.label} ({tabCount})
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <section className="mt-6">
        {/* Tab action row */}
        {activeItems.length > 0 ? (
          <div className="mb-4 flex items-center justify-end">
            <button
              type="button"
              onClick={handleClearTab}
              className="rounded-md border border-border-strong bg-surface px-3 py-2 text-xs font-semibold text-text transition hover:border-danger hover:text-danger"
            >
              Clear all favourites in this tab
            </button>
          </div>
        ) : null}

        {activeItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center">
            <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Heart className="h-6 w-6" strokeWidth={2} />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-text-strong">
              No favourites yet
            </h2>
            <p className="mt-2 text-sm text-muted">
              Tap the heart on any item to save it here.
            </p>
            <Link
              href={activeTab.emptyCtaHref}
              className="mt-5 inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
            >
              {activeTab.emptyCtaLabel}
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {activeItems.map((item) => {
              const whiteLabelOn = !item.vendor_id;
              const vendorName = whiteLabelOn
                ? "MyShaadiStore"
                : item.vendor_business_name || "Vendor";
              return (
                <ItemCardV2
                  key={item.item_id}
                  item={item}
                  vendorName={vendorName}
                  whiteLabelOn={whiteLabelOn}
                  cartKind={activeTab.cartKind}
                  categoryLabel={item.subcategory_label || item.category_label}
                />
              );
            })}
          </div>
        )}
      </section>

      <ClearFavouritesDialog
        open={clearOpen}
        count={activeItems.length}
        bucketLabel={activeTab.label}
        onClose={() => setClearOpen(false)}
        onConfirm={confirmClear}
      />
    </main>
  );
}

function ClearFavouritesDialog({ open, count, bucketLabel, onClose, onConfirm }) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const itemLabel = count === 1 ? "item" : "items";
  const bucket = (bucketLabel || "").toLowerCase();

  return createPortal(
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-text-strong/40 px-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
            <Trash2 className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-text-strong">
              Clear all {bucket}?
            </h3>
            <p className="mt-1 text-sm leading-6 text-muted">
              This will remove{" "}
              <span className="font-semibold text-text">
                {count} {itemLabel}
              </span>{" "}
              from your {bucket}. You can save them again any time by tapping the
              heart on a product.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-md border border-border-strong bg-surface px-4 text-sm font-semibold text-text transition hover:bg-surface-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-10 items-center gap-1.5 rounded-md bg-danger px-4 text-sm font-semibold text-primary-foreground transition hover:bg-danger/90"
          >
            <Trash2 className="h-4 w-4" strokeWidth={2} />
            Clear {count} {itemLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
