"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAuthToken, useAuthUser } from "@/lib/authCookies";
import { cancelMyOrder, requestMyOrderRefund, trackOrder } from "@/lib/api";
import { ArrowRight } from "lucide-react";

/* ── Helpers ────────────────────────────────────────── */
function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);
}

/* ── Status steps for progress tracker ────────────── */
const ORDER_STEPS = ["Placed", "Confirmed", "Shipped", "Delivered"];

function getStepIndex(status, fulfillment) {
  if (fulfillment === "Delivered" || status === "Delivered") return 3;
  if (fulfillment === "Shipped" || status === "Shipped") return 2;
  if (status === "Paid" || status === "Confirmed") return 1;
  return 0;
}

/* ── Icons ──────────────────────────────────────────── */
function ArrowLeft() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M15 10H5m0 0l4-4m-4 4l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
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

function CopyIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <rect x="5" y="5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 14V5a2 2 0 012-2h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

/* ── Status badge ───────────────────────────────────── */
const statusColors = {
  Pending: "bg-warning/15 text-warning-strong border-warning/40",
  Paid: "bg-success/10 text-success border-success/40",
  Confirmed: "bg-info/10 text-info border-info/40",
  Shipped: "bg-info/10 text-info border-info/40",
  Delivered: "bg-success/10 text-success border-success/40",
  Cancelled: "bg-danger/10 text-danger border-danger/30",
  Failed: "bg-danger/10 text-danger border-danger/30",
};

function StatusBadge({ status }) {
  const cls = statusColors[status] || "bg-surface-muted text-muted border-border-strong";
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}

