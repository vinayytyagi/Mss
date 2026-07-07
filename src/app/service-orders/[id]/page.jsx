"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getAuthToken } from "@/lib/authCookies";
import {
  fetchMyServiceOrder,
  approveServiceQuote,
  confirmServiceDelivery,
  getServiceBalanceLink,
} from "@/lib/api";
import { formatCurrency } from "@/lib/shopUi";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Check,
  Clock,
  FileText,
  Lock,
  MapPin,
  Package,
  ReceiptText,
  ShieldCheck,
  Store,
  Truck,
  Users,
  Wallet,
} from "lucide-react";

/* ── Shared constants ────────────────────────────────────── */
const CARD =
  "rounded-xl border border-border bg-surface p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]";

// Join only non-empty meta parts with " · " — NEVER renders a bare dash.
const joinMeta = (...parts) =>
  parts.filter((p) => p != null && String(p).trim() !== "").join(" · ");

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* ── Service-status tone map (own domain vocabulary) ─────── */
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

function tone(status) {
  return STATUS_TONE[String(status || "").toLowerCase()] || "bg-surface-muted text-muted";
}

function statusText(status) {
  return String(status || "")
    .replace(/_/g, " ")
    .trim();
}

/* ── Stat tile ───────────────────────────────────────────── */
function StatTile({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-[9rem] flex-1 items-center gap-3 rounded-2xl border border-border bg-surface-muted/60 px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">{label}</p>
        <p className="truncate text-sm font-bold text-text-strong">{value}</p>
      </div>
    </div>
  );
}

/* ── Hero header ─────────────────────────────────────────── */
function HeroHeader({ data, stats }) {
  return (
    <header className="relative overflow-hidden rounded-xl border border-border bg-surface p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-gradient-to-b from-primary-soft to-transparent opacity-70"
      />
      <div className="relative">
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ArrowLeft className="h-4 w-4" /> Back to profile
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {data.order_id ? (
              <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
                Order {data.order_id}
              </p>
            ) : null}
            <div className="mt-1.5 flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-accent text-primary-foreground shadow-[0_12px_24px_rgba(255,79,134,0.22)]">
                <FileText className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <h1 className="min-w-0 truncate text-2xl font-bold capitalize text-text-strong sm:text-3xl">
                {data.service_type || "Service order"}
              </h1>
            </div>
          </div>
          <span
            className={`inline-flex shrink-0 items-center rounded-full px-3.5 py-1.5 text-xs font-bold capitalize ${tone(
              data.status
            )}`}
          >
            {data.status_label || statusText(data.status)}
          </span>
        </div>

        {stats.length ? (
          <div className="mt-6 flex flex-wrap gap-3">
            {stats.map((s) => (
              <StatTile key={s.label} icon={s.icon} label={s.label} value={s.value} />
            ))}
          </div>
        ) : null}

        {data.special_requirements ? (
          <div className="mt-4 rounded-2xl border border-border bg-surface-muted/60 px-4 py-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">
              Special requirements
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-strong">
              {data.special_requirements}
            </p>
          </div>
        ) : null}
      </div>
    </header>
  );
}

