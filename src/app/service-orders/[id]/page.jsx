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
import { ArrowLeft, Check, Clock, FileText, ShieldCheck, Store, Truck } from "lucide-react";

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

export default function CustomerServiceOrderDetailPage() {
  const params = useParams();
  const id = params?.id;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");
  const [actionError, setActionError] = useState("");

  async function load(token, signal) {
    const res = await fetchMyServiceOrder(token, id);
    if (!signal?.aborted) setData(res?.service_order || null);
  }

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setError("Please log in to view this service order.");
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
      await approveServiceQuote(token, id);
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

  const lines = Array.isArray(data?.lines) ? data.lines : [];
  const advance = data?.advance || null;
  const balance = data?.balance || null;
  const isQuoteReady = data?.status === "quote_ready";
  const showDelivery =
    data?.status === "delivered" ||
    (data?.status !== "completed" && lines.some((l) => l?.delivered_at));

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to profile
      </Link>

      {loading ? (
        <div className="mt-6 flex justify-center py-20">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-danger/30 bg-danger/5 px-6 py-10 text-center text-sm text-danger">
          {error}
        </div>
      ) : !data ? (
        <div className="mt-6 rounded-2xl border border-border bg-surface px-6 py-10 text-center text-sm text-muted">
          Service order not found.
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {/* Header */}
          <div className="rounded-3xl border border-border bg-surface p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h1 className="text-lg font-semibold capitalize text-text-strong">{data.service_type || "Service order"}</h1>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {data.order_id}
                  {data.event_city ? ` · ${data.event_city}` : ""}
                  {data.event_date ? ` · ${formatDate(data.event_date)}` : ""}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_TONE[data.status] || "bg-surface-muted text-muted"}`}
              >
                {data.status_label || data.status}
              </span>
            </div>
            {data.guest_count ? (
              <p className="mt-3 text-xs text-muted">Guests: <span className="font-semibold text-text-strong">{data.guest_count}</span></p>
            ) : null}
            {data.special_requirements ? (
              <p className="mt-2 rounded-xl bg-surface-muted px-3.5 py-3 text-sm text-muted">{data.special_requirements}</p>
            ) : null}
          </div>

          {actionError ? (
            <div className="rounded-2xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{actionError}</div>
          ) : null}

          {/* Progress timeline */}
          <div className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-subtle">Progress</h2>
            <ol className="mt-4 space-y-4">
              {(data.timeline || []).map((step) => (
                <li key={step.key} className="flex gap-3">
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      step.done
                        ? "bg-success text-primary-foreground"
                        : step.current
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-muted text-subtle"
                    }`}
                  >
                    {step.done ? (
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    ) : step.current ? (
                      <Clock className="h-3.5 w-3.5" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-subtle" />
                    )}
                  </span>
                  <div>
                    <p className={`text-sm font-semibold ${step.done || step.current ? "text-text-strong" : "text-subtle"}`}>
                      {step.label}
                    </p>
                    {step.at ? <p className="text-xs text-muted">{formatDate(step.at)}</p> : null}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Compiled quote — line items */}
          {lines.length > 0 ? (
            <div className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-subtle">
                {data.quote_finalized ? "Your quote" : "Your requested services"}
              </h2>
              <div className="mt-4 divide-y divide-border">
                {lines.map((line) => (
                  <div
                    key={line.item_id}
                    className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text-strong">{line.name}</p>
                      <p className="text-xs text-muted">
                        {line.category_label || "—"}
                        {line.quantity != null ? ` · ×${line.quantity}` : ""}
                        {line.is_indicative ? " · indicative" : ""}
                      </p>
                      {line.vendor?.business_name ? (
                        <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-primary">
                          <Store className="h-3 w-3" /> {line.vendor.business_name}
                        </p>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-text-strong">
                      {Number(line.line_total) > 0 ? formatCurrency(line.line_total) : "—"}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
                <span className="text-sm font-semibold text-text-strong">
                  {data.quote_finalized ? "Total" : "Indicative total"}
                </span>
                <span className="text-xl font-bold text-text-strong">{formatCurrency(data.quote_total)}</span>
              </div>

              {isQuoteReady ? (
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={actionId === "approve"}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(255,79,134,0.22)] transition hover:bg-primary-hover disabled:opacity-60"
                  >
                    {actionId === "approve" ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Approve quote
                  </button>
                  <p className="mt-2 text-center text-xs text-muted">
                    Approving locks in this quote and starts your booking.
                  </p>
                </div>
              ) : data.approved_at ? (
                <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-success">
                  <Check className="h-4 w-4" strokeWidth={3} /> Approved on {formatDate(data.approved_at)}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Payment */}
          {advance || (balance && balance.amount > 0) ? (
            <div className="rounded-3xl border border-primary/30 bg-primary-soft/40 p-5 sm:p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">Payment</h2>

              {/* Advance */}
              {advance && advance.status === "due" && advance.payment_url ? (
                <a
                  href={advance.payment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(255,79,134,0.22)] transition hover:bg-primary-hover"
                >
                  <ShieldCheck className="h-4 w-4" /> Pay advance ({formatCurrency(advance.amount)}
                  {advance.pct != null ? `, ${advance.pct}%` : ""})
                </a>
              ) : advance && advance.status === "paid" ? (
                <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-success">
                  <Check className="h-4 w-4" strokeWidth={3} /> Advance paid
                  {advance.paid_at ? ` on ${formatDate(advance.paid_at)}` : ""}
                </p>
              ) : null}

              {/* Balance */}
              {balance && balance.status === "paid" ? (
                <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-success">
                  <Check className="h-4 w-4" strokeWidth={3} /> Fully paid
                </p>
              ) : balance && balance.amount > 0 ? (
                <div className="mt-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted">Balance due</span>
                    <span className="text-base font-bold text-text-strong">{formatCurrency(balance.amount)}</span>
                  </div>
                  {balance.payment_url ? (
                    <a
                      href={balance.payment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(255,79,134,0.22)] transition hover:bg-primary-hover"
                    >
                      <ShieldCheck className="h-4 w-4" /> Pay balance ({formatCurrency(balance.amount)})
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={handleBalanceLink}
                      disabled={actionId === "balance"}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(255,79,134,0.22)] transition hover:bg-primary-hover disabled:opacity-60"
                    >
                      {actionId === "balance" ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )}
                      Pay balance ({formatCurrency(balance.amount)})
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Delivery */}
          {showDelivery ? (
            <div className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-subtle">Delivery</h2>
              <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-text-strong">
                <Truck className="h-4 w-4 text-primary" /> Your order has been delivered.
              </p>
              <button
                type="button"
                onClick={handleConfirmDelivery}
                disabled={actionId === "confirm"}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-success px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-success/90 disabled:opacity-60"
              >
                {actionId === "confirm" ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Confirm you&apos;re satisfied
              </button>
            </div>
          ) : null}
        </div>
      )}
    </main>
  );
}
