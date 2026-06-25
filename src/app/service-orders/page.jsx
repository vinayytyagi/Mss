"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAuthToken } from "@/lib/authCookies";
import { fetchMyServiceOrders } from "@/lib/api";
import { formatCurrency } from "@/lib/shopUi";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  CalendarDays,
  ClipboardList,
  FileText,
  Layers,
  Lock,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from "lucide-react";

/* ── Shared shell tokens ─────────────────────────────── */
const HERO =
  "relative overflow-hidden rounded-xl border border-border bg-surface p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-8";

/* ── Date helpers ────────────────────────────────────── */
function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}
function formatDateShort(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/* ── Status tone (service-order domain) ──────────────── */
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

function StatusBadge({ status, label }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-3.5 py-1.5 text-xs font-bold capitalize ${tone(
        status
      )}`}
    >
      {label || String(status || "").replace(/_/g, " ")}
    </span>
  );
}

/* ── Page container — FULL WIDTH ─────────────────────── */
function PageContainer({ children }) {
  return (
    <main className="mx-auto w-full max-w-[1700px] px-4 py-8 sm:px-6 lg:px-10">
      <div className="space-y-6">{children}</div>
    </main>
  );
}

/* ── Hero stat tile ──────────────────────────────────── */
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

/* ── List skeleton (mirrors hero + full-width 2-col grid) ─ */
function ListSkeleton() {
  return (
    <PageContainer>
      {/* Hero band */}
      <div className={HERO}>
        <Skeleton className="h-4 w-28" />
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-2xl" />
            <Skeleton className="h-8 w-52" />
          </div>
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 min-w-[9rem] flex-1 rounded-2xl" />
          ))}
        </div>
      </div>
      {/* Cards — 2-col on xl */}
      <div className="grid gap-5 sm:grid-cols-1 xl:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-surface p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Skeleton className="h-8 w-36 rounded-xl" />
              <Skeleton className="h-8 w-24 rounded-xl" />
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-dashed border-border pt-5">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}

/* ── Empty / logged-out / error states ───────────────── */
function EmptyState({ icon: Icon = ShieldCheck, title, subtitle, ctaHref, ctaLabel, ctaIcon: CtaIcon = ArrowRight }) {
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
          {ctaLabel} <CtaIcon className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-danger/30 bg-danger/5 px-6 py-16 text-center shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <AlertCircle className="h-7 w-7" strokeWidth={1.75} />
      </span>
      <h3 className="mt-5 text-lg font-bold text-text-strong">Couldn&apos;t load your service orders</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border-strong bg-surface px-5 py-2.5 text-sm font-semibold text-text-strong transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
      ) : null}
    </div>
  );
}

export default function CustomerServiceOrdersPage() {
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggedOut, setLoggedOut] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setLoggedOut(true);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
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
  }, [reloadKey]);

  const list = Array.isArray(orders) ? orders : [];
  const count = list.length;

  // Hero stats derived from the loaded list.
  const activeCount = list.filter(
    (o) => !["completed", "cancelled", "delivered"].includes(String(o.status || "").toLowerCase())
  ).length;
  const totalCommitted = list.reduce((sum, o) => sum + (Number(o.quote_total) || 0), 0);
  const heroStats =
    !loading && !error && !loggedOut && count > 0
      ? [
          { icon: ClipboardList, label: "Requests", value: String(count) },
          { icon: Layers, label: "Active", value: String(activeCount) },
          totalCommitted > 0
            ? { icon: Wallet, label: "Quoted value", value: formatCurrency(totalCommitted) }
            : null,
        ].filter(Boolean)
      : [];

  if (loading) {
    return <ListSkeleton />;
  }

  return (
    <PageContainer>
      <>
          {/* HERO HEADER */}
          <header className={HERO}>
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
                  <p className="text-xs font-semibold uppercase tracking-wide text-subtle">Managed services</p>
                  <div className="mt-1.5 flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-accent text-primary-foreground shadow-[0_12px_24px_rgba(255,79,134,0.22)]">
                      <ShieldCheck className="h-6 w-6" strokeWidth={1.75} />
                    </span>
                    <h1 className="min-w-0 truncate text-2xl font-bold text-text-strong sm:text-3xl">
                      My service orders
                    </h1>
                  </div>
                  <p className="mt-3 max-w-xl text-sm text-muted">
                    {error
                      ? "Managed services we source and book on your behalf."
                      : count > 0
                      ? `${count} request${count === 1 ? "" : "s"} we're handling for you.`
                      : "Managed services we source and book on your behalf."}
                  </p>
                </div>
              </div>

              {heroStats.length ? (
                <div className="mt-6 flex flex-wrap gap-3">
                  {heroStats.map((s) => (
                    <StatTile key={s.label} icon={s.icon} label={s.label} value={s.value} />
                  ))}
                </div>
              ) : null}
            </div>
          </header>

          {/* BODY */}
          {loggedOut ? (
            <EmptyState
              icon={Lock}
              title="Please log in"
              subtitle="Log in to view the managed services we're sourcing and booking on your behalf."
              ctaHref="/login"
              ctaLabel="Log in"
            />
          ) : error ? (
            <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
          ) : count === 0 ? (
            <EmptyState
              title="No service orders yet"
              subtitle="Request a managed service and we'll source vendors and prepare quotes for you."
              ctaHref="/"
              ctaLabel="Explore services"
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-1 xl:grid-cols-2">
              {list.map((o) => {
                const awaitingQuote = o.quote_total == null;
                const dateLong = formatDate(o.event_date);
                const dateShort = formatDateShort(o.event_date);
                return (
                  <Link
                    key={o.order_id}
                    href={`/service-orders/${o.quotation_id}`}
                    className="group flex h-full flex-col rounded-xl border border-border bg-surface p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary-soft text-primary transition group-hover:border-primary/40">
                          <FileText className="h-5 w-5" strokeWidth={1.75} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold capitalize text-text-strong">
                            {o.service_type || "Service order"}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-subtle">{o.order_id}</p>
                        </div>
                      </div>
                      <StatusBadge status={o.status} label={o.status_label} />
                    </div>

                    <div className="flex-1">
                      {o.event_date || o.item_count != null ? (
                        <div className="mt-5 flex flex-wrap items-center gap-2.5">
                          {o.event_date ? (
                            <span className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-muted/60 px-3 py-1.5 text-xs font-medium text-muted-strong">
                              <CalendarDays className="h-3.5 w-3.5 text-subtle" />
                              <span className="hidden sm:inline">{dateLong}</span>
                              <span className="sm:hidden">{dateShort}</span>
                            </span>
                          ) : null}
                          {o.item_count != null ? (
                            <span className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-muted/60 px-3 py-1.5 text-xs font-medium text-muted-strong">
                              <Layers className="h-3.5 w-3.5 text-subtle" />
                              {o.item_count} item{o.item_count === 1 ? "" : "s"}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-dashed border-border pt-5">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">
                          {awaitingQuote ? "Quote" : "Quote total"}
                        </p>
                        <p
                          className={`mt-0.5 text-lg font-bold ${
                            awaitingQuote ? "text-muted" : "text-text-strong"
                          }`}
                        >
                          {awaitingQuote ? "Awaiting quote" : formatCurrency(o.quote_total)}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                        View
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
      </>
    </PageContainer>
  );
}