/* ── Main Component ────────────────────────────────── */
export default function OrderDetailClient({ initialOrder = null, initialTracking = null, initialError = "", hasServerSession = false }) {
  const user = useAuthUser();
  const [tracking, setTracking] = useState(initialTracking);
  const [loading] = useState(false);
  const [error] = useState(initialError);
  const [copied, setCopied] = useState(false);
  const [actionState, setActionState] = useState({ loading: false, error: "", success: "" });
  const [currentOrder, setCurrentOrder] = useState(initialOrder);

  useEffect(() => {
    if (!user || !currentOrder || tracking) {
      return;
    }
    if (currentOrder.shipment?.awb_code && user?.phone) {
      trackOrder(currentOrder.order_number, user.phone)
        .then((t) => setTracking(t))
        .catch(() => {});
    }
  }, [user, currentOrder, tracking]);

  function handleCopy(text) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!user && !hasServerSession) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <div className="rounded-3xl border border-border bg-surface/80 px-8 py-16 shadow-[0_8px_40px_rgba(0,0,0,0.04)] backdrop-blur">
          <h1 className="text-2xl font-semibold text-text">Order Details</h1>
          <p className="mt-2 text-muted">Please log in to view your order.</p>
          <Link href="/login" className="mt-6 inline-block rounded-2xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-[0_18px_40px_rgba(255,79,134,0.28)] transition hover:bg-primary-hover">
            Login
          </Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </main>
    );
  }

  if (error || !currentOrder) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <Link href="/orders" className="flex items-center gap-2 text-sm font-semibold text-muted hover:text-primary">
          <ArrowLeft /> Back to Orders
        </Link>
        <div className="mt-8 rounded-2xl border border-danger/30 bg-danger/10 px-6 py-8 text-center text-danger">
          {error || "Order not found"}
        </div>
      </main>
    );
  }

  const stepIndex = getStepIndex(currentOrder.status, currentOrder.fulfillment_status);
  const isCancelled = currentOrder.status === "Cancelled" || currentOrder.status === "Failed";
  const canCancel = currentOrder.status === "Pending" || currentOrder.status === "Confirmed" || currentOrder.status === "Processing";
  const canRefund = currentOrder.status === "Cancelled" || currentOrder.status === "Delivered";

  async function onCancelOrder() {
    const token = getAuthToken();
    if (!token) return;
    setActionState({ loading: true, error: "", success: "" });
    try {
      const res = await cancelMyOrder(token, currentOrder._id, "Customer cancelled from app");
      setCurrentOrder(res.order || currentOrder);
      setActionState({ loading: false, error: "", success: res.message || "Order cancelled." });
    } catch (e) {
      setActionState({ loading: false, error: e.message || "Failed to cancel order", success: "" });
    }
  }

  async function onRequestRefund() {
    const token = getAuthToken();
    if (!token) return;
    setActionState({ loading: true, error: "", success: "" });
    try {
      const res = await requestMyOrderRefund(token, currentOrder._id, "Customer requested refund");
      setCurrentOrder(res.order || currentOrder);
      setActionState({ loading: false, error: "", success: res.message || "Refund requested." });
    } catch (e) {
      setActionState({ loading: false, error: e.message || "Failed to request refund", success: "" });
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link href="/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-muted transition hover:text-primary">
        <ArrowLeft /> Back to Orders
      </Link>

      {/* Header */}
      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-text">{currentOrder.order_number}</h1>
            <button
              onClick={() => handleCopy(currentOrder.order_number)}
              className="cursor-pointer rounded-lg p-1.5 text-subtle transition hover:bg-surface-muted hover:text-muted"
              title="Copy order number"
            >
              {copied ? <CheckCircle /> : <CopyIcon />}
            </button>
          </div>
          <p className="mt-1 text-sm text-subtle">Placed on {formatDate(currentOrder.created_at)}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={currentOrder.status} />
          <StatusBadge status={currentOrder.fulfillment_status || "Unfulfilled"} />
        </div>
      </div>

      {/* Progress Tracker */}
      {!isCancelled && (
        <div className="mt-8 rounded-3xl border border-border bg-surface/80 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur sm:p-8">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-subtle">Order Progress</h2>
          <div className="relative mt-6 flex items-center justify-between">
            {/* Line */}
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
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground shadow-[0_0_16px_rgba(255,79,134,0.4)]"
                        : "border-border-strong bg-surface text-subtle"
                    } ${isCurrent ? "scale-110" : ""}`}
                  >
                    {isActive ? <CheckCircle /> : <span className="text-xs font-bold">{i + 1}</span>}
                  </div>
                  <p className={`mt-2 text-xs font-semibold ${isActive ? "text-primary" : "text-subtle"}`}>
                    {step}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancelled banner */}
      {isCancelled && (
        <div className="mt-8 rounded-2xl border border-danger/30 bg-danger/10 px-6 py-4 text-center">
          <p className="font-semibold text-danger">This order has been {currentOrder.status.toLowerCase()}.</p>
        </div>
      )}

      {(canCancel || canRefund) && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {canCancel && (
            <button
              onClick={onCancelOrder}
              disabled={actionState.loading}
              className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2 text-sm font-semibold text-danger"
            >
              {actionState.loading ? "Please wait..." : "Cancel Order"}
            </button>
          )}
          {canRefund && (
            <button
              onClick={onRequestRefund}
              disabled={actionState.loading}
              className="rounded-xl border border-border-strong bg-surface px-4 py-2 text-sm font-semibold text-text"
            >
              {actionState.loading ? "Please wait..." : "Request Refund"}
            </button>
          )}
          {actionState.error ? <p className="text-sm text-danger">{actionState.error}</p> : null}
          {actionState.success ? <p className="text-sm text-success">{actionState.success}</p> : null}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Items */}
        <div className="rounded-3xl border border-border bg-surface/80 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-subtle">Items ({currentOrder.items?.length || 0})</h2>
          <div className="mt-4 divide-y divide-border">
            {(currentOrder.items || []).map((item, i) => (
              <div key={i} className="flex items-center gap-4 py-4">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="h-16 w-16 shrink-0 rounded-2xl border border-border object-cover" />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-border bg-surface-muted text-lg font-bold text-border-strong">
                    {item.name?.charAt(0) || "?"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-text">{item.name}</p>
                  {item.category_label && (
                    <p className="text-xs text-subtle">{item.category_label}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-text">{formatCurrency(item.price)}</p>
                  <p className="text-xs text-subtle">Qty: {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Total */}
          <div className="mt-2 flex items-center justify-between border-t border-border pt-4">
            <p className="font-semibold text-muted">Total</p>
            <p className="text-xl font-semibold text-text-strong">{formatCurrency(currentOrder.total_amount)}</p>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Shipping Info */}
          <div className="rounded-3xl border border-border bg-surface/80 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-subtle">Shipping Address</h2>
            {currentOrder.shipping_address ? (
              <div className="mt-3 space-y-1 text-sm text-muted">
                {currentOrder.shipping_address.line1 && <p>{currentOrder.shipping_address.line1}</p>}
                {currentOrder.shipping_address.line2 && <p>{currentOrder.shipping_address.line2}</p>}
                <p>
                  {[currentOrder.shipping_address.city, currentOrder.shipping_address.state].filter(Boolean).join(", ")}
                </p>
                {currentOrder.shipping_address.pincode && (
                  <p className="font-semibold">{currentOrder.shipping_address.pincode}</p>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-subtle">Not provided</p>
            )}
          </div>

          {/* Shipment info */}
          {currentOrder.shipment && (
            <div className="rounded-3xl border border-border bg-surface/80 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-subtle">Shipment</h2>
              <div className="mt-3 space-y-2 text-sm">
                {currentOrder.shipment.courier_name && (
                  <div className="flex justify-between">
                    <span className="text-subtle">Courier</span>
                    <span className="font-semibold text-text">{currentOrder.shipment.courier_name}</span>
                  </div>
                )}
                {currentOrder.shipment.awb_code && (
                  <div className="flex items-center justify-between">
                    <span className="text-subtle">AWB</span>
                    <button
                      onClick={() => handleCopy(currentOrder.shipment.awb_code)}
                      className="flex cursor-pointer items-center gap-1 font-mono text-sm font-semibold text-primary transition hover:text-primary-hover"
                    >
                      {currentOrder.shipment.awb_code} <CopyIcon />
                    </button>
                  </div>
                )}
                {currentOrder.shipment.shipped_at && (
                  <div className="flex justify-between">
                    <span className="text-subtle">Shipped</span>
                    <span className="font-semibold text-text">{formatDate(currentOrder.shipment.shipped_at)}</span>
                  </div>
                )}
                {currentOrder.shipment.tracking_url && (
                  <a
                    href={currentOrder.shipment.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block w-full rounded-xl bg-linear-to-r from-primary to-primary-accent px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground shadow-[0_12px_30px_rgba(255,79,134,0.25)] transition hover:shadow-[0_16px_40px_rgba(255,79,134,0.35)]"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      Track on Courier Site
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Live tracking activities */}
          {tracking?.tracking?.tracking_data?.shipment_track_activities && (
            <div className="rounded-3xl border border-border bg-surface/80 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-subtle">Tracking Updates</h2>
              {tracking?.tracking_summary && (
                <div className="mb-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-surface-muted px-4 py-3">
                    <p className="text-xs text-subtle">Current Status</p>
                    <p className="mt-0.5 text-sm font-bold text-text">{tracking.tracking_summary.current_status || "—"}</p>
                  </div>
                  <div className="rounded-2xl bg-surface-muted px-4 py-3">
                    <p className="text-xs text-subtle">Expected Delivery</p>
                    <p className="mt-0.5 text-sm font-bold text-text">{tracking.tracking_summary.expected_delivery_date || "—"}</p>
                  </div>
                </div>
              )}
              <div className="mt-4 space-y-0">
                {tracking.tracking.tracking_data.shipment_track_activities.slice(0, 10).map((activity, i) => (
                  <div key={i} className="relative flex gap-3 pb-4">
                    {/* Vertical line */}
                    {i < 9 && (
                      <div className="absolute left-[9px] top-5 h-full w-0.5 bg-surface-muted" />
                    )}
                    <div className={`relative z-10 mt-1 h-[18px] w-[18px] shrink-0 rounded-full border-2 ${
                      i === 0 ? "border-primary bg-primary" : "border-border-strong bg-surface"
                    }`} />
                    <div>
                      <p className="text-sm font-semibold text-text">{activity["sr-status-label"] || activity.activity}</p>
                      <p className="text-xs text-subtle">{activity.location}</p>
                      <p className="text-xs text-subtle">{formatDate(activity.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
