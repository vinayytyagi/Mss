"use client";

import { useCartSummary } from "@/lib/cartStore";

export default function CartHeaderStatsClient() {
  const { quotationCount, shoppingCount } = useCartSummary();

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-border bg-surface px-5 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
        <div className="text-xs font-medium text-subtle">Quote cart</div>
        <div className="mt-1.5 text-2xl font-semibold text-text-strong">{quotationCount}</div>
      </div>
      <div className="rounded-2xl border border-border bg-surface px-5 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
        <div className="text-xs font-medium text-subtle">Shop cart</div>
        <div className="mt-1.5 text-2xl font-semibold text-text-strong">{shoppingCount}</div>
      </div>
    </div>
  );
}

