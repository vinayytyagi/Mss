/**
 * Order-history panel on the right of the "Your Carts" header. Presentational
 * server component — the counts are fetched server-side (see CartPageServer) so
 * the correct numbers render on first paint with no client API call / 0-flash.
 *
 * Two clickable cards: past Shop orders (→ /orders) and past Quote requests
 * (→ /service-orders). Logged-out visitors get a single "log in" card instead.
 */

import Link from "next/link";
import { ShoppingBag, Receipt, ChevronRight, LogIn } from "lucide-react";

function HistoryCard({ href, icon: Icon, label, count }) {
  return (
    <Link
      href={href}
      className="group flex min-w-40 items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition hover:border-primary/50 hover:shadow-[0_10px_24px_rgba(255,79,134,0.12)]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-medium text-subtle">{label}</span>
        <span className="block text-xl font-bold leading-tight text-text-strong">{count}</span>
      </span>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-subtle transition group-hover:translate-x-0.5 group-hover:text-primary"
        aria-hidden
      />
    </Link>
  );
}

export default function CartHeaderHistory({ counts = { shop: 0, quote: 0 }, hasSession = false }) {
  if (!hasSession) {
    return (
      <Link
        href="/login?redirect=/cart"
        className="group flex shrink-0 items-center gap-2 self-start rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-medium text-muted shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition hover:border-primary/50 hover:text-primary"
      >
        <LogIn className="h-4 w-4" aria-hidden />
        Log in to see your order history
        <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
      </Link>
    );
  }

  return (
    <div className="flex shrink-0 flex-col gap-2 self-start">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">Your order history</p>
      <div className="flex flex-wrap items-stretch gap-2.5">
        <HistoryCard href="/service-orders" icon={Receipt} label="Quote requests" count={counts.quote} />
        <HistoryCard href="/orders" icon={ShoppingBag} label="Shop orders" count={counts.shop} />
      </div>
    </div>
  );
}
