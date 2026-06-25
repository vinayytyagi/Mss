"use client";

import { useMemo } from "react";
import Link from "next/link";
import { clearCart, removeFromCart, updateCartQuantity, useCartState } from "@/lib/cartStore";
import { formatCurrency } from "@/lib/shopUi";
import { safeCssUrl } from "@/lib/utils";
import { Minus, Plus, Trash2, ShoppingBag, Receipt, ArrowRight, PackageOpen } from "lucide-react";

/** Flatten a package line's selection blob into short summary chips. */
function summarizePackageSelection(selection) {
  const chips = [];
  const sections = Array.isArray(selection?.sections) ? selection.sections : [];
  for (const section of sections) {
    for (const opt of section.options || []) {
      const subs = (opt.sub_items || []).map((s) => s.label).filter(Boolean);
      chips.push(subs.length ? `${opt.label} (${subs.join(", ")})` : opt.label);
    }
    if (section.quantity > 0) chips.push(`Qty ${section.quantity}`);
  }
  const details = selection?.details || {};
  for (const value of Object.values(details)) {
    const v = String(value || "").trim();
    if (v) chips.push(v);
  }
  return chips.filter(Boolean);
}

function PackageRow({ item, onRemove }) {
  const indicative = Number(item.indicative_total ?? item.final_price ?? item.price) || 0;
  const chips = summarizePackageSelection(item.selection);

  return (
    <div className="flex gap-4 py-5 first:pt-0 last:pb-0">
      {/* Package icon thumbnail */}
      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary-soft sm:h-28 sm:w-28">
        <PackageOpen className="h-9 w-9 text-primary" strokeWidth={1.5} />
      </div>

      {/* Details */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-text-strong sm:text-lg">{item.name}</h3>
            <p className="mt-0.5 truncate text-xs text-muted sm:text-sm">
              {item.journey_title || item.category_label || "Custom package"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center rounded-md bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">
                Package
              </span>
            </div>
          </div>

          {/* Price block */}
          <div className="shrink-0 text-right">
            {indicative > 0 ? (
              <>
                <div className="text-sm font-semibold text-text-strong sm:text-base">
                  {formatCurrency(indicative)}
                </div>
                <div className="mt-0.5 text-[11px] text-subtle">indicative</div>
              </>
            ) : (
              <>
                <div className="text-sm font-bold text-primary sm:text-base">Custom quote</div>
                <div className="mt-0.5 text-[11px] text-subtle">tailored to you</div>
              </>
            )}
          </div>
        </div>

        {/* Selection summary chips */}
        {chips.length ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {chips.slice(0, 8).map((chip, i) => (
              <span
                key={`${chip}-${i}`}
                className="inline-flex items-center rounded-md bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-muted"
              >
                {chip}
              </span>
            ))}
          </div>
        ) : null}

        {/* Footer: remove */}
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <button
            type="button"
            onClick={() => onRemove(item.item_id, "")}
            className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-muted transition hover:bg-danger/10 hover:text-danger"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Remove</span>
          </button>
          <span className="rounded-lg bg-surface-muted px-2.5 py-1 text-[11px] font-semibold text-muted">
            Qty 1
          </span>
        </div>
      </div>
    </div>
  );
}

function CartRow({ item, cartType, onRemove, onQuantityChange }) {
  const qty = Number(item.quantity) || 0;
  const unit = Number(item.final_price) || Number(item.price) || 0;
  const original = Number(item.price) || 0;
  const hasDiscount = item.is_discount_active && original > unit;
  const lineTotal = qty * unit;
  const savings = hasDiscount ? (original - unit) * qty : 0;

  const variantText =
    item.variant_label ||
    [
      item.variant_size ? `Size: ${item.variant_size}` : null,
      item.variant_color ? `Color: ${item.variant_color}` : null,
      item.variant_material ? `Material: ${item.variant_material}` : null,
    ]
      .filter(Boolean)
      .join(" • ");

  return (
    <div className="flex gap-4 py-5 first:pt-0 last:pb-0">
      {/* Thumbnail */}
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-primary-soft sm:h-28 sm:w-28">
        <div
          className="h-full w-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: safeCssUrl(item.image || item.images?.[0] || "") }}
        />
      </div>

      {/* Details */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-text-strong sm:text-lg">{item.name}</h3>
            <p className="mt-0.5 truncate text-xs text-muted sm:text-sm">
              {item.subcategory_label || item.category_label || item.journey_title || item.item_type}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {variantText ? (
                <span className="inline-flex items-center rounded-md bg-surface-muted px-2 py-0.5 text-[11px] font-semibold text-muted">
                  {variantText}
                </span>
              ) : null}
              {item.journey_title ? (
                <span className="inline-flex items-center rounded-md bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">
                  {item.journey_title}
                </span>
              ) : null}
            </div>
          </div>

          {/* Price block */}
          <div className="shrink-0 text-right">
            <div className="text-sm font-semibold text-text-strong sm:text-base">{formatCurrency(unit)}</div>
            {hasDiscount ? (
              <div className="mt-0.5 flex items-center justify-end gap-1.5">
                <span className="text-xs text-subtle line-through">{formatCurrency(original)}</span>
                <span className="text-[11px] font-bold text-success">
                  {Number(item.discount_percentage) || Math.round(((original - unit) / original) * 100)}% off
                </span>
              </div>
            ) : (
              <div className="mt-0.5 text-[11px] text-subtle">per item</div>
            )}
          </div>
        </div>

        {/* Footer: qty + actions + line total */}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center overflow-hidden rounded-xl border border-border-strong">
              <button
                type="button"
                onClick={() => onQuantityChange(item.item_id, Math.max(1, qty - 1), item.variant_id || "")}
                disabled={qty <= 1}
                className="px-2.5 py-2 text-muted transition hover:bg-surface-muted hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Decrease quantity"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <div className="min-w-10 px-2 text-center text-sm font-bold text-text">{qty}</div>
              <button
                type="button"
                onClick={() => onQuantityChange(item.item_id, qty + 1, item.variant_id || "")}
                className="px-2.5 py-2 text-muted transition hover:bg-surface-muted hover:text-text"
                aria-label="Increase quantity"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => onRemove(item.item_id, item.variant_id || "")}
              className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-muted transition hover:bg-danger/10 hover:text-danger"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Remove</span>
            </button>
          </div>

          {cartType === "shopping" ? (
            <div className="text-right">
              <div className="text-sm font-bold text-text-strong">{formatCurrency(lineTotal)}</div>
              {savings > 0 ? (
                <div className="text-[11px] font-semibold text-success">You save {formatCurrency(savings)}</div>
              ) : null}
            </div>
          ) : (
            <span className="rounded-lg bg-surface-muted px-2.5 py-1 text-[11px] font-semibold text-muted">
              Qty {qty}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ cartType }) {
  const isQuote = cartType === "quotation";
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-lg ${
          isQuote ? "bg-[#d4720a]/10 text-[#d4720a]" : "bg-primary-soft text-primary"
        }`}
      >
        {isQuote ? <Receipt className="h-7 w-7" /> : <ShoppingBag className="h-7 w-7" />}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-text-strong">
        {isQuote ? "Your Quote cart is empty" : "Your Shop cart is empty"}
      </h3>
      <p className="mt-1.5 max-w-xs text-sm text-muted">
        {isQuote
          ? "Add wedding-journey items you'd like a tailored quote for and send them across in one go."
          : "Browse our shopping collection and add products you want to buy right away."}
      </p>
      <Link
        href={isQuote ? "/" : "/shopping"}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(255,79,134,0.2)] transition hover:bg-primary-hover"
      >
        {isQuote ? "Explore wedding journey" : "Start shopping"}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export default function CartItemsClient({ activeCart = "shopping" }) {
  const carts = useCartState();
  const items = activeCart === "quotation" ? carts.quotation : carts.shopping;

  const totalUnits = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    [items],
  );

  const isQuote = activeCart === "quotation";

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      {/* Panel header */}
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-base font-semibold text-text-strong sm:text-lg">
            {isQuote ? "Quote Cart" : "Shop Cart"}
          </h2>
          <p className="mt-0.5 text-xs text-muted sm:text-sm">
            {items.length > 0
              ? `${totalUnits} item${totalUnits === 1 ? "" : "s"} ${isQuote ? "ready to quote" : "in your cart"}`
              : "Nothing added yet"}
          </p>
        </div>
        {items.length > 0 ? (
          <button
            type="button"
            onClick={() => clearCart(activeCart)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border-strong bg-surface px-3.5 py-2 text-xs font-semibold text-muted transition hover:border-danger/40 hover:bg-danger/10 hover:text-danger"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear all
          </button>
        ) : null}
      </div>

      {/* Items / empty */}
      {items.length > 0 ? (
        <div className="divide-y divide-border px-5 sm:px-6 py-4">
          {items.map((item) =>
            item.line_type === "package" ? (
              <PackageRow
                key={`${activeCart}-${item.item_id}`}
                item={item}
                onRemove={(itemId, variantId) => removeFromCart(activeCart, itemId, variantId)}
              />
            ) : (
              <CartRow
                key={`${activeCart}-${item.item_id}-${item.variant_id || "base"}`}
                item={item}
                cartType={activeCart}
                onRemove={(itemId, variantId) => removeFromCart(activeCart, itemId, variantId)}
                onQuantityChange={(itemId, quantity, variantId) =>
                  updateCartQuantity(activeCart, itemId, quantity, variantId)
                }
              />
            ),
          )}
        </div>
      ) : (
        <EmptyState cartType={activeCart} />
      )}
    </div>
  );
}