/* ── Horizontal stepper (service timeline) ───────────────── */
function HorizontalStepper({ steps, currentIndex }) {
  return (
    <section className={CARD}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-subtle">Progress</h2>
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
                  className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                    done
                      ? "bg-success text-primary-foreground"
                      : current
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-surface-muted text-subtle"
                  }`}
                >
                  {current ? (
                    <span
                      aria-hidden
                      className="absolute inset-0 animate-ping rounded-full bg-primary/30"
                    />
                  ) : null}
                  {done ? (
                    <Check className="h-4 w-4" strokeWidth={3} />
                  ) : current ? (
                    <Clock className="relative h-4 w-4" />
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
              <p
                className={`mt-2 px-1 text-xs font-semibold ${
                  done || current ? "text-text-strong" : "text-subtle"
                }`}
              >
                {step.label}
              </p>
              {step.at ? (
                <p className="mt-0.5 text-[11px] text-muted">{formatDate(step.at)}</p>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ── Empty / error / logged-out states ───────────────────── */
function EmptyState({ icon: Icon = FileText, title, subtitle, ctaHref, ctaLabel }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface px-6 py-16 text-center shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-soft to-primary-soft/40 text-primary">
        <Icon className="h-7 w-7" strokeWidth={1.75} />
      </span>
      <h3 className="mt-5 text-lg font-bold text-text-strong">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted">{subtitle}</p>
      {ctaHref ? (
        <Link
          href={ctaHref}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(255,79,134,0.22)] transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}

function ErrorState({ icon: Icon = AlertCircle, title = "Something went wrong", message }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-danger/30 bg-danger/5 px-6 py-16 text-center shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <Icon className="h-7 w-7" strokeWidth={1.75} />
      </span>
      <h3 className="mt-5 text-lg font-bold text-text-strong">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted">{message}</p>
    </div>
  );
}

/* ── Spinner (preserved for in-button loading) ───────────── */
function Spinner({ className = "h-4 w-4" }) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-primary-foreground border-t-transparent ${className}`}
    />
  );
}

