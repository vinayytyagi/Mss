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
import { statusTone, statusLabel, ORDER_STEPS, getOrderStepIndex } from "@/lib/orderStatusUi";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Download,
  PackageOpen,
  Check,
  Copy,
  Truck,
  MapPin,
  Receipt,
  AlertCircle,
  ShoppingBag,
  Package,
  XCircle,
  CalendarDays,
  Layers,
  Wallet,
  Lock,
  Navigation,
} from "lucide-react";

// Cancellation reasons offered before an order ships.
const CANCEL_REASONS = [
  "Changed my mind",
  "Ordered by mistake",
  "Found a better price elsewhere",
  "Delivery is taking too long",
  "Other",
];

// Card shell — reuse everywhere a card is needed.
const CARD = "rounded-xl border border-border bg-surface p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]";
// Primary CTA.
const CTA =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(255,79,134,0.22)] transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60";
// Secondary / outline action.
const BTN_OUTLINE =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface px-5 py-3 text-sm font-semibold text-text-strong transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60";

// Join only non-empty meta parts with " · " — NEVER renders a bare dash.
const joinMeta = (...parts) => parts.filter((p) => p != null && String(p).trim() !== "").join(" · ");

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
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);
}

function formatDateShort(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return String(d);
  }
}

/* ── Hero header building blocks ────────────────────── */
function StatTile({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-[9rem] flex-1 items-center gap-3 rounded-2xl border border-border bg-surface-muted/60 px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">{label}</p>
        <p className="truncate text-sm font-bold text-text-strong">{value}</p>
      </div>
    </div>
  );
}

/* ── Sidebar section primitives ─────────────────────── */
function SidebarCard({ title, icon: Icon, action, children }) {
  return (
    <section className={CARD}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-subtle">
          {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
          {title}
        </h2>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function InfoRow({ label, value, accent }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className="text-muted">{label}</span>
      <span className={`text-right font-semibold ${accent ? "text-success" : "text-text-strong"}`}>{value}</span>
    </div>
  );
}

/* ── Loading skeleton — mirrors the real layout ─────── */
function DetailSkeleton() {
  return (
    <main className="mx-auto w-full max-w-[1700px] px-4 py-8 sm:px-6 lg:px-10">
      <div className="space-y-6">
        {/* Hero band */}
        <div className={`${CARD} sm:p-8`}>
          <Skeleton className="h-4 w-28" />
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 rounded-2xl" />
              <Skeleton className="h-7 w-56" />
            </div>
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 min-w-[9rem] flex-1 rounded-2xl" />
            ))}
          </div>
        </div>
        {/* Two-column body */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="min-w-0 space-y-6">
            <Skeleton className="h-28 rounded-xl" />
            <div className={CARD}>
              <Skeleton className="h-4 w-32" />
              <div className="mt-5 space-y-5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-14 w-14 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6 lg:sticky lg:top-24 self-start">
            <Skeleton className="h-56 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        </div>
      </div>
    </main>
  );
}

