"use client";

import { useState } from "react";
import Link from "next/link";
import { trackOrder } from "@/lib/api";
import { ArrowLeft, ArrowRight } from "lucide-react";

/* ── Icons ─────────────────────────────────────────── */
function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8"/>
      <path d="m14 14 3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
      <path d="M16 3H1v13h15V3ZM16 8h4l3 3v5h-7V8ZM5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5ZM18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CheckCircle() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd"/>
    </svg>
  );
}

/* ── Helpers ────────────────────────────────────────── */
function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function formatShortDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const ORDER_STEPS = ["Placed", "Confirmed", "Shipped", "Delivered"];

function getStepIndex(status, fulfillment) {
  if (fulfillment === "Delivered" || status === "Delivered") return 3;
  if (fulfillment === "Shipped" || status === "Shipped") return 2;
  if (status === "Paid" || status === "Confirmed") return 1;
  return 0;
}

/* ── Main Component ────────────────────────────────── */
export default function TrackOrderClient({ initialOrders = [], initialPhone = "" }) {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState(initialPhone);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedOrderNumber, setSelectedOrderNumber] = useState("");

  async function runTracking(targetOrderNumber, targetPhone) {
    if (!targetOrderNumber.trim() || !targetPhone.trim()) {
      setError("Please enter both order number and phone number");
      return;
    }

    setError("");
    setResult(null);
    setLoading(true);

    try {
      const data = await trackOrder(targetOrderNumber.trim(), targetPhone.trim());
      setResult(data);
    } catch (err) {
      setError(err.message || "Could not find your order");
    } finally {
      setLoading(false);
    }
  }

  async function handleTrack(e) {
    e.preventDefault();
    await runTracking(orderNumber, phone);
  }

  async function handleQuickTrack(order) {
    const quickPhone = initialPhone || phone;
    setOrderNumber(order.order_number || "");
    setSelectedOrderNumber(order.order_number || "");
    if (quickPhone) setPhone(quickPhone);
    await runTracking(order.order_number || "", quickPhone || "");
  }

  const stepIndex = result ? getStepIndex(result.status, result.fulfillment_status) : 0;
  const isCancelled = result && (result.status === "Cancelled" || result.status === "Failed");

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary-accent text-primary-foreground shadow-[0_20px_50px_rgba(255,79,134,0.3)]">
          <TruckIcon />
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-text">Track Your Order</h1>
        <p className="mt-2 text-sm text-subtle">Enter your order number and registered phone number</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleTrack} className="mt-8 rounded-3xl border border-border bg-surface/80 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)] backdrop-blur sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-subtle">Order Number</label>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g. MSS-123456-ABCD"
              className="mt-2 w-full rounded-xl border border-border-strong bg-surface px-4 py-3 text-sm text-text outline-none transition focus:border-primary focus:ring focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-subtle">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              maxLength={10}
              className="mt-2 w-full rounded-xl border border-border-strong bg-surface px-4 py-3 text-sm text-text outline-none transition focus:border-primary focus:ring focus:ring-primary/20"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-primary to-primary-accent px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_18px_40px_rgba(255,79,134,0.28)] transition hover:shadow-[0_22px_50px_rgba(255,79,134,0.35)] disabled:opacity-60"
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
            <>
              <SearchIcon /> Track Order
            </>
          )}
        </button>
      </form>

      {/* My Orders Quick Track */}
      {initialOrders.length > 0 && (
        <section className="mt-8 rounded-3xl border border-border bg-surface/80 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)] backdrop-blur sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-text">Your Recent Orders</h2>
              <p className="text-sm text-subtle">Track with one click using your registered phone number.</p>
            </div>
            <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-muted">
              {initialOrders.length} order{initialOrders.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {initialOrders.slice(0, 6).map((order) => (
              <div
                key={order._id || order.order_number}
                className={`rounded-2xl border px-4 py-4 transition ${
                  selectedOrderNumber === order.order_number
                    ? "border-primary/40 bg-primary-soft"
                    : "border-border bg-surface-muted/60"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-subtle">Order Number</p>
                    <p className="text-sm font-bold text-text">{order.order_number}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-border-strong bg-surface px-3 py-1 text-xs font-semibold text-muted">
                      {order.status || "Pending"}
                    </span>
                    <span className="rounded-full border border-border-strong bg-surface px-3 py-1 text-xs font-semibold text-muted">
                      {order.fulfillment_status || "Unfulfilled"}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                  <p className="text-xs text-muted">Placed on {formatShortDate(order.created_at)}</p>
                  <button
                    type="button"
                    onClick={() => handleQuickTrack(order)}
                    disabled={loading}
                    className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
                  >
                    Track This Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Results */}
      {result && (
        <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Order status card */}
          <div className="rounded-3xl border border-border bg-surface/80 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)] backdrop-blur sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-subtle">Order</p>
                <p className="text-xl font-semibold text-text">{result.order_number}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  result.status === "Paid" ? "border-success/40 bg-success/10 text-success" :
                  result.status === "Cancelled" ? "border-danger/30 bg-danger/10 text-danger" :
                  "border-warning/40 bg-warning/15 text-warning-strong"
                }`}>
                  {result.status}
                </span>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  result.fulfillment_status === "Delivered" ? "border-success/40 bg-success/10 text-success" :
                  result.fulfillment_status === "Shipped" ? "border-info/40 bg-info/10 text-info" :
                  "border-warning/40 bg-warning/15 text-warning-strong"
                }`}>
                  {result.fulfillment_status || "Unfulfilled"}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            {!isCancelled && (
              <div className="relative mt-8 flex items-center justify-between">
                <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-surface-muted" />
                <div
                  className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-linear-to-r from-primary to-primary-accent transition-all duration-700"
                  style={{ width: `${(stepIndex / (ORDER_STEPS.length - 1)) * 100}%` }}
                />
                {ORDER_STEPS.map((step, i) => {
                  const isActive = i <= stepIndex;
                  const isCurrent = i === stepIndex;
                  return (
                    <div key={step} className="relative z-10 flex flex-col items-center">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                        isActive
                          ? "border-primary bg-primary text-primary-foreground shadow-[0_0_16px_rgba(255,79,134,0.4)]"
                          : "border-border-strong bg-surface text-subtle"
                      } ${isCurrent ? "scale-110" : ""}`}>
                        {isActive ? <CheckCircle /> : <span className="text-xs font-bold">{i + 1}</span>}
                      </div>
                      <p className={`mt-2 text-xs font-semibold ${isActive ? "text-primary" : "text-subtle"}`}>{step}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {isCancelled && (
              <div className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-center text-sm font-semibold text-danger">
                This order has been {result.status.toLowerCase()}.
              </div>
            )}

            {result.message && !result.shipment && (
              <p className="mt-4 rounded-xl bg-info/10 border border-info/30 px-4 py-3 text-center text-sm text-info font-medium">
                {result.message}
              </p>
            )}
          </div>

          {/* Shipment details */}
          {result.shipment && (
            <div className="rounded-3xl border border-border bg-surface/80 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-subtle">Shipment Details</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {result.shipment.courier_name && (
                  <div className="rounded-2xl bg-surface-muted px-4 py-3">
                    <p className="text-xs text-subtle">Courier</p>
                    <p className="mt-0.5 text-sm font-bold text-text">{result.shipment.courier_name}</p>
                  </div>
                )}
                {result.shipment.awb_code && (
                  <div className="rounded-2xl bg-surface-muted px-4 py-3">
                    <p className="text-xs text-subtle">AWB Code</p>
                    <p className="mt-0.5 font-mono text-sm font-bold text-primary">{result.shipment.awb_code}</p>
                  </div>
                )}
                {result.shipment.shipped_at && (
                  <div className="rounded-2xl bg-surface-muted px-4 py-3">
                    <p className="text-xs text-subtle">Shipped At</p>
                    <p className="mt-0.5 text-sm font-bold text-text">{formatDate(result.shipment.shipped_at)}</p>
                  </div>
                )}
              </div>
              {result.shipment.tracking_url && (
                <a
                  href={result.shipment.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 block w-full rounded-xl bg-linear-to-r from-primary to-primary-accent px-4 py-3 text-center text-sm font-semibold text-primary-foreground shadow-[0_12px_30px_rgba(255,79,134,0.25)] transition hover:shadow-[0_16px_40px_rgba(255,79,134,0.35)]"
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    Track on Courier Website
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </a>
              )}
              {result.tracking_summary && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-surface-muted px-4 py-3">
                    <p className="text-xs text-subtle">Current Status</p>
                    <p className="mt-0.5 text-sm font-bold text-text">{result.tracking_summary.current_status || "—"}</p>
                  </div>
                  <div className="rounded-2xl bg-surface-muted px-4 py-3">
                    <p className="text-xs text-subtle">Expected Delivery</p>
                    <p className="mt-0.5 text-sm font-bold text-text">{result.tracking_summary.expected_delivery_date || "—"}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Live tracking timeline */}
          {result.tracking?.tracking_data?.shipment_track_activities && (
            <div className="rounded-3xl border border-border bg-surface/80 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-subtle">Tracking Updates</h2>
              <div className="mt-4 space-y-0">
                {result.tracking.tracking_data.shipment_track_activities.map((activity, i, arr) => (
                  <div key={i} className="relative flex gap-3 pb-4">
                    {i < arr.length - 1 && (
                      <div className="absolute left-[9px] top-5 h-full w-0.5 bg-surface-muted" />
                    )}
                    <div className={`relative z-10 mt-1 h-[18px] w-[18px] shrink-0 rounded-full border-2 ${
                      i === 0 ? "border-primary bg-primary" : "border-border-strong bg-surface"
                    }`} />
                    <div>
                      <p className="text-sm font-semibold text-text">{activity["sr-status-label"] || activity.activity}</p>
                      {activity.location && <p className="text-xs text-subtle">{activity.location}</p>}
                      <p className="text-xs text-subtle">{formatDate(activity.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Back to orders link */}
      <div className="mt-8 text-center">
        <Link href="/orders" className="text-sm font-semibold text-subtle transition hover:text-primary">
          <span className="inline-flex items-center justify-center gap-2">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to My Orders
          </span>
        </Link>
      </div>
    </main>
  );
}
