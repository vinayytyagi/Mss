"use client";

import { useState } from "react";
import Link from "next/link";
import { trackOrder } from "@/lib/api";

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
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-[#ff4f86] to-[#ff8fb1] text-white shadow-[0_20px_50px_rgba(255,79,134,0.3)]">
          <TruckIcon />
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-700">Track Your Order</h1>
        <p className="mt-2 text-sm text-slate-400">Enter your order number and registered phone number</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleTrack} className="mt-8 rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)] backdrop-blur sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-400">Order Number</label>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g. MSS-123456-ABCD"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#ff4f86] focus:ring-2 focus:ring-[#ff4f86]/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              maxLength={10}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#ff4f86] focus:ring-2 focus:ring-[#ff4f86]/20"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#ff4f86] to-[#ff8fb1] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(255,79,134,0.28)] transition hover:shadow-[0_22px_50px_rgba(255,79,134,0.35)] disabled:opacity-60"
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <SearchIcon /> Track Order
            </>
          )}
        </button>
      </form>

      {/* My Orders Quick Track */}
      {initialOrders.length > 0 && (
        <section className="mt-8 rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)] backdrop-blur sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-700">Your Recent Orders</h2>
              <p className="text-sm text-slate-400">Track with one click using your registered phone number.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
              {initialOrders.length} order{initialOrders.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {initialOrders.slice(0, 6).map((order) => (
              <div
                key={order._id || order.order_number}
                className={`rounded-2xl border px-4 py-4 transition ${
                  selectedOrderNumber === order.order_number
                    ? "border-[#ff4f86]/40 bg-[#fff1f6]"
                    : "border-slate-100 bg-slate-50/60"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-400">Order Number</p>
                    <p className="text-sm font-bold text-slate-700">{order.order_number}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      {order.status || "Pending"}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      {order.fulfillment_status || "Unfulfilled"}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  <p className="text-xs text-slate-500">Placed on {formatShortDate(order.created_at)}</p>
                  <button
                    type="button"
                    onClick={() => handleQuickTrack(order)}
                    disabled={loading}
                    className="rounded-xl bg-[#ff4f86] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#ff3d79] disabled:opacity-60"
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
          <div className="rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)] backdrop-blur sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-slate-400">Order</p>
                <p className="text-xl font-semibold text-slate-700">{result.order_number}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  result.status === "Paid" ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
                  result.status === "Cancelled" ? "border-red-200 bg-red-50 text-red-700" :
                  "border-amber-200 bg-amber-50 text-amber-700"
                }`}>
                  {result.status}
                </span>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  result.fulfillment_status === "Delivered" ? "border-green-200 bg-green-50 text-green-700" :
                  result.fulfillment_status === "Shipped" ? "border-purple-200 bg-purple-50 text-purple-700" :
                  "border-orange-200 bg-orange-50 text-orange-600"
                }`}>
                  {result.fulfillment_status || "Unfulfilled"}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            {!isCancelled && (
              <div className="relative mt-8 flex items-center justify-between">
                <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-slate-100" />
                <div
                  className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-linear-to-r from-[#ff4f86] to-[#ff8fb1] transition-all duration-700"
                  style={{ width: `${(stepIndex / (ORDER_STEPS.length - 1)) * 100}%` }}
                />
                {ORDER_STEPS.map((step, i) => {
                  const isActive = i <= stepIndex;
                  const isCurrent = i === stepIndex;
                  return (
                    <div key={step} className="relative z-10 flex flex-col items-center">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                        isActive
                          ? "border-[#ff4f86] bg-[#ff4f86] text-white shadow-[0_0_16px_rgba(255,79,134,0.4)]"
                          : "border-slate-200 bg-white text-slate-400"
                      } ${isCurrent ? "scale-110" : ""}`}>
                        {isActive ? <CheckCircle /> : <span className="text-xs font-bold">{i + 1}</span>}
                      </div>
                      <p className={`mt-2 text-xs font-semibold ${isActive ? "text-[#ff4f86]" : "text-slate-400"}`}>{step}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {isCancelled && (
              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-600">
                This order has been {result.status.toLowerCase()}.
              </div>
            )}

            {result.message && !result.shipment && (
              <p className="mt-4 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-center text-sm text-blue-600 font-medium">
                {result.message}
              </p>
            )}
          </div>

          {/* Shipment details */}
          {result.shipment && (
            <div className="rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">Shipment Details</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {result.shipment.courier_name && (
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-400">Courier</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-700">{result.shipment.courier_name}</p>
                  </div>
                )}
                {result.shipment.awb_code && (
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-400">AWB Code</p>
                    <p className="mt-0.5 font-mono text-sm font-bold text-[#ff4f86]">{result.shipment.awb_code}</p>
                  </div>
                )}
                {result.shipment.shipped_at && (
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-400">Shipped At</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-700">{formatDate(result.shipment.shipped_at)}</p>
                  </div>
                )}
              </div>
              {result.shipment.tracking_url && (
                <a
                  href={result.shipment.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 block w-full rounded-xl bg-linear-to-r from-[#ff4f86] to-[#ff8fb1] px-4 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_30px_rgba(255,79,134,0.25)] transition hover:shadow-[0_16px_40px_rgba(255,79,134,0.35)]"
                >
                  Track on Courier Website →
                </a>
              )}
              {result.tracking_summary && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-400">Current Status</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-700">{result.tracking_summary.current_status || "—"}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-400">Expected Delivery</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-700">{result.tracking_summary.expected_delivery_date || "—"}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Live tracking timeline */}
          {result.tracking?.tracking_data?.shipment_track_activities && (
            <div className="rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">Tracking Updates</h2>
              <div className="mt-4 space-y-0">
                {result.tracking.tracking_data.shipment_track_activities.map((activity, i, arr) => (
                  <div key={i} className="relative flex gap-3 pb-4">
                    {i < arr.length - 1 && (
                      <div className="absolute left-[9px] top-5 h-full w-0.5 bg-slate-100" />
                    )}
                    <div className={`relative z-10 mt-1 h-[18px] w-[18px] shrink-0 rounded-full border-2 ${
                      i === 0 ? "border-[#ff4f86] bg-[#ff4f86]" : "border-slate-200 bg-white"
                    }`} />
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{activity["sr-status-label"] || activity.activity}</p>
                      {activity.location && <p className="text-xs text-slate-400">{activity.location}</p>}
                      <p className="text-xs text-slate-400">{formatDate(activity.date)}</p>
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
        <Link href="/orders" className="text-sm font-semibold text-slate-400 transition hover:text-[#ff4f86]">
          ← Back to My Orders
        </Link>
      </div>
    </main>
  );
}
