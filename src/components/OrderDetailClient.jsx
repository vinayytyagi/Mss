"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { getAuthToken, useAuthUser } from "@/lib/authCookies";
import {
  API_BASE,
  cancelMyOrder,
  requestMyOrderRefund,
  retryOrderPayment,
  verifyRazorpayPayment,
  createItemReturnRequest,
  confirmReturnPayment,
  fetchSiteConfig,
  trackOrder,
} from "@/lib/api";
import { makeIdempotencyKey } from "@/lib/idempotencyKey";
import { ArrowRight, RefreshCw, Download, PackageOpen } from "lucide-react";

// Cancellation reasons offered before an order ships.
const CANCEL_REASONS = [
  "Changed my mind",
  "Ordered by mistake",
  "Found a better price elsewhere",
  "Delivery is taking too long",
  "Other",
];

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/* ── Helpers ────────────────────────────────────────── */
function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);
}

function formatDateShort(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return String(d);
  }
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
  Processing: "bg-info/10 text-info border-info/40",
  Shipped: "bg-info/10 text-info border-info/40",
  Delivered: "bg-success/10 text-success border-success/40",
  Cancelled: "bg-danger/10 text-danger border-danger/30",
  Failed: "bg-danger/10 text-danger border-danger/30",
  "Payment Failed": "bg-danger/10 text-danger border-danger/30",
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
  const [siteCfg, setSiteCfg] = useState({ refund_visible: false, replacement_enabled: true });
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [returnModal, setReturnModal] = useState(null); // selected item or null
  const [returnForm, setReturnForm] = useState({ reason: "", mode: "return" });
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelForm, setCancelForm] = useState({ reason: "", details: "" });

  useEffect(() => {
    fetchSiteConfig().then(setSiteCfg).catch(() => {});
  }, []);

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

  const status = currentOrder.status;
  const isPaid =
    currentOrder.payment_status === "Paid" ||
    ["Confirmed", "Processing", "Shipped", "Delivered"].includes(status);
  const isPaymentFailed = status === "Payment Failed" || (status === "Failed" && !isPaid);
  const isCancelled = status === "Cancelled";
  const stepIndex = getStepIndex(status, currentOrder.fulfillment_status);
  const canRetry = !isPaid && (isPaymentFailed || status === "Pending");
  const canCancel = status === "Pending" || status === "Confirmed" || status === "Processing";
  // Cash refund is gated behind the admin feature flag; otherwise cancellation
  // returns store credit automatically. Returns/replacements on delivered orders.
  const canRefund = siteCfg.refund_visible && (status === "Cancelled" || status === "Delivered");
  const canReturn = status === "Delivered";
  // Delivery date (Task 13) — prefer master shipment, fall back to first sub-order.
  const shipmentInfo =
    currentOrder.shipment ||
    (Array.isArray(currentOrder.sub_orders)
      ? currentOrder.sub_orders.map((s) => s.shipment).find(Boolean)
      : null) ||
    null;
  const expectedDelivery =
    shipmentInfo?.expected_delivery_date || tracking?.tracking_summary?.expected_delivery_date || null;
  const deliveredAt = currentOrder.delivered_at || shipmentInfo?.delivered_at || null;

  async function onCancelOrder() {
    const token = getAuthToken();
    if (!token) return;
    // Build the reason from the picker + optional details. "Other" requires
    // the free-text box; the confirm button enforces that before we get here.
    const picked = cancelForm.reason.trim();
    const details = cancelForm.details.trim();
    const reason =
      picked === "Other"
        ? details || "Other"
        : [picked, details].filter(Boolean).join(" — ");
    setActionState({ loading: true, error: "", success: "" });
    try {
      const res = await cancelMyOrder(token, currentOrder._id, reason || "Cancelled by user");
      setCurrentOrder(res.order || currentOrder);
      setCancelModal(false);
      setActionState({ loading: false, error: "", success: res.message || "Order cancelled." });
      toast.success("Order cancelled");
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

  // Task 6 — re-pay a failed/pending order via a fresh Razorpay order.
  async function onRetryPayment() {
    const token = getAuthToken();
    if (!token) return;
    setActionState({ loading: true, error: "", success: "" });
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load Razorpay.");
      const res = await retryOrderPayment(currentOrder._id);
      const rz = res.razorpay;
      if (!rz?.order_id) throw new Error("Could not start payment. Please try again.");
      const rzp = new window.Razorpay({
        key: rz.key_id,
        amount: rz.amount,
        currency: rz.currency || "INR",
        name: rz.name || "MyShaadiStore",
        description: rz.description || `Order ${currentOrder.order_number}`,
        order_id: rz.order_id,
        prefill: rz.prefill,
        theme: { color: "#ff4f86" },
        handler: async (pr) => {
          try {
            const vp = {
              razorpay_order_id: pr.razorpay_order_id,
              razorpay_payment_id: pr.razorpay_payment_id,
              razorpay_signature: pr.razorpay_signature,
            };
            const vres = await verifyRazorpayPayment(vp, { idempotencyKey: makeIdempotencyKey("orders/verify-payment", vp) });
            setCurrentOrder(vres.order || currentOrder);
            setActionState({ loading: false, error: "", success: "Payment successful! Order confirmed." });
            toast.success("Payment successful!");
          } catch (e) {
            setActionState({ loading: false, error: e.message || "Verification failed.", success: "" });
          }
        },
        modal: { ondismiss: () => setActionState({ loading: false, error: "Payment cancelled.", success: "" }) },
      });
      rzp.on("payment.failed", (f) =>
        setActionState({ loading: false, error: f?.error?.description || "Payment failed.", success: "" }),
      );
      rzp.open();
    } catch (e) {
      setActionState({ loading: false, error: e.message || "Could not retry payment.", success: "" });
    }
  }

  // Task 10 — download the GST tax invoice PDF (auth'd fetch → blob).
  async function downloadInvoice() {
    const token = getAuthToken();
    if (!token) return;
    setInvoiceLoading(true);
    try {
      const res = await fetch(`${API_BASE}/user/orders/${currentOrder._id}/invoice?format=pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Could not generate invoice");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${currentOrder.order_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e.message || "Invoice download failed");
    } finally {
      setInvoiceLoading(false);
    }
  }

  // Task 7 — submit a return / replacement for one delivered item. A
  // change-of-mind return charges reverse shipping via Razorpay first.
  async function submitReturn() {
    const token = getAuthToken();
    if (!token || !returnModal) return;
    if (returnForm.reason.trim().length < 5) {
      toast.error("Please describe the issue (min 5 characters).");
      return;
    }
    setActionState({ loading: true, error: "", success: "" });
    try {
      const payload = { reason: returnForm.reason.trim(), mode: returnForm.mode, quantity: 1 };
      const res = await createItemReturnRequest(token, currentOrder._id, returnModal.item_id, payload, {
        idempotencyKey: makeIdempotencyKey("return", { o: currentOrder._id, i: returnModal.item_id, ...payload }),
      });
      const returnId = res?.return_id || res?.id || res?.return?._id || res?.return?.id || null;
      // change-of-mind → pay reverse shipping, then confirm.
      if (res?.razorpay?.order_id && returnId) {
        const loaded = await loadRazorpayScript();
        if (!loaded) throw new Error("Failed to load Razorpay.");
        const rz = res.razorpay;
        const rzp = new window.Razorpay({
          key: rz.key_id,
          amount: rz.amount,
          currency: rz.currency || "INR",
          name: rz.name || "MyShaadiStore",
          description: rz.description || "Reverse shipping",
          order_id: rz.order_id,
          prefill: rz.prefill,
          theme: { color: "#ff4f86" },
          handler: async (pr) => {
            try {
              await confirmReturnPayment(token, returnId, {
                razorpay_order_id: pr.razorpay_order_id,
                razorpay_payment_id: pr.razorpay_payment_id,
                razorpay_signature: pr.razorpay_signature,
              });
              setActionState({ loading: false, error: "", success: "Return request submitted." });
              toast.success("Return request submitted.");
              setReturnModal(null);
            } catch (e) {
              setActionState({ loading: false, error: e.message || "Payment failed.", success: "" });
            }
          },
          modal: {
            ondismiss: () =>
              setActionState({ loading: false, error: "Payment cancelled — return not submitted.", success: "" }),
          },
        });
        rzp.open();
        return;
      }
      setActionState({ loading: false, error: "", success: "Return request submitted." });
      toast.success("Return request submitted.");
      setReturnModal(null);
    } catch (e) {
      setActionState({ loading: false, error: e.message || "Could not submit return", success: "" });
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
      {!isCancelled && !isPaymentFailed && (
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
          <p className="font-semibold text-danger">This order has been cancelled.</p>
        </div>
      )}

      {/* Payment-failed banner (Task 6) */}
      {isPaymentFailed && (
        <div className="mt-8 rounded-2xl border border-danger/30 bg-danger/10 px-6 py-4">
          <p className="font-semibold text-danger">Payment for this order didn&apos;t go through.</p>
          <p className="mt-1 text-sm text-danger/80">Retry the payment below to confirm your order.</p>
        </div>
      )}

      {(canRetry || canCancel || canRefund || isPaid) && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {canRetry && (
            <button
              onClick={onRetryPayment}
              disabled={actionState.loading}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" /> {actionState.loading ? "Please wait..." : "Retry payment"}
            </button>
          )}
          {isPaid && (
            <button
              onClick={downloadInvoice}
              disabled={invoiceLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-border-strong bg-surface px-4 py-2 text-sm font-semibold text-text transition hover:bg-surface-muted disabled:opacity-50"
            >
              <Download className="h-4 w-4" /> {invoiceLoading ? "Preparing…" : "Download invoice (PDF)"}
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => {
                setCancelForm({ reason: "", details: "" });
                setActionState({ loading: false, error: "", success: "" });
                setCancelModal(true);
              }}
              disabled={actionState.loading}
              className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2 text-sm font-semibold text-danger transition hover:bg-danger/15"
            >
              Cancel Order
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
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <p className="font-bold text-text">{formatCurrency(item.price)}</p>
                    <p className="text-xs text-subtle">Qty: {item.quantity}</p>
                  </div>
                  {canReturn && item.item_id ? (
                    <button
                      type="button"
                      onClick={() => {
                        setReturnForm({ reason: "", mode: "return" });
                        setActionState({ loading: false, error: "", success: "" });
                        setReturnModal(item);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-border-strong px-2.5 py-1 text-xs font-semibold text-muted transition hover:border-primary hover:text-primary"
                    >
                      <PackageOpen className="h-3.5 w-3.5" /> Return / Replace
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          {/* Coupon discount line */}
          {(Number(currentOrder.coupon_discount_paise) > 0 || currentOrder.coupon_free_shipping) && (
            <div className="mt-2 flex items-center justify-between border-t border-border pt-4 text-sm">
              <p className="font-medium text-muted">
                Coupon{currentOrder.coupon_code ? ` (${currentOrder.coupon_code})` : ""}
              </p>
              <p className="font-semibold text-success">
                {Number(currentOrder.coupon_discount_paise) > 0
                  ? `− ${formatCurrency(Number(currentOrder.coupon_discount_paise) / 100)}`
                  : "Free shipping"}
              </p>
            </div>
          )}
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

          {/* Delivery date (Task 13) */}
          {(deliveredAt || expectedDelivery) && (
            <div className="rounded-3xl border border-border bg-surface/80 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-subtle">Delivery</h2>
              <div className="mt-3 text-sm">
                {deliveredAt ? (
                  <div className="flex justify-between">
                    <span className="text-subtle">Delivered on</span>
                    <span className="font-semibold text-success">{formatDateShort(deliveredAt)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-subtle">Expected by</span>
                    <span className="font-semibold text-text">{formatDateShort(expectedDelivery)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

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

      {/* Return / replace modal (Task 7) */}
      {returnModal ? (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-text-strong/45 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setReturnModal(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-text-strong">Return or replace item</h3>
            <p className="mt-1 line-clamp-1 text-sm text-muted">{returnModal.name}</p>
            <div className="mt-4 space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setReturnForm((f) => ({ ...f, mode: "return" }))}
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    returnForm.mode === "return"
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-border-strong text-muted hover:border-primary/40"
                  }`}
                >
                  Return (store credit)
                </button>
                {siteCfg.replacement_enabled ? (
                  <button
                    type="button"
                    onClick={() => setReturnForm((f) => ({ ...f, mode: "replace" }))}
                    className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                      returnForm.mode === "replace"
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border-strong text-muted hover:border-primary/40"
                    }`}
                  >
                    Replace item
                  </button>
                ) : null}
              </div>
              <textarea
                value={returnForm.reason}
                onChange={(e) => setReturnForm((f) => ({ ...f, reason: e.target.value }))}
                rows={3}
                placeholder="What's the issue? (defective, wrong item, changed mind…)"
                className="w-full rounded-xl border border-border-strong bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary"
              />
              <p className="text-xs text-subtle">
                Defective / wrong items are free to return. Change-of-mind returns may charge reverse shipping before
                pickup.
              </p>
              {actionState.error ? <p className="text-sm text-danger">{actionState.error}</p> : null}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReturnModal(null)}
                className="h-10 rounded-xl border border-border-strong px-4 text-sm font-semibold text-muted hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitReturn}
                disabled={actionState.loading}
                className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
              >
                {actionState.loading ? "Submitting…" : "Submit request"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Cancel-order confirmation + reason modal */}
      {cancelModal ? (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-text-strong/45 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !actionState.loading) setCancelModal(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-text-strong">Cancel this order?</h3>
            <p className="mt-1 text-sm text-muted">
              Order {currentOrder.order_number} — you can cancel any time before it ships. This can&apos;t be undone.
            </p>

            <p className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wide text-subtle">
              Why are you cancelling?
            </p>
            <div className="space-y-2">
              {CANCEL_REASONS.map((r) => {
                const active = cancelForm.reason === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setCancelForm((f) => ({ ...f, reason: r }))}
                    className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-sm font-medium transition ${
                      active
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border-strong text-muted hover:border-primary/40"
                    }`}
                  >
                    <span
                      className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                        active ? "border-primary" : "border-border-strong"
                      }`}
                    >
                      {active ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
                    </span>
                    {r}
                  </button>
                );
              })}
            </div>

            <textarea
              value={cancelForm.details}
              onChange={(e) => setCancelForm((f) => ({ ...f, details: e.target.value }))}
              rows={2}
              placeholder={cancelForm.reason === "Other" ? "Tell us more (required)" : "Add more details (optional)"}
              className="mt-3 w-full rounded-xl border border-border-strong bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary"
            />

            {isPaid ? (
              <p className="mt-3 rounded-lg bg-info/10 px-3 py-2 text-xs text-info">
                Your paid amount will be refunded to your MyShaadiStore wallet (store credit).
              </p>
            ) : null}
            {actionState.error ? <p className="mt-2 text-sm text-danger">{actionState.error}</p> : null}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelModal(false)}
                disabled={actionState.loading}
                className="h-10 rounded-xl border border-border-strong px-4 text-sm font-semibold text-muted hover:bg-surface-muted disabled:opacity-50"
              >
                Keep order
              </button>
              <button
                type="button"
                onClick={onCancelOrder}
                disabled={
                  actionState.loading ||
                  !cancelForm.reason ||
                  (cancelForm.reason === "Other" && !cancelForm.details.trim())
                }
                className="h-10 rounded-xl bg-danger px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {actionState.loading ? "Cancelling…" : "Confirm cancellation"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
