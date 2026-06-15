"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAuthToken } from "@/lib/authCookies";
import { fetchMyServiceOrders } from "@/lib/api";
import { formatCurrency } from "@/lib/shopUi";
import { ArrowLeft, ArrowRight, FileText } from "lucide-react";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

const STATUS_TONE = {
  received: "bg-surface-muted text-muted",
  sourcing: "bg-warning/15 text-warning-strong",
  quote_ready: "bg-primary-soft text-primary",
  awaiting_payment: "bg-warning/15 text-warning-strong",
  confirmed: "bg-success/10 text-success",
  delivered: "bg-primary-soft text-primary",
  completed: "bg-success/10 text-success",
  cancelled: "bg-danger/10 text-danger",
};

export default function CustomerServiceOrdersPage() {
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setError("Please log in to view your service orders.");
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        const res = await fetchMyServiceOrders(token);
        if (active) setOrders(Array.isArray(res?.orders) ? res.orders : []);
      } catch (e) {
        if (active) setError(e?.message || "Couldn't load your service orders.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to profile
      </Link>

      <h1 className="mt-5 text-lg font-semibold text-text-strong">My Service Orders</h1>

      {loading ? (
        <div className="mt-6 flex justify-center py-20">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-danger/30 bg-danger/5 px-6 py-10 text-center text-sm text-danger">
          {error}
        </div>
      ) : !orders || orders.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-border bg-surface/80 px-8 py-16 text-center shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur">
          <FileText className="mx-auto h-6 w-6 text-muted" />
          <p className="mt-3 text-sm text-muted">No service orders yet</p>
          <p className="text-xs text-subtle">Request a managed service and we&apos;ll source quotes for you.</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
          >
            Explore services
          </Link>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {orders.map((o) => (
            <Link
              key={o.order_id}
              href={`/service-orders/${o.quotation_id}`}
              className="group block rounded-2xl border border-border bg-surface/80 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] backdrop-blur transition hover:border-primary/30 hover:shadow-[0_8px_30px_rgba(255,79,134,0.08)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-bold capitalize text-text">{o.service_type || "Service order"}</p>
                  <p className="text-xs text-subtle">
                    {o.order_id}
                    {o.event_date ? ` · ${formatDate(o.event_date)}` : ""}
                    {o.item_count != null ? ` · ${o.item_count} item${o.item_count === 1 ? "" : "s"}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      STATUS_TONE[o.status] || "bg-surface-muted text-muted"
                    }`}
                  >
                    {o.status_label || o.status}
                  </span>
                  <span className="font-bold text-text">
                    {o.quote_total != null ? formatCurrency(o.quote_total) : "Awaiting quote"}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
