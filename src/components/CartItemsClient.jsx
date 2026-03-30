"use client";

import { useMemo } from "react";
import { clearCart, removeFromCart, updateCartQuantity, useCartState } from "@/lib/cartStore";
import { formatCurrency } from "@/lib/shopUi";
import { Minus, Plus, Trash2 } from "lucide-react";

function CartRow({ item, cartType, onRemove, onQuantityChange }) {
  const lineTotal = (Number(item.quantity) || 0) * (Number(item.final_price) || Number(item.price) || 0);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_14px_32px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center">
      <div className="h-28 w-full shrink-0 rounded-xl bg-[#fff4f7] sm:w-28">
        <div
          className="h-full w-full bg-contain bg-center bg-no-repeat"
          style={{ backgroundImage: `url("${item.image || item.images?.[0] || ""}")` }}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">{item.name}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {item.subcategory_label || item.category_label || item.journey_title || item.item_type}
            </p>
            {item.journey_title ? <p className="mt-1 text-xs font-medium text-[#ff4f86]">{item.journey_title}</p> : null}
          </div>

          <div className="text-right">
            <div className="text-sm font-semibold text-slate-900">{formatCurrency(item.final_price || item.price)}</div>
            <div className="text-xs text-slate-400">
              {cartType === "quotation" ? "Quoted item" : `Line total ${formatCurrency(lineTotal)}`}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center overflow-hidden rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => onQuantityChange(item.item_id, Math.max(1, (Number(item.quantity) || 1) - 1))}
              className="cursor-pointer px-3 py-2 text-slate-600"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <div className="min-w-12 px-3 text-center text-sm font-semibold text-slate-700">{item.quantity}</div>
            <button
              type="button"
              onClick={() => onQuantityChange(item.item_id, (Number(item.quantity) || 1) + 1)}
              className="cursor-pointer px-3 py-2 text-slate-600"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onRemove(item.item_id)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600"
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CartItemsClient({ activeCart = "shopping" }) {
  const carts = useCartState();

  const quotationSummary = useMemo(() => {
    return carts.quotation.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }, [carts.quotation]);

  return (
    <div className="space-y-5">
      {activeCart === "quotation" ? (
        <div>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Quotation Cart</h2>
              <p className="mt-1 text-sm text-slate-500">
                {quotationSummary} item{quotationSummary === 1 ? "" : "s"} ready to send for quotation.
              </p>
            </div>
            {carts.quotation.length > 0 ? (
              <button
                type="button"
                onClick={() => clearCart("quotation")}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600"
              >
                Clear
              </button>
            ) : null}
          </div>

          {carts.quotation.length > 0 ? (
            <div className="space-y-4">
              {carts.quotation.map((item) => (
                <CartRow
                  key={`quotation-${item.item_id}`}
                  item={item}
                  cartType="quotation"
                  onRemove={(itemId) => removeFromCart("quotation", itemId)}
                  onQuantityChange={(itemId, quantity) => updateCartQuantity("quotation", itemId, quantity)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#efe7eb] bg-white px-6 py-12 text-center text-slate-500">
              No items in quotation cart yet.
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Shopping Cart</h2>
              <p className="mt-1 text-sm text-slate-500">Pay securely via Razorpay checkout.</p>
            </div>
            {carts.shopping.length > 0 ? (
              <button
                type="button"
                onClick={() => clearCart("shopping")}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600"
              >
                Clear
              </button>
            ) : null}
          </div>

          {carts.shopping.length > 0 ? (
            <div className="space-y-4">
              {carts.shopping.map((item) => (
                <CartRow
                  key={`shopping-${item.item_id}`}
                  item={item}
                  cartType="shopping"
                  onRemove={(itemId) => removeFromCart("shopping", itemId)}
                  onQuantityChange={(itemId, quantity) => updateCartQuantity("shopping", itemId, quantity)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#efe7eb] bg-white px-6 py-12 text-center text-slate-500">
              No items in shopping cart yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

