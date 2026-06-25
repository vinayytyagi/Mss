import Link from "next/link";
import CartPageExperienceClient from "@/components/CartPageExperienceClient";
import CartHeaderHistory from "@/components/CartHeaderHistory";
import { getAuthTokenServer } from "@/lib/authCookiesServer";
import { fetchMyOrders, fetchMyServiceOrders } from "@/lib/api";
import { Suspense } from "react";

// Server-fetch the customer's order + quotation history counts so the header
// panel renders the correct numbers on first paint (no client API call / flash).
async function loadHistoryCounts() {
  const token = await getAuthTokenServer();
  if (!token) return { hasSession: false, counts: { shop: 0, quote: 0 } };
  const [shop, quote] = await Promise.all([
    fetchMyOrders(token)
      .then((r) => (Array.isArray(r?.orders) ? r.orders.length : 0))
      .catch(() => 0),
    fetchMyServiceOrders(token)
      .then((r) => (Array.isArray(r?.orders) ? r.orders.length : 0))
      .catch(() => 0),
  ]);
  return { hasSession: true, counts: { shop, quote } };
}

export default async function CartPageServer() {
  const { hasSession, counts } = await loadHistoryCounts();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-medium text-subtle">
        <Link href="/" className="transition hover:text-primary">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-muted">Cart</span>
      </nav>

      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-text-strong sm:text-3xl">
            Your Carts
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted">
            Send wedding-journey items for a tailored quotation, or check out shopping products
            instantly with secure Razorpay payment.
          </p>
        </div>
        <CartHeaderHistory counts={counts} hasSession={hasSession} />
      </div>

      <Suspense fallback={null}>
        <CartPageExperienceClient />
      </Suspense>
    </main>
  );
}