/* ── Loading skeleton — mirrors the detail layout ─────────── */
function DetailSkeleton() {
  return (
    <main className="mx-auto w-full max-w-[1700px] px-4 py-8 sm:px-6 lg:px-10">
      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-surface p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-8">
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
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="min-w-0 space-y-6">
            <div className="rounded-xl border border-border bg-surface p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
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
            <Skeleton className="h-28 rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-44 rounded-xl" />
            <Skeleton className="h-36 rounded-xl" />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CustomerServiceOrderDetailPage() {
  const params = useParams();
  const id = params?.id;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggedOut, setLoggedOut] = useState(false);
  const [actionId, setActionId] = useState("");
  const [payChoice, setPayChoice] = useState("advance"); // "advance" | "full"
  const [actionError, setActionError] = useState("");

  async function load(token, signal) {
    const res = await fetchMyServiceOrder(token, id);
    if (!signal?.aborted) setData(res?.service_order || null);
  }

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setLoggedOut(true);
      setLoading(false);
      return;
    }
    if (!id) return;
    const controller = { aborted: false };
    (async () => {
      try {
        await load(token, controller);
      } catch (e) {
        if (!controller.aborted) setError(e?.message || "Couldn't load this service order.");
      } finally {
        if (!controller.aborted) setLoading(false);
      }
    })();
    return () => {
      controller.aborted = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function refetch() {
    const token = getAuthToken();
    if (!token) return;
    try {
      await load(token, null);
    } catch (e) {
      setActionError(e?.message || "Couldn't refresh this service order.");
    }
  }

  async function handleApprove() {
    const token = getAuthToken();
    if (!token) return;
    setActionError("");
    setActionId("approve");
    try {
      // payChoice: "advance" → pay the configured advance %; "full" → 100% upfront.
      const advancePct = payChoice === "full" ? 100 : undefined;
      await approveServiceQuote(token, id, { advancePct });
      await refetch();
    } catch (e) {
      setActionError(e?.message || "Couldn't approve this quote.");
    } finally {
      setActionId("");
    }
  }

  async function handleConfirmDelivery() {
    const token = getAuthToken();
    if (!token) return;
    setActionError("");
    setActionId("confirm");
    try {
      await confirmServiceDelivery(token, id);
      await refetch();
    } catch (e) {
      setActionError(e?.message || "Couldn't confirm delivery.");
    } finally {
      setActionId("");
    }
  }

  async function handleBalanceLink() {
    const token = getAuthToken();
    if (!token) return;
    setActionError("");
    setActionId("balance");
    try {
      const res = await getServiceBalanceLink(token, id);
      if (res?.payment_url) {
        window.open(res.payment_url, "_blank", "noopener,noreferrer");
      }
      await refetch();
    } catch (e) {
      setActionError(e?.message || "Couldn't generate a payment link.");
    } finally {
      setActionId("");
    }
  }

  /* ── First-paint loading ── */
  if (loading) return <DetailSkeleton />;

  /* ── Logged-out ── */
  if (loggedOut) {
    return (
      <main className="mx-auto w-full max-w-[1700px] px-4 py-8 sm:px-6 lg:px-10">
        <EmptyState
          icon={Lock}
          title="Please log in"
          subtitle="You need to be signed in to view this service order."
          ctaHref="/login"
          ctaLabel="Log in"
        />
      </main>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <main className="mx-auto w-full max-w-[1700px] px-4 py-8 sm:px-6 lg:px-10">
        <ErrorState title="Couldn't load this order" message={error} />
      </main>
    );
  }

  /* ── Not found ── */
  if (!data) {
    return (
      <main className="mx-auto w-full max-w-[1700px] px-4 py-8 sm:px-6 lg:px-10">
        <EmptyState
          icon={FileText}
          title="Service order not found"
          subtitle="We couldn't find this service order. It may have been removed or the link is incorrect."
          ctaHref="/profile"
          ctaLabel="Back to profile"
        />
      </main>
    );
  }

  /* ── Derived view-model (logic preserved verbatim) ── */
  const lines = Array.isArray(data?.lines) ? data.lines : [];
  const advance = data?.advance || null;
  const balance = data?.balance || null;
  const isQuoteReady = data?.status === "quote_ready";
  const showDelivery =
    data?.status === "delivered" ||
    (data?.status !== "completed" && lines.some((l) => l?.delivered_at));
  const hasPayment = advance || (balance && balance.amount > 0);
  const balancePaid = balance && balance.status === "paid";

  const timeline = Array.isArray(data?.timeline) ? data.timeline : [];
  // currentIndex = the current step; fallback to last-done + 1.
  let currentIndex = timeline.findIndex((s) => s?.current);
  if (currentIndex === -1) {
    const lastDone = timeline.reduce((acc, s, i) => (s?.done ? i : acc), -1);
    currentIndex = lastDone + 1;
  }

  // Hero stat row — build only from present values.
  const stats = [];
  if (data.event_city) stats.push({ icon: MapPin, label: "Event city", value: data.event_city });
  if (data.event_date)
    stats.push({ icon: CalendarDays, label: "Event date", value: formatDate(data.event_date) });
  if (lines.length)
    stats.push({
      icon: Package,
      label: "Items",
      value: `${lines.length} ${lines.length === 1 ? "service" : "services"}`,
    });
  if (data.guest_count)
    stats.push({ icon: Users, label: "Guests", value: `${data.guest_count}` });
  if (Number(data.quote_total) > 0)
    stats.push({ icon: ReceiptText, label: "Total", value: formatCurrency(data.quote_total) });
  const heroStats = stats.slice(0, 4);

  return (
    <main className="mx-auto w-full max-w-[1700px] px-4 py-8 sm:px-6 lg:px-10">
      <div className="space-y-6">
        <HeroHeader data={data} stats={heroStats} />

        {actionError ? (
          <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
            {actionError}
          </p>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
          {/* ── Main column ── */}
          <div className="min-w-0 space-y-6">
            {timeline.length ? (
              <HorizontalStepper steps={timeline} currentIndex={currentIndex} />
            ) : null}

            {/* Compiled quote — line items */}
            {lines.length > 0 ? (
              <section className={CARD}>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-subtle">
                    {data.quote_finalized ? "Your quote" : "Your requested services"}
                  </h2>
                  {data.quote_finalized ? null : (
                    <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-[11px] font-semibold text-warning-strong">
                      Indicative
                    </span>
                  )}
                </div>

                <div className="mt-5 divide-y divide-border">
                  {lines.map((line) => {
                    const meta = joinMeta(
                      line.category_label,
                      line.quantity != null ? `×${line.quantity}` : null,
                      line.is_indicative ? "indicative" : null
                    );
                    return (
                      <div
                        key={line.item_id}
                        className="flex items-start gap-4 py-4 first:pt-0 last:pb-0"
                      >
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary-soft text-primary">
                          <Package className="h-5 w-5" strokeWidth={1.5} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-text-strong">
                            {line.name}
                          </p>
                          {meta ? (
                            <p className="mt-0.5 truncate text-xs text-muted">{meta}</p>
                          ) : null}
                          {line.vendor?.business_name ? (
                            <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary">
                              <Store className="h-3 w-3" /> {line.vendor.business_name}
                            </p>
                          ) : null}
                        </div>
                        {Number(line.line_total) > 0 ? (
                          <span className="shrink-0 text-sm font-bold text-text-strong">
                            {formatCurrency(line.line_total)}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                <div className="my-5 border-t border-dashed border-border" />
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-text-strong">
                    {data.quote_finalized ? "Total" : "Indicative total"}
                  </span>
                  <span className="text-xl font-bold text-text-strong">
                    {formatCurrency(data.quote_total)}
                  </span>
                </div>

                {isQuoteReady ? (
                  <div className="mt-5">
                    {/* Payment choice — pay the configured advance %, or 100% upfront. */}
                    {(() => {
                      const total = Number(data.quote_total) || 0;
                      const advPct = Number(data.advance?.pct) || 0;
                      const advAmt = Number(data.advance?.amount) || Math.round((total * advPct) / 100);
                      const opts = [];
                      if (advPct > 0 && advPct < 100 && advAmt > 0) {
                        opts.push({
                          key: "advance",
                          title: `Pay ${advPct}% advance now`,
                          sub: `${formatCurrency(advAmt)} now · ${formatCurrency(Math.max(0, total - advAmt))} before the event`,
                        });
                      }
                      opts.push({
                        key: "full",
                        title: "Pay full amount now",
                        sub: `${formatCurrency(total)} · nothing left to pay later`,
                      });
                      if (opts.length < 2) return null; // only one way to pay → no choice needed
                      return (
                        <div className="mb-4 space-y-2">
                          {opts.map((o) => (
                            <button
                              key={o.key}
                              type="button"
                              onClick={() => setPayChoice(o.key)}
                              className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${
                                payChoice === o.key
                                  ? "border-primary bg-primary-soft/60"
                                  : "border-border-strong bg-surface hover:border-primary/40"
                              }`}
                            >
                              <span
                                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                                  payChoice === o.key ? "border-primary" : "border-border-strong"
                                }`}
                              >
                                {payChoice === o.key ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
                              </span>
                              <span className="min-w-0">
                                <span className="block text-sm font-semibold text-text-strong">{o.title}</span>
                                <span className="block text-xs text-muted">{o.sub}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={actionId === "approve"}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(255,79,134,0.22)] transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {actionId === "approve" ? <Spinner /> : <Check className="h-4 w-4" />}
                      Approve quote
                    </button>
                    <p className="mt-2 text-center text-xs text-muted">
                      Approving locks in this quote and starts your booking.
                    </p>
                  </div>
                ) : data.approved_at ? (
                  <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-success/10 px-3.5 py-2 text-sm font-semibold text-success">
                    <Check className="h-4 w-4" strokeWidth={3} /> Approved on{" "}
                    {formatDate(data.approved_at)}
                  </div>
                ) : null}
              </section>
            ) : null}

            {/* Delivery */}
            {showDelivery ? (
              <section className={CARD}>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-subtle">
                  Delivery
                </h2>
                <div className="mt-4 flex items-start gap-3 rounded-2xl bg-success/10 px-4 py-3.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success text-primary-foreground">
                    <Truck className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-strong">
                      Your order has been delivered.
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      Confirm once everything looks great to complete this booking.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleConfirmDelivery}
                  disabled={actionId === "confirm"}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-success px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-success/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionId === "confirm" ? <Spinner /> : <Check className="h-4 w-4" />}
                  Confirm you&apos;re satisfied
                </button>
              </section>
            ) : null}
          </div>

          {/* ── Sticky summary sidebar ── */}
          <aside className="space-y-6 self-start lg:sticky lg:top-24">
            {/* Order summary */}
            <section className={CARD}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-subtle">
                Order summary
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                {data.order_id ? (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted">Order ID</dt>
                    <dd className="truncate font-semibold text-text-strong">{data.order_id}</dd>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Status</dt>
                  <dd>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${tone(
                        data.status
                      )}`}
                    >
                      {data.status_label || statusText(data.status)}
                    </span>
                  </dd>
                </div>
                {data.event_city ? (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted">Event city</dt>
                    <dd className="truncate font-semibold text-text-strong">{data.event_city}</dd>
                  </div>
                ) : null}
                {data.event_date ? (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted">Event date</dt>
                    <dd className="truncate font-semibold text-text-strong">
                      {formatDate(data.event_date)}
                    </dd>
                  </div>
                ) : null}
                {data.guest_count ? (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted">Guests</dt>
                    <dd className="font-semibold text-text-strong">{data.guest_count}</dd>
                  </div>
                ) : null}
                {lines.length ? (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted">Services</dt>
                    <dd className="font-semibold text-text-strong">{lines.length}</dd>
                  </div>
                ) : null}
              </dl>
              {Number(data.quote_total) > 0 ? (
                <>
                  <div className="my-4 border-t border-dashed border-border" />
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold text-text-strong">
                      {data.quote_finalized ? "Total" : "Indicative total"}
                    </span>
                    <span className="text-xl font-bold text-text-strong">
                      {formatCurrency(data.quote_total)}
                    </span>
                  </div>
                </>
              ) : null}
            </section>

            {/* Payment */}
            {hasPayment ? (
              <section className="rounded-xl border border-primary/30 bg-primary-soft/40 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary">
                  <Wallet className="h-4 w-4" /> Payment
                </h2>

                <div className="mt-4 space-y-3">
                  {/* Advance */}
                  {advance && advance.status === "due" && advance.payment_url ? (
                    <a
                      href={advance.payment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(255,79,134,0.22)] transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <ShieldCheck className="h-4 w-4" /> Pay advance ({formatCurrency(advance.amount)}
                      {advance.pct != null ? `, ${advance.pct}%` : ""})
                    </a>
                  ) : advance && advance.status === "paid" ? (
                    <div className="inline-flex w-full items-center gap-2 rounded-xl bg-success/10 px-3.5 py-2.5 text-sm font-semibold text-success">
                      <Check className="h-4 w-4" strokeWidth={3} /> Advance paid
                      {advance.paid_at ? ` on ${formatDate(advance.paid_at)}` : ""}
                    </div>
                  ) : null}

                  {/* Balance */}
                  {balancePaid ? (
                    <div className="inline-flex w-full items-center gap-2 rounded-xl bg-success/10 px-3.5 py-2.5 text-sm font-semibold text-success">
                      <Check className="h-4 w-4" strokeWidth={3} /> Fully paid
                    </div>
                  ) : balance && balance.amount > 0 ? (
                    <div>
                      <div className="flex items-baseline justify-between rounded-xl bg-surface px-3.5 py-2.5">
                        <span className="text-sm text-muted">Balance due</span>
                        <span className="text-base font-bold text-text-strong">
                          {formatCurrency(balance.amount)}
                        </span>
                      </div>
                      {balance.payment_url ? (
                        <a
                          href={balance.payment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(255,79,134,0.22)] transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                          <ShieldCheck className="h-4 w-4" /> Pay balance ({formatCurrency(balance.amount)})
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={handleBalanceLink}
                          disabled={actionId === "balance"}
                          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(255,79,134,0.22)] transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actionId === "balance" ? <Spinner /> : <ShieldCheck className="h-4 w-4" />}
                          Pay balance ({formatCurrency(balance.amount)})
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>

                <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-medium text-subtle">
                  <ShieldCheck className="h-3.5 w-3.5 text-success" /> Secured payments · UPI, cards
                  &amp; net-banking
                </p>
              </section>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}
