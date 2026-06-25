"use client";

import Link from "next/link";
import { useCartSummary } from "@/lib/cartStore";
import { Receipt, ShoppingCart } from "lucide-react";

const QUOTE_COLOR = "#d4720a";

export default function BasketButton({ floating = false, className = "" }) {
  const { quotationCount, shoppingCount } = useCartSummary();

  if (floating) {
    return (
      <div className="fixed bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full bg-surface px-2 py-2 shadow-[0_20px_50px_rgba(15,23,42,0.16)]">
        <Link
          href="/cart?tab=quotation"
          aria-label={`Quote cart — ${quotationCount} item${quotationCount !== 1 ? "s" : ""}`}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 transition hover:bg-surface-muted"
        >
          <Receipt className="h-4 w-4 shrink-0" style={{ color: QUOTE_COLOR }} strokeWidth={2} />
          <span className="text-xs font-semibold text-muted">Quote</span>
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white" style={{ backgroundColor: QUOTE_COLOR }}>
            {quotationCount}
          </span>
        </Link>
        <div className="h-5 w-px bg-border" aria-hidden="true" />
        <Link
          href="/cart?tab=shopping"
          aria-label={`Shop cart — ${shoppingCount} item${shoppingCount !== 1 ? "s" : ""}`}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 transition hover:bg-surface-muted"
        >
          <ShoppingCart className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
          <span className="text-xs font-semibold text-muted">Shop</span>
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
            {shoppingCount}
          </span>
        </Link>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Link
        href="/cart?tab=quotation"
        aria-label={`Quote cart — ${quotationCount} items`}
        title="Quote cart"
        className="flex h-10 items-center gap-1.5 rounded-xl border border-border-strong px-3 text-text transition hover:bg-surface-muted"
      >
        <Receipt className="h-4 w-4 shrink-0" style={{ color: QUOTE_COLOR }} strokeWidth={2} />
        <span className="text-xs font-semibold">Quote</span>
        <span
          className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${quotationCount > 0 ? "text-white" : "bg-surface-muted text-subtle"}`}
          style={quotationCount > 0 ? { backgroundColor: QUOTE_COLOR } : undefined}
        >
          {quotationCount}
        </span>
      </Link>
      <Link
        href="/cart?tab=shopping"
        aria-label={`Shop cart — ${shoppingCount} items`}
        title="Shop cart"
        className="flex h-10 items-center gap-1.5 rounded-xl border border-border-strong px-3 text-text transition hover:bg-surface-muted"
      >
        <ShoppingCart className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
        <span className="text-xs font-semibold">Shop</span>
        <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${shoppingCount > 0 ? "bg-primary text-primary-foreground" : "bg-surface-muted text-subtle"}`}>
          {shoppingCount}
        </span>
      </Link>
    </div>
  );
}
