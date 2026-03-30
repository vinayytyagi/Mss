"use client";

import Link from "next/link";
import { useCartSummary } from "@/lib/cartStore";

function BasketIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M8 9V7a4 4 0 1 1 8 0v2m-11 0h14l-1.1 9.17A2 2 0 0 1 15.91 20H8.09a2 2 0 0 1-1.99-1.83L5 9Zm5 4v3m4-3v3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function BasketButton({ floating = false }) {
  const { totalCount, quotationCount, shoppingCount } = useCartSummary();

  return (
    <Link
      href="/cart"
      className={
        floating
          ? "fixed bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-[0_20px_50px_rgba(15,23,42,0.16)]"
          : "inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      }
    >
      <span className="rounded-full bg-[#fff1f6] p-2 text-[#ff4f86]">
        <BasketIcon />
      </span>
      <span>Basket</span>
      <span className="rounded-full bg-[#ff4f86] px-2.5 py-1 text-xs font-bold text-white">{totalCount}</span>
      <span className="hidden text-xs text-slate-400 md:inline">
        Q {quotationCount} | S {shoppingCount}
      </span>
    </Link>
  );
}
