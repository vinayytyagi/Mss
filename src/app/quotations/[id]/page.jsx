"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getAuthToken } from "@/lib/authCookies";
import { fetchMyQuotation } from "@/lib/api";
import { formatCurrency } from "@/lib/shopUi";
import { ArrowLeft, Check, Clock, Receipt, ShieldCheck, Store } from "lucide-react";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

const STATUS_TONE = {
  in_review: "bg-warning/15 text-warning-strong",
  quote_ready: "bg-primary-soft text-primary",
  paid: "bg-success/10 text-success",
  cancelled: "bg-danger/10 text-danger",
};

export default function CustomerQuotationDetailPage() {
  const params = useParams();
  const id = params?.id;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setError("Please log in to view this quotation.");
      setLoading(false);
      return;
    }
    if (!id) return;
    let active = true;
    (async () => {
      try {
        const res = await fetchMyQuotation(token, id);
        if (active) setData(res);
      } catch (e) {
        if (active) setError(e?.message || "Couldn't load this quotation.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const isReady = data?.status === "quote_ready" || data?.status === "paid";

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
          Quotation not found.
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {/* Header */}
          <div className="rounded-3xl border border-border bg-surface p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  <h1 className="text-lg font-semibold text-text-strong">Quotation</h1>
                </div>
                <p className="mt-1 text-xs text-muted">
                  Submitted {formatDate(data.created_at)} · {data.item_count} item{data.item_count === 1 ? "" : "s"}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_TONE[data.status] || "bg-surface-muted text-muted"}`}
              >
                {data.status_label}
              </span>
            </div>
          </div>

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

          {/* Final quote */}
          {isReady ? (
            <div className="rounded-3xl border border-primary/30 bg-primary-soft/40 p-5 sm:p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">Your quote</h2>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-sm text-muted">Total payable</span>
                <span className="text-2xl font-bold text-text-strong">{formatCurrency(data.final_total || 0)}</span>
              </div>
              {data.final_message ? (
                <p className="mt-3 rounded-xl bg-surface px-3.5 py-3 text-sm text-muted">{data.final_message}</p>
              ) : null}
              {data.status === "quote_ready" && data.payment_url ? (
                <a
                  href={data.payment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(255,79,134,0.22)] transition hover:bg-primary-hover"
                >
                  <ShieldCheck className="h-4 w-4" /> Pay {formatCurrency(data.final_total || 0)}
                </a>
              ) : null}
              {data.status === "paid" ? (
                <p className="mt-3 text-sm font-semibold text-success">Paid on {formatDate(data.paid_at)} — thank you!</p>
              ) : null}
            </div>
          ) : null}

          {/* Items */}
          <div className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-subtle">Items</h2>
            <div className="mt-3 divide-y divide-border">
              {(data.items || []).map((it) => (
                <div key={it.item_id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-strong">{it.name}</p>
                    <p className="text-xs text-muted">
                      {it.journey_title || it.category_label || "—"} · Qty {it.quantity}
                    </p>
                    {it.vendor?.business_name ? (
                      <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-primary">
                        <Store className="h-3 w-3" /> {it.vendor.business_name}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-text-strong">{formatCurrency(it.final_price)}</span>
                </div>
              ))}
            </div>
            {!isReady ? (
              <p className="mt-3 text-xs text-muted">
                Prices shown are indicative. We&apos;ll send your final quote once vendors confirm.
              </p>
            ) : null}
          </div>
        </div>
      )}
    </main>
  );
}
