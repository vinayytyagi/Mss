"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthUser } from "@/lib/authCookies";

/* ── Icons ─────────────────────────────────────────────── */
function PackageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M12 2L2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M16 3H1v13h15V3ZM16 8h4l3 3v5h-7V8ZM5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5ZM18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="m7.5 5 5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function EmptyBoxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-20 w-20 text-border-strong">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ── Status badges ─────────────────────────────────────── */
const statusColors = {
  Pending: "bg-warning/15 text-warning-strong border-warning/40",
  Paid: "bg-success/10 text-success border-success/40",
  Confirmed: "bg-info/10 text-info border-info/40",
  Processing: "bg-info/10 text-info border-info/40",
  Shipped: "bg-info/10 text-info border-info/40",
  Delivered: "bg-success/10 text-success border-success/40",
  Cancelled: "bg-danger/10 text-danger border-danger/30",
  Failed: "bg-danger/10 text-danger border-danger/30",
  "Payment Failed": "bg-danger/10 text-danger border-danger/30",
  Refunded: "bg-info/10 text-info border-info/40",
};

// Task 13 — derive a delivery line (delivered date wins, else expected ETA).
function deliveryLine(order) {
  const ship =
    order.shipment ||
    (Array.isArray(order.sub_orders) ? order.sub_orders.map((s) => s?.shipment).find(Boolean) : null);
  const delivered = order.delivered_at || ship?.delivered_at;
  const expected = ship?.expected_delivery_date;
  if (delivered) return { label: "Delivered on", value: delivered };
  if (expected) return { label: "Expected by", value: expected };
  return null;
}

function StatusBadge({ status }) {
  const cls = statusColors[status] || "bg-surface-muted text-muted border-border-strong";
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}

function FulfillmentBadge({ status }) {
  const map = {
    Unfulfilled: "bg-warning/15 text-warning-strong border-warning/40",
    Shipped: "bg-info/10 text-info border-info/40",
    Delivered: "bg-success/10 text-success border-success/40",
  };
  const cls = map[status] || "bg-surface-muted text-muted border-border-strong";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>
      {status === "Shipped" && <TruckIcon />}
      {status}
    </span>
  );
}

/* ── Date formatter ────────────────────────────────────── */
function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);
}

/* ── Main Component ────────────────────────────────────── */
export default function MyOrdersClient({ initialOrders = [], initialError = "", hasServerSession = false }) {
  const user = useAuthUser();
  const [orders] = useState(initialOrders);
  const [loading] = useState(false);
  const [error] = useState(initialError);

  /* Not logged in */
  if (!user && !hasServerSession) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <div className="rounded-3xl border border-border bg-surface/80 px-8 py-16 shadow-[0_8px_40px_rgba(0,0,0,0.04)] backdrop-blur">
          <PackageIcon />
          <h1 className="mt-4 text-2xl font-semibold text-text">My Orders</h1>
          <p className="mt-2 text-muted">Please log in to view your orders.</p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-2xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-[0_18px_40px_rgba(255,79,134,0.28)] transition hover:bg-primary-hover"
          >
            Login
          </Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <h1 className="text-2xl font-semibold text-text">My Orders</h1>
        <div className="mt-8 flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <h1 className="text-2xl font-semibold text-text">My Orders</h1>
        <div className="mt-8 rounded-2xl border border-danger/30 bg-danger/10 px-6 py-8 text-center text-danger">
          {error}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">My Orders</h1>
          <p className="mt-1 text-sm text-subtle">{orders.length} order{orders.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/orders/track-order"
          className="flex items-center gap-2 rounded-2xl border border-border-strong px-5 py-2.5 text-sm font-semibold text-muted transition hover:border-primary hover:text-primary"
        >
          <TruckIcon />
          Track Order
        </Link>
      </div>

      {/* Empty */}
      {orders.length === 0 && (
        <div className="mt-12 flex flex-col items-center rounded-3xl border border-border bg-surface/80 px-8 py-20 shadow-[0_8px_40px_rgba(0,0,0,0.04)] backdrop-blur">
          <EmptyBoxIcon />
          <h2 className="mt-4 text-lg font-semibold text-muted">No orders yet</h2>
          <p className="mt-1 text-sm text-subtle">Your purchases will appear here once you place an order.</p>
          <Link
            href="/"
            className="mt-6 rounded-2xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-[0_18px_40px_rgba(255,79,134,0.28)] transition hover:bg-primary-hover"
          >
            Start Shopping
          </Link>
        </div>
      )}

      {/* Order List */}
      <div className="mt-8 space-y-4">
        {orders.map((order) => (
          <Link
            key={order._id}
            href={`/orders/${order._id}`}
            className="group block rounded-2xl border border-border bg-surface/80 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] backdrop-blur transition hover:border-primary/30 hover:shadow-[0_8px_30px_rgba(255,79,134,0.08)]"
          >
            {/* Top row */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-subtle">Order</p>
                <p className="text-lg font-semibold text-text">{order.order_number}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={order.status} />
                <FulfillmentBadge status={order.fulfillment_status} />
                {order.refund?.status ? <StatusBadge status={`Refund: ${order.refund.status}`} /> : null}
              </div>
            </div>

            {/* Items preview */}
            <div className="mt-4 flex items-center gap-3 overflow-x-auto">
              {(order.items || []).slice(0, 4).map((item, i) => (
                <div key={i} className="shrink-0">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-14 w-14 rounded-xl border border-border object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-surface-muted text-xs text-subtle">
                      {item.name?.charAt(0) || "?"}
                    </div>
                  )}
                </div>
              ))}
              {(order.items || []).length > 4 && (
                <span className="shrink-0 text-xs font-semibold text-subtle">
                  +{order.items.length - 4} more
                </span>
              )}
            </div>

            {/* Bottom row */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-subtle">Total</p>
                  <p className="text-sm font-bold text-text">{formatCurrency(order.total_amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-subtle">Placed on</p>
                  <p className="text-sm font-semibold text-muted">{formatDate(order.created_at)}</p>
                </div>
                {order.shipment?.courier_name && (
                  <div>
                    <p className="text-xs text-subtle">Courier</p>
                    <p className="text-sm font-semibold text-muted">{order.shipment.courier_name}</p>
                  </div>
                )}
                {(() => {
                  const dl = deliveryLine(order);
                  return dl ? (
                    <div>
                      <p className="text-xs text-subtle">{dl.label}</p>
                      <p className="text-sm font-semibold text-muted">{formatDate(dl.value)}</p>
                    </div>
                  ) : null;
                })()}
              </div>
              <span className="flex items-center gap-1 text-sm font-semibold text-primary opacity-0 transition group-hover:opacity-100">
                View details <ChevronRight />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