/* ── Horizontal stepper ─────────────────────────────── */
function HorizontalStepper({ steps, currentIndex }) {
  return (
    <section className={CARD}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-subtle">Progress</h2>
      <ol className="mt-6 flex min-w-max gap-0 overflow-x-auto pb-2 sm:min-w-0">
        {steps.map((step, i) => {
          const done = i < currentIndex;
          const current = i === currentIndex;
          return (
            <li key={step.key} className="flex flex-1 flex-col items-center text-center" style={{ minWidth: "5.5rem" }}>
              <div className="flex w-full items-center">
                <span className={`h-0.5 flex-1 ${i === 0 ? "opacity-0" : done || current ? "bg-success" : "bg-border"}`} />
                <span
                  className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                    done
                      ? "bg-success text-primary-foreground"
                      : current
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-surface-muted text-subtle"
                  }`}
                >
                  {current ? <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-primary/30" /> : null}
                  {done ? <Check className="h-4 w-4" strokeWidth={3} /> : <span className="relative">{i + 1}</span>}
                </span>
                <span className={`h-0.5 flex-1 ${i === steps.length - 1 ? "opacity-0" : done ? "bg-success" : "bg-border"}`} />
              </div>
              <p className={`mt-2 px-1 text-xs font-semibold ${done || current ? "text-text-strong" : "text-subtle"}`}>{step.label}</p>
              {step.at ? <p className="mt-0.5 text-[11px] text-muted">{step.at}</p> : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ── Centered state shell (empty / logged-out) ──────── */
function CenteredState({ icon: Icon, tone = "primary", title, subtitle, children }) {
  const tints =
    tone === "danger"
      ? "border-danger/30 bg-danger/5"
      : "border-border bg-surface";
  const iconTints =
    tone === "danger"
      ? "bg-danger/10 text-danger"
      : "bg-gradient-to-br from-primary-soft to-primary-soft/40 text-primary";
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl border px-6 py-16 text-center shadow-[0_10px_30px_rgba(15,23,42,0.04)] ${tints}`}>
      <span className={`flex h-16 w-16 items-center justify-center rounded-2xl ${iconTints}`}>
        <Icon className="h-7 w-7" strokeWidth={1.75} />
      </span>
      <h1 className="mt-5 text-lg font-bold text-text-strong">{title}</h1>
      <p className="mt-1.5 max-w-sm text-sm text-muted">{subtitle}</p>
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
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
      <main className="mx-auto w-full max-w-[1700px] px-4 py-16 sm:px-6 lg:px-10">
        <CenteredState
          icon={Lock}
          title="Please log in"
          subtitle="Log in to view your order, track delivery and manage returns."
        >
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(255,79,134,0.22)] transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Login <ArrowRight className="h-4 w-4" />
          </Link>
        </CenteredState>
      </main>
    );
  }

  if (loading) {
    return <DetailSkeleton />;
  }

  if (error || !currentOrder) {
    return (
      <main className="mx-auto w-full max-w-[1700px] px-4 py-8 sm:px-6 lg:px-10">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ArrowLeft className="h-4 w-4" /> Back to orders
        </Link>
        <div className="mt-6">
          <CenteredState icon={AlertCircle} tone="danger" title="Order not found" subtitle={error || "We couldn't find this order. It may have been removed."}>
            <Link
              href="/orders"
              className="inline-flex items-center gap-2 rounded-xl border border-border-strong bg-surface px-5 py-2.5 text-sm font-semibold text-text-strong transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              View all orders
            </Link>
          </CenteredState>
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
  const stepIndex = getOrderStepIndex(currentOrder);
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

  const itemCount = currentOrder.items?.length || 0;
  const hasActions = canRetry || canCancel || canRefund || isPaid;
  const hasInlineMsg = actionState.error || actionState.success;

  // City for the hero stat row.
  const city =
    [currentOrder.shipping_address?.city, currentOrder.shipping_address?.state].filter(Boolean).join(", ") || "";

  // Build the stat row, omitting empty values BEFORE rendering.
  const stats = [
    { label: "Placed on", value: formatDateShort(currentOrder.created_at), icon: CalendarDays },
    city ? { label: "Ship to", value: city, icon: MapPin } : null,
    itemCount ? { label: "Items", value: String(itemCount), icon: Layers } : null,
    { label: "Total", value: formatCurrency(currentOrder.total_amount), icon: Wallet },
  ].filter(Boolean);

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
    <main className="mx-auto w-full max-w-[1700px] px-4 py-8 sm:px-6 lg:px-10">
      <div className="space-y-6">
        {/* ── Hero header ─────────────────────────────── */}
        <header className="relative overflow-hidden rounded-xl border border-border bg-surface p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-8">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-gradient-to-b from-primary-soft to-transparent opacity-70" />
          <div className="relative">
            <Link
              href="/orders"
              className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <ArrowLeft className="h-4 w-4" /> Back to orders
            </Link>

            <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-subtle">Order details</p>
                <div className="mt-1.5 flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-accent text-primary-foreground shadow-[0_12px_24px_rgba(255,79,134,0.22)]">
                    <ShoppingBag className="h-6 w-6" strokeWidth={1.75} />
                  </span>
                  <h1 className="min-w-0 truncate text-2xl font-bold text-text-strong sm:text-3xl">{currentOrder.order_number}</h1>
                  <button
                    type="button"
                    onClick={() => handleCopy(currentOrder.order_number)}
                    aria-label="Copy order number"
                    title="Copy order number"
                    className="rounded-lg p-1.5 text-subtle transition hover:bg-surface-muted hover:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-bold capitalize ${statusTone(currentOrder.status)}`}>
                  {statusLabel(currentOrder.status)}
                </span>
                <span className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-bold capitalize ${statusTone(currentOrder.fulfillment_status || "Unfulfilled")}`}>
                  {statusLabel(currentOrder.fulfillment_status || "Unfulfilled")}
                </span>
              </div>
            </div>

            {/* STAT ROW — wraps on mobile */}
            {stats.length ? (
              <div className="mt-6 flex flex-wrap gap-3">
                {stats.map((s) => (
                  <StatTile key={s.label} icon={s.icon} label={s.label} value={s.value} />
                ))}
              </div>
            ) : null}
          </div>
        </header>

        {/* ── Two-column body ─────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
          {/* MAIN column */}
          <div className="min-w-0 space-y-6">
            {/* Status banners */}
            {isCancelled ? (
              <div className="flex items-center gap-3 rounded-xl border border-danger/30 bg-danger/5 px-5 py-4">
                <XCircle className="h-5 w-5 shrink-0 text-danger" />
                <p className="text-sm font-semibold text-danger">This order has been cancelled.</p>
              </div>
            ) : null}

            {isPaymentFailed ? (
              <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/5 px-5 py-4">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
                <div>
                  <p className="text-sm font-semibold text-danger">Payment for this order didn&apos;t go through.</p>
                  <p className="mt-0.5 text-xs text-danger/80">Retry the payment from the sidebar to confirm your order.</p>
                </div>
              </div>
            ) : null}

            {/* Progress stepper */}
            {!isCancelled && !isPaymentFailed && (
              <HorizontalStepper steps={ORDER_STEPS} currentIndex={stepIndex} />
            )}

            {/* Items */}
            <section className={CARD}>
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-subtle">
                <ShoppingBag className="h-4 w-4" aria-hidden="true" /> Items ({itemCount})
              </h2>
              <div className="mt-4 divide-y divide-border">
                {(currentOrder.items || []).map((item, i) => (
                  <div key={i} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-14 w-14 shrink-0 rounded-xl border border-border object-cover"
                      />
                    ) : (
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary-soft text-primary">
                        <Package className="h-5 w-5" strokeWidth={1.5} />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-text-strong">{item.name}</p>
                      {joinMeta(item.category_label, item.quantity != null && `Qty ${item.quantity}`) ? (
                        <p className="mt-0.5 truncate text-xs text-muted">
                          {joinMeta(item.category_label, item.quantity != null && `Qty ${item.quantity}`)}
                        </p>
                      ) : null}
                      {canReturn && item.item_id ? (
                        <button
                          type="button"
                          onClick={() => {
                            setReturnForm({ reason: "", mode: "return" });
                            setActionState({ loading: false, error: "", success: "" });
                            setReturnModal(item);
                          }}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border-strong px-2.5 py-1 text-xs font-semibold text-muted transition hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        >
                          <PackageOpen className="h-3.5 w-3.5" /> Return / Replace
                        </button>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-sm font-bold text-text-strong">{formatCurrency(item.price)}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Live tracking activities */}
            {tracking?.tracking?.tracking_data?.shipment_track_activities && (
              <section className={CARD}>
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-subtle">
                  <Navigation className="h-4 w-4" aria-hidden="true" /> Tracking updates
                </h2>
                {(tracking?.tracking_summary?.current_status || tracking?.tracking_summary?.expected_delivery_date) && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {tracking.tracking_summary.current_status ? (
                      <div className="rounded-2xl border border-border bg-surface-muted/60 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">Current status</p>
                        <p className="mt-0.5 text-sm font-bold text-text-strong">{tracking.tracking_summary.current_status}</p>
                      </div>
                    ) : null}
                    {tracking.tracking_summary.expected_delivery_date ? (
                      <div className="rounded-2xl border border-border bg-surface-muted/60 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">Expected delivery</p>
                        <p className="mt-0.5 text-sm font-bold text-text-strong">{tracking.tracking_summary.expected_delivery_date}</p>
                      </div>
                    ) : null}
                  </div>
                )}
                <ol className="mt-4 space-y-0">
                  {tracking.tracking.tracking_data.shipment_track_activities.slice(0, 10).map((activity, i) => (
                    <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
                      {i < Math.min(9, tracking.tracking.tracking_data.shipment_track_activities.slice(0, 10).length - 1) && (
                        <div className="absolute left-[8px] top-5 h-full w-0.5 bg-border" />
                      )}
                      <div
                        className={`relative z-10 mt-1 h-[18px] w-[18px] shrink-0 rounded-full border-2 ${
                          i === 0 ? "border-transparent bg-primary" : "border-border-strong bg-surface"
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-strong">{activity["sr-status-label"] || activity.activity}</p>
                        {activity.location ? <p className="text-xs text-muted">{activity.location}</p> : null}
                        {formatDate(activity.date) ? <p className="text-xs text-subtle">{formatDate(activity.date)}</p> : null}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>

          {/* STICKY sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-24 self-start">
            {/* Order summary + primary actions */}
            <section className={CARD}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-subtle">Order summary</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Items ({itemCount})</dt>
                  <dd className="font-semibold text-text-strong">{formatCurrency(currentOrder.total_amount)}</dd>
                </div>
                {(Number(currentOrder.coupon_discount_paise) > 0 || currentOrder.coupon_free_shipping) && (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted">Coupon{currentOrder.coupon_code ? ` (${currentOrder.coupon_code})` : ""}</dt>
                    <dd className="font-semibold text-success">
                      {Number(currentOrder.coupon_discount_paise) > 0
                        ? `− ${formatCurrency(Number(currentOrder.coupon_discount_paise) / 100)}`
                        : "Free shipping"}
                    </dd>
                  </div>
                )}
              </dl>
              <div className="my-4 border-t border-dashed border-border" />
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-text-strong">Order total</span>
                <span className="text-xl font-bold text-text-strong">{formatCurrency(currentOrder.total_amount)}</span>
              </div>

              {/* Primary actions */}
              {hasActions ? (
                <div className="mt-5 space-y-2.5">
                  {canRetry && (
                    <button type="button" onClick={onRetryPayment} disabled={actionState.loading} className={CTA}>
                      <RefreshCw className={`h-4 w-4 ${actionState.loading ? "animate-spin" : ""}`} />
                      {actionState.loading ? "Please wait…" : "Retry payment"}
                    </button>
                  )}
                  {isPaid && (
                    <button type="button" onClick={downloadInvoice} disabled={invoiceLoading} className={BTN_OUTLINE}>
                      <Download className="h-4 w-4" /> {invoiceLoading ? "Preparing…" : "Download invoice"}
                    </button>
                  )}
                  {canRefund && (
                    <button type="button" onClick={onRequestRefund} disabled={actionState.loading} className={BTN_OUTLINE}>
                      <Receipt className="h-4 w-4" /> {actionState.loading ? "Please wait…" : "Request refund"}
                    </button>
                  )}
                  {canCancel && (
                    <button
                      type="button"
                      onClick={() => {
                        setCancelForm({ reason: "", details: "" });
                        setActionState({ loading: false, error: "", success: "" });
                        setCancelModal(true);
                      }}
                      disabled={actionState.loading}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-danger/30 bg-danger/5 px-5 py-3 text-sm font-semibold text-danger transition hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <XCircle className="h-4 w-4" /> Cancel order
                    </button>
                  )}
                </div>
              ) : null}

              {actionState.error ? (
                <p className={`${hasActions ? "mt-3" : "mt-5"} rounded-xl bg-danger/10 px-4 py-2.5 text-sm text-danger`}>{actionState.error}</p>
              ) : null}
              {actionState.success ? (
                <p className={`${hasActions ? "mt-3" : "mt-5"} rounded-xl bg-success/10 px-4 py-2.5 text-sm text-success`}>{actionState.success}</p>
              ) : null}
            </section>

            {/* Shipping address */}
            <SidebarCard title="Shipping address" icon={MapPin}>
              {currentOrder.shipping_address ? (
                <div className="space-y-1 text-sm text-muted">
                  {currentOrder.shipping_address.line1 && <p>{currentOrder.shipping_address.line1}</p>}
                  {currentOrder.shipping_address.line2 && <p>{currentOrder.shipping_address.line2}</p>}
                  {joinMeta(currentOrder.shipping_address.city, currentOrder.shipping_address.state) ? (
                    <p>{joinMeta(currentOrder.shipping_address.city, currentOrder.shipping_address.state)}</p>
                  ) : null}
                  {currentOrder.shipping_address.pincode && (
                    <p className="font-semibold text-text-strong">{currentOrder.shipping_address.pincode}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-subtle">Not provided</p>
              )}
            </SidebarCard>

            {/* Delivery date (Task 13) */}
            {(deliveredAt || expectedDelivery) && (
              <SidebarCard title="Delivery" icon={Truck}>
                {deliveredAt ? (
                  <InfoRow label="Delivered on" value={formatDateShort(deliveredAt)} accent />
                ) : (
                  <InfoRow label="Expected by" value={formatDateShort(expectedDelivery)} />
                )}
              </SidebarCard>
            )}

            {/* Shipment info */}
            {currentOrder.shipment && (
              <SidebarCard title="Shipment" icon={Package}>
                <div className="space-y-2.5">
                  {currentOrder.shipment.courier_name && (
                    <InfoRow label="Courier" value={currentOrder.shipment.courier_name} />
                  )}
                  {currentOrder.shipment.awb_code && (
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-muted">AWB</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(currentOrder.shipment.awb_code)}
                        aria-label="Copy AWB number"
                        className="inline-flex items-center gap-1.5 font-mono text-sm font-semibold text-primary transition hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        {currentOrder.shipment.awb_code} <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  {currentOrder.shipment.shipped_at && (
                    <InfoRow label="Shipped" value={formatDate(currentOrder.shipment.shipped_at)} />
                  )}
                  {currentOrder.shipment.tracking_url && (
                    <a
                      href={currentOrder.shipment.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${CTA} mt-3`}
                    >
                      Track on courier site
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </SidebarCard>
            )}
          </aside>
        </div>
      </div>

      {/* Return / replace modal (Task 7) */}
      {returnModal ? (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-text-strong/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Return or replace item"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setReturnModal(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-[0_24px_60px_rgba(15,23,42,0.18)]"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <PackageOpen className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-text-strong">Return or replace item</h3>
                <p className="line-clamp-1 text-xs text-muted">{returnModal.name}</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
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
                maxLength={1000}
                placeholder="What's the issue? (defective, wrong item, changed mind…)"
                className="w-full rounded-xl border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
              <p className="rounded-xl bg-surface-muted px-3.5 py-2.5 text-xs leading-5 text-muted">
                Defective / wrong items are free to return. Change-of-mind returns may charge reverse shipping before pickup.
              </p>
              {actionState.error ? <p className="rounded-xl bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{actionState.error}</p> : null}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReturnModal(null)}
                className="rounded-xl border border-border-strong px-4 py-2.5 text-sm font-semibold text-muted transition hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitReturn}
                disabled={actionState.loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(255,79,134,0.22)] transition hover:bg-primary-hover disabled:opacity-60"
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
          aria-label="Cancel order"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !actionState.loading) setCancelModal(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-[0_24px_60px_rgba(15,23,42,0.18)]"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger/10 text-danger">
                <XCircle className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-text-strong">Cancel this order?</h3>
                <p className="text-xs text-muted">
                  Order {currentOrder.order_number} · can&apos;t be undone.
                </p>
              </div>
            </div>

            <p className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wide text-subtle">Why are you cancelling?</p>
            <div className="space-y-2">
              {CANCEL_REASONS.map((r) => {
                const active = cancelForm.reason === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setCancelForm((f) => ({ ...f, reason: r }))}
                    className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition ${
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
              maxLength={1000}
              placeholder={cancelForm.reason === "Other" ? "Tell us more (required)" : "Add more details (optional)"}
              className="mt-3 w-full rounded-xl border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            />

            {isPaid ? (
              <p className="mt-3 rounded-xl bg-primary-soft px-3.5 py-2.5 text-xs text-primary">
                Your paid amount will be refunded to your MyShaadiStore wallet (store credit).
              </p>
            ) : null}
            {actionState.error ? <p className="mt-2 rounded-xl bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{actionState.error}</p> : null}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelModal(false)}
                disabled={actionState.loading}
                className="rounded-xl border border-border-strong px-4 py-2.5 text-sm font-semibold text-muted transition hover:bg-surface-muted disabled:opacity-60"
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
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-danger px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
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
