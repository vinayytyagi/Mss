"use client";

import { useState } from "react";
import Link from "next/link";
import { trackOrder } from "@/lib/api";
import { statusTone, statusLabel, ORDER_STEPS, getOrderStepIndex } from "@/lib/orderStatusUi";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Check,
  Clock,
  MapPin,
  Package,
  PackageSearch,
  Search,
  ShieldCheck,
  Truck,
  XCircle,
} from "lucide-react";

/* ── Shared shell constants ─────────────────────────── */
const CARD = "rounded-xl border border-border bg-surface p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]";
const joinMeta = (...parts) => parts.filter((p) => p != null && String(p).trim() !== "").join(" · ");

/* ── Helpers ────────────────────────────────────────── */
function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function formatShortDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status, fallback }) {
  const label = status || fallback;
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold capitalize ${statusTone(label)}`}>
      {statusLabel(label)}
    </span>
  );
}

/* ── Hero stat tile (wraps on mobile) ───────────────── */
function StatTile({ icon: Icon, label, value, mono }) {
  return (
    <div className="flex min-w-[9rem] flex-1 items-center gap-3 rounded-2xl border border-border bg-surface-muted/60 px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">{label}</p>
        <p className={`truncate text-sm font-bold ${mono ? "font-mono text-primary" : "text-text-strong"}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

/* ── Horizontal delivery stepper ────────────────────── */
function HorizontalStepper({ steps, currentIndex }) {
  return (
    <section className={CARD}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-subtle">Delivery progress</h2>
      <ol className="mt-6 flex min-w-max gap-0 overflow-x-auto pb-2 sm:min-w-0">
        {steps.map((step, i) => {
          const done = i < currentIndex;
          const current = i === currentIndex;
          return (
            <li
              key={step.key}
              className="flex flex-1 flex-col items-center text-center"
              style={{ minWidth: "5.5rem" }}
            >
              <div className="flex w-full items-center">
                <span
                  className={`h-0.5 flex-1 ${
                    i === 0 ? "opacity-0" : done || current ? "bg-success" : "bg-border"
                  }`}
                />
                <span
                  className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                    done
                      ? "bg-success text-primary-foreground"
                      : current
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-surface-muted text-subtle"
                  }`}
                >
                  {current ? (
                    <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
                  ) : null}
                  {done ? (
                    <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
                  ) : current ? (
                    <Clock className="relative h-4 w-4" aria-hidden="true" />
                  ) : (
                    <span className="relative">{i + 1}</span>
                  )}
                </span>
                <span
                  className={`h-0.5 flex-1 ${
                    i === steps.length - 1 ? "opacity-0" : done ? "bg-success" : "bg-border"
                  }`}
                />
              </div>
              <p className={`mt-2 px-1 text-xs font-semibold ${done || current ? "text-text-strong" : "text-subtle"}`}>
                {step.label}
              </p>
              {step.at ? <p className="mt-0.5 text-[11px] text-muted">{step.at}</p> : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ── Fact tile (shipment summary rail) ──────────────── */
function FactTile({ icon: Icon, label, value, mono }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-muted/60 px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">{label}</p>
        <p className={`truncate text-sm font-bold ${mono ? "font-mono text-primary" : "text-text-strong"}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

/* ── Result skeleton (mirrors full-width two-column result) ── */
function ResultSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      {/* Hero result band */}
      <div className={CARD + " sm:p-8"}>
        <Skeleton className="h-3.5 w-24" />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-2xl" />
            <Skeleton className="h-7 w-56" />
          </div>
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 min-w-[9rem] flex-1 rounded-2xl" />
          ))}
        </div>
      </div>
      {/* Two-column: wide main + rail */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0 space-y-6">
          <Skeleton className="h-28 rounded-xl" />
          <div className={CARD}>
            <Skeleton className="h-3.5 w-32" />
            <div className="mt-5 space-y-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ────────────────────────────────── */
export default function TrackOrderClient({ initialOrders = [], initialPhone = "" }) {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState(initialPhone);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState("");

  async function runTracking(targetOrderNumber, targetPhone) {
    if (!targetOrderNumber.trim() || !targetPhone.trim()) {
      setError("Please enter both order number and phone number");
      return;
    }

    setError("");
    setNotFound(false);
    setResult(null);
    setLoading(true);

    try {
      const data = await trackOrder(targetOrderNumber.trim(), targetPhone.trim());
      setResult(data);
    } catch (err) {
      setNotFound(true);
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

  const stepIndex = result ? getOrderStepIndex(result) : 0;
  const isCancelled = result && (result.status === "Cancelled" || result.status === "Failed");
  const orderPlaced = formatShortDate(result?.created_at);
  const fieldError = Boolean(error) && !notFound;

  const inputBase =
    "h-12 w-full rounded-xl border bg-surface px-4 text-sm font-medium text-text outline-none transition placeholder:text-subtle focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15";

  const activities = result?.tracking?.tracking_data?.shipment_track_activities;
  const hasMain = result && (!isCancelled || (activities && activities.length));
  const hasRail = result && (result.shipment || result.tracking_summary);

  /* Rail: shipment / courier details + tracking action */
  const railContent = result && hasRail ? (
    <>
      {result.shipment && (
        <section className={CARD}>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-subtle">Shipment details</h2>
          <div className="mt-4 space-y-3">
            {result.shipment.courier_name && (
              <FactTile icon={Truck} label="Courier" value={result.shipment.courier_name} />
            )}
            {result.shipment.awb_code && (
              <FactTile icon={PackageSearch} label="AWB code" value={result.shipment.awb_code} mono />
            )}
            {result.shipment.shipped_at && (
              <FactTile icon={Clock} label="Shipped at" value={formatDate(result.shipment.shipped_at)} />
            )}
            {result.tracking_summary?.current_status && (
              <FactTile icon={PackageSearch} label="Current status" value={result.tracking_summary.current_status} />
            )}
            {result.tracking_summary?.expected_delivery_date && (
              <FactTile
                icon={MapPin}
                label="Expected delivery"
                value={result.tracking_summary.expected_delivery_date}
              />
            )}
          </div>

          {result.shipment.tracking_url && (
            <a
              href={result.shipment.tracking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(255,79,134,0.22)] transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Track on courier website
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          )}
        </section>
      )}

      {!result.shipment && result.tracking_summary && (
        <section className={CARD}>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-subtle">Shipment summary</h2>
          <div className="mt-4 space-y-3">
            {result.tracking_summary.current_status && (
              <FactTile icon={PackageSearch} label="Current status" value={result.tracking_summary.current_status} />
            )}
            {result.tracking_summary.expected_delivery_date && (
              <FactTile
                icon={MapPin}
                label="Expected delivery"
                value={result.tracking_summary.expected_delivery_date}
              />
            )}
          </div>
        </section>
      )}

      <section className={CARD}>
        <p className="flex items-center gap-2 text-sm font-semibold text-text-strong">
          <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" />
          Need help with this order?
        </p>
        <p className="mt-1.5 text-xs text-muted">
          Tracking another order? Update the lookup above and search again.
        </p>
      </section>
    </>
  ) : null;

  return (
    <main className="mx-auto w-full max-w-[1700px] px-4 py-8 sm:px-6 lg:px-10">
      <div className="space-y-6">
        {/* Hero header */}
        <header className="relative overflow-hidden rounded-xl border border-border bg-surface p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-linear-to-b from-primary-soft to-transparent opacity-70"
          />
          <div className="relative">
            <Link
              href="/orders"
              className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to my orders
            </Link>
            <div className="mt-5 flex flex-col items-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary-accent text-primary-foreground shadow-[0_12px_24px_rgba(255,79,134,0.22)]">
                <Truck className="h-7 w-7" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-subtle">Order tracking</p>
              <h1 className="mt-1.5 text-2xl font-bold text-text-strong sm:text-3xl">Track your order</h1>
              <p className="mt-2 max-w-md text-sm text-muted">
                Enter your order number and registered phone number to see the live delivery status.
              </p>
            </div>
          </div>
        </header>

        {/* Centered lookup card (intentionally narrower for usability) */}
        <form onSubmit={handleTrack} className={CARD + " sm:p-8"}>
          <div className="mx-auto max-w-2xl">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="track-order-number"
                  className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-subtle"
                >
                  Order number
                </label>
                <input
                  id="track-order-number"
                  type="text"
                  value={orderNumber}
                  onChange={(e) => {
                    setOrderNumber(e.target.value);
                    if (error) setError("");
                    if (notFound) setNotFound(false);
                  }}
                  placeholder="e.g. MSS-123456-ABCD"
                  aria-invalid={fieldError && !orderNumber.trim()}
                  className={`${inputBase} ${
                    fieldError && !orderNumber.trim() ? "border-danger/50" : "border-border-strong"
                  }`}
                />
              </div>
              <div>
                <label
                  htmlFor="track-phone"
                  className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-subtle"
                >
                  Phone number
                </label>
                <input
                  id="track-phone"
                  type="tel"
                  inputMode="numeric"
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setPhone(val);
                    if (error) setError("");
                    if (notFound) setNotFound(false);
                  }}
                  placeholder="e.g. 9876543210"
                  maxLength={10}
                  aria-invalid={fieldError && !phone.trim()}
                  className={`${inputBase} ${
                    fieldError && !phone.trim() ? "border-danger/50" : "border-border-strong"
                  }`}
                />
              </div>
            </div>

            {error && !notFound && (
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(255,79,134,0.22)] transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
                    aria-hidden="true"
                  />
                  Searching…
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" aria-hidden="true" /> Track order
                </>
              )}
            </button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-medium text-subtle">
              <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden="true" />
              No login needed — your details stay private.
            </p>
          </div>
        </form>

        {/* My Orders Quick Track */}
        {initialOrders.length > 0 && (
          <section className={CARD + " sm:p-8"}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-text-strong">Your recent orders</h2>
                <p className="mt-0.5 text-sm text-muted">Track with one click using your registered phone number.</p>
              </div>
              <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-muted">
                {initialOrders.length} order{initialOrders.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-1 xl:grid-cols-2">
              {initialOrders.slice(0, 6).map((order) => {
                const active = selectedOrderNumber === order.order_number;
                const placed = formatShortDate(order.created_at);
                return (
                  <div
                    key={order._id || order.order_number}
                    className={`flex h-full flex-col rounded-2xl border p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] ${
                      active
                        ? "border-primary/40 bg-primary-soft/50 ring-1 ring-primary/20"
                        : "border-border bg-surface-muted/50"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                          <Package className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">Order number</p>
                          <p className="truncate text-sm font-bold text-text-strong">{order.order_number}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={order.status} fallback="Pending" />
                        <StatusBadge status={order.fulfillment_status} fallback="Unfulfilled" />
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                      <p className="text-xs text-muted">{joinMeta(placed && `Placed on ${placed}`)}</p>
                      <button
                        type="button"
                        onClick={() => handleQuickTrack(order)}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Track this order
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Loading skeleton (mirrors result layout) */}
        {loading && <ResultSkeleton />}

        {/* Not-found / error state */}
        {notFound && !loading && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-danger/30 bg-danger/5 px-6 py-16 text-center shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 text-danger">
              <AlertCircle className="h-7 w-7" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-lg font-bold text-text-strong">We couldn’t find that order</h3>
            <p className="mt-1.5 max-w-sm text-sm text-muted">
              {error || "Please double-check your order number and registered phone number, then try again."}
            </p>
          </div>
        )}

        {/* Results — full-width two-column layout */}
        {result && !loading && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Result hero band */}
            <header className="relative overflow-hidden rounded-xl border border-border bg-surface p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-8">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-linear-to-b from-primary-soft to-transparent opacity-70"
              />
              <div className="relative flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">Order</p>
                  <div className="mt-1.5 flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary-accent text-primary-foreground shadow-[0_12px_24px_rgba(255,79,134,0.22)]">
                      <Package className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
                    </span>
                    <h2 className="min-w-0 truncate text-2xl font-bold text-text-strong sm:text-3xl">
                      {result.order_number}
                    </h2>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={result.status} />
                  <StatusBadge status={result.fulfillment_status} fallback="Unfulfilled" />
                </div>
              </div>

              {/* Stat row */}
              <div className="relative mt-6 flex flex-wrap gap-3">
                {orderPlaced ? <StatTile icon={Clock} label="Placed on" value={orderPlaced} /> : null}
                {result.shipment?.courier_name ? (
                  <StatTile icon={Truck} label="Courier" value={result.shipment.courier_name} />
                ) : null}
                {result.shipment?.awb_code ? (
                  <StatTile icon={PackageSearch} label="AWB code" value={result.shipment.awb_code} mono />
                ) : null}
                {result.tracking_summary?.expected_delivery_date ? (
                  <StatTile
                    icon={MapPin}
                    label="Expected delivery"
                    value={result.tracking_summary.expected_delivery_date}
                  />
                ) : null}
              </div>

              {isCancelled && (
                <div className="relative mt-6 flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-semibold text-danger">
                  <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  This order has been {result.status.toLowerCase()}.
                </div>
              )}

              {result.message && !result.shipment && (
                <p className="relative mt-6 flex items-start gap-2 rounded-xl bg-primary-soft/50 px-4 py-3 text-sm font-medium text-primary">
                  <PackageSearch className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{result.message}</span>
                </p>
              )}
            </header>

            {/* Two-column: wide main (stepper + timeline) + sticky rail (shipment) */}
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
              <div className="min-w-0 space-y-6">
                {/* Delivery stepper */}
                {!isCancelled && <HorizontalStepper steps={ORDER_STEPS} currentIndex={stepIndex} />}

                {/* Live tracking timeline */}
                {activities && activities.length ? (
                  <section className={CARD + " sm:p-8"}>
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-subtle">Tracking updates</h2>
                    <ol className="mt-5 space-y-0">
                      {activities.map((activity, i, arr) => {
                        const when = formatDate(activity.date);
                        return (
                          <li key={i} className="relative flex gap-3 pb-5 last:pb-0">
                            {i < arr.length - 1 && (
                              <span
                                className="absolute left-[11px] top-6 h-full w-0.5 bg-border"
                                aria-hidden="true"
                              />
                            )}
                            <span
                              className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                                i === 0 ? "bg-primary text-primary-foreground" : "border-2 border-border-strong bg-surface"
                              }`}
                            >
                              {i === 0 ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" /> : null}
                            </span>
                            <div className="min-w-0">
                              <p className={`text-sm font-semibold ${i === 0 ? "text-text-strong" : "text-text"}`}>
                                {activity["sr-status-label"] || activity.activity}
                              </p>
                              {joinMeta(activity.location, when) ? (
                                <p className="mt-0.5 text-xs text-muted">{joinMeta(activity.location, when)}</p>
                              ) : null}
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </section>
                ) : null}

                {/* Fallback when there's no main content to fill the column */}
                {!hasMain && (
                  <section className={CARD + " sm:p-8"}>
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                        <PackageSearch className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
                      </span>
                      <h3 className="mt-4 text-base font-bold text-text-strong">No delivery updates yet</h3>
                      <p className="mt-1.5 max-w-sm text-sm text-muted">
                        We&rsquo;ll show live tracking activity here as soon as your courier shares an update.
                      </p>
                    </div>
                  </section>
                )}
              </div>

              {/* Sticky summary rail */}
              <aside className="space-y-6 self-start lg:sticky lg:top-24">
                {railContent || (
                  <section className={CARD}>
                    <p className="flex items-center gap-2 text-sm font-semibold text-text-strong">
                      <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" />
                      Order located
                    </p>
                    <p className="mt-1.5 text-xs text-muted">
                      Shipment details will appear here once your order has been dispatched.
                    </p>
                  </section>
                )}
              </aside>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
