"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthUser } from "@/lib/authCookies";
import { formatCurrency } from "@/lib/shopUi";
import {
  statusTone,
  statusLabel,
  ORDER_STEPS,
  getOrderStepIndex,
} from "@/lib/orderStatusUi";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  IndianRupee,
  Lock,
  MapPin,
  Package,
  PackageOpen,
  ShoppingBag,
  Truck,
} from "lucide-react";

/* ── Shared shells / tokens ────────────────────────────── */
const CARD =
  "rounded-xl border border-border bg-surface p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]";

/* ── Full-width page container (headline rule) ─────────── */
function PageContainer({ children }) {
  return (
    <main className="mx-auto w-full max-w-[1700px] px-4 py-8 sm:px-6 lg:px-10">
      <div className="space-y-6">{children}</div>
    </main>
  );
}

// Join only non-empty meta parts with " · " — NEVER renders a bare dash.
const joinMeta = (...parts) =>
  parts.filter((p) => p != null && String(p).trim() !== "").join(" · ");

/* ── Date helper (returns null when empty so it can be omitted) ── */
function formatDateShort(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// Task 13 — derive a delivery line (delivered date wins, else expected ETA).
function deliveryLine(order) {
  const ship =
    order.shipment ||
    (Array.isArray(order.sub_orders) ? order.sub_orders.map((s) => s?.shipment).find(Boolean) : null);
  const delivered = order.delivered_at || ship?.delivered_at;
  const expected = ship?.expected_delivery_date;
  if (delivered) return { label: "Delivered", value: delivered };
  if (expected) return { label: "Expected by", value: expected };
  return null;
}

/* ── Status badge (shared tone + label) ────────────────── */
function StatusBadge({ status, icon: Icon }) {
  if (!status) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold capitalize ${statusTone(status)}`}
    >
      {Icon ? <Icon className="h-3 w-3" strokeWidth={2.25} /> : null}
      {statusLabel(status)}
    </span>
  );
}

/* ── Compact horizontal stepper (Placed → … → Delivered) ── */
function MiniStepper({ currentIndex }) {
  return (
    <ol className="flex items-center gap-0">
      {ORDER_STEPS.map((step, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        return (
          <li key={step.key} className="flex min-w-0 flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <span
                className={`h-0.5 flex-1 rounded-full ${
                  i === 0 ? "opacity-0" : done || current ? "bg-success" : "bg-border"
                }`}
              />
              <span
                className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition ${
                  done
                    ? "bg-success text-primary-foreground"
                    : current
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-surface-muted text-subtle"
                }`}
              >
                {current ? (
                  <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
                ) : null}
                {done ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                ) : (
                  <span className="relative">{i + 1}</span>
                )}
              </span>
              <span
                className={`h-0.5 flex-1 rounded-full ${
                  i === ORDER_STEPS.length - 1 ? "opacity-0" : done ? "bg-success" : "bg-border"
                }`}
              />
            </div>
            <p
              className={`mt-1.5 truncate px-1 text-[11px] font-semibold ${
                done || current ? "text-text-strong" : "text-subtle"
              }`}
            >
              {step.label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

/* ── A single metadata cell (total / date / courier / eta) ─ */
function MetaCell({ icon: Icon, label, value, strong }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          strong ? "bg-primary-soft text-primary" : "bg-surface-muted text-muted"
        }`}
      >
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">{label}</p>
        <p
          className={`truncate text-sm font-bold ${strong ? "text-text-strong" : "text-muted-strong"}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/* ── StatTile (hero stat row) ──────────────────────────── */
function StatTile({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-muted/60 px-4 py-3">
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

/* ── Hero header (band + title + status-agnostic stat row + Track CTA) ── */
function HeroHeader({ count, showTrack = true, stats = [] }) {
  return (
    <header className="relative overflow-hidden rounded-xl border border-border bg-surface p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-gradient-to-b from-primary-soft to-transparent opacity-70"
      />
      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-subtle">My account</p>
            <div className="mt-1.5 flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-accent text-primary-foreground shadow-[0_12px_24px_rgba(255,79,134,0.22)]">
                <ShoppingBag className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <h1 className="min-w-0 truncate text-2xl font-bold text-text-strong sm:text-3xl">
                My Orders
              </h1>
            </div>
            <p className="mt-2 text-sm text-muted">
              {count != null
                ? `${count} shopping order${count !== 1 ? "s" : ""}`
                : "Your shopping purchases"}
            </p>
          </div>
          {showTrack ? (
            <Link
              href="/orders/track-order"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border-strong bg-surface px-4 py-2.5 text-sm font-semibold text-text-strong transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Truck className="h-4 w-4" />
              Track an order
            </Link>
          ) : null}
        </div>

        {stats.length ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {stats.map((s) => (
              <StatTile key={s.label} icon={s.icon} label={s.label} value={s.value} />
            ))}
          </div>
        ) : null}
      </div>
    </header>
  );
}

/* ── Order card ────────────────────────────────────────── */
function OrderCard({ order }) {
  const items = Array.isArray(order.items) ? order.items : [];
  const itemCount = items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0) || items.length;
  const preview = items.slice(0, 4);
  const extra = items.length - preview.length;
  const dl = deliveryLine(order);
  const stepIndex = getOrderStepIndex(order);
  const placedOn = formatDateShort(order.created_at);
  const ff = String(order.fulfillment_status || "").toLowerCase();

  return (
    <Link
      href={`/orders/${order._id}`}
      aria-label={`View order ${order.order_number}`}
      className="group flex h-full flex-col rounded-xl border border-border bg-surface p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {/* Top row — order id + statuses */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">Order</p>
          <p className="truncate text-lg font-bold text-text-strong">{order.order_number}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <StatusBadge status={order.status} />
          {order.fulfillment_status ? (
            <StatusBadge
              status={order.fulfillment_status}
              icon={ff === "shipped" ? Truck : ff === "delivered" ? PackageOpen : Package}
            />
          ) : null}
          {order.refund?.status ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
              Refund: {statusLabel(order.refund.status)}
            </span>
          ) : null}
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="mt-5 flex items-center gap-2.5">
        {preview.length > 0 ? (
          preview.map((item, i) => (
            <div key={i} className="shrink-0">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image}
                  alt={item.name || "Item"}
                  className="h-16 w-16 rounded-2xl border border-border object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary-soft text-base font-bold text-primary">
                  {item.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-surface-muted text-subtle">
            <Package className="h-6 w-6" strokeWidth={1.5} />
          </div>
        )}
        {extra > 0 ? (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-dashed border-border-strong bg-surface-muted text-xs font-bold text-muted-strong">
            +{extra}
          </div>
        ) : null}
        <span className="ml-1 hidden text-xs font-semibold text-muted sm:inline">
          {itemCount} item{itemCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Mini delivery progress */}
      <div className="mt-6 rounded-2xl border border-border bg-surface-muted/40 px-4 py-4">
        <MiniStepper currentIndex={stepIndex} />
      </div>

      {/* Bottom row — meta + CTA */}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
        <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-4 sm:flex sm:flex-wrap sm:items-center sm:gap-7">
          <MetaCell icon={IndianRupee} label="Total" value={formatCurrency(order.total_amount)} strong />
          {placedOn ? <MetaCell icon={CalendarDays} label="Placed on" value={placedOn} /> : null}
          {order.shipment?.courier_name ? (
            <MetaCell icon={Truck} label="Courier" value={order.shipment.courier_name} />
          ) : null}
          {dl && formatDateShort(dl.value) ? (
            <MetaCell icon={MapPin} label={dl.label} value={formatDateShort(dl.value)} />
          ) : null}
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary-soft px-4 py-2 text-sm font-semibold text-primary transition group-hover:gap-2.5">
          View details
          <ChevronRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

/* ── EmptyState / ErrorState ───────────────────────────── */
function EmptyState({ icon: Icon = ShoppingBag, title, subtitle, ctaHref, ctaLabel }) {
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
          {ctaLabel} <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

function ErrorState({ title = "Something went wrong", message }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-danger/30 bg-danger/5 px-6 py-16 text-center shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <AlertCircle className="h-7 w-7" strokeWidth={1.75} />
      </span>
      <h3 className="mt-5 text-lg font-bold text-text-strong">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted">{message}</p>
      <Link
        href="/orders"
        className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border-strong bg-surface px-5 py-2.5 text-sm font-semibold text-text-strong transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        Try again
      </Link>
    </div>
  );
}

/* ── Loading skeleton (mirrors hero + cards) ───────────── */
function OrderCardSkeleton() {
  return (
    <div className={CARD}>
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="mt-5 flex gap-2.5">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-16 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="mt-6 h-16 rounded-2xl" />
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-5">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <PageContainer>
      <div className="rounded-xl border border-border bg-surface p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Skeleton className="h-3 w-24" />
            <div className="mt-4 flex items-center gap-3">
              <Skeleton className="h-11 w-11 rounded-2xl" />
              <Skeleton className="h-8 w-48" />
            </div>
          </div>
          <Skeleton className="h-11 w-36 rounded-xl" />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-1 xl:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <OrderCardSkeleton key={i} />
        ))}
      </div>
    </PageContainer>
  );
}

/* ── Main component ────────────────────────────────────── */
export default function MyOrdersClient({ initialOrders = [], initialError = "", hasServerSession = false }) {
  const user = useAuthUser();
  const [orders] = useState(initialOrders);
  const [loading] = useState(false);
  const [error] = useState(initialError);

  /* Not logged in */
  if (!user && !hasServerSession) {
    return (
      <PageContainer>
        <HeroHeader showTrack={false} />
        <EmptyState
          icon={Lock}
          title="Log in to view your orders"
          subtitle="Sign in to track shipments, view invoices and reorder your favourites."
          ctaHref="/login"
          ctaLabel="Log in"
        />
      </PageContainer>
    );
  }

  /* Loading skeleton */
  if (loading) {
    return <ListSkeleton />;
  }

  /* Error */
  if (error) {
    return (
      <PageContainer>
        <HeroHeader showTrack={false} />
        <ErrorState message={error} />
      </PageContainer>
    );
  }

  /* Empty */
  if (orders.length === 0) {
    return (
      <PageContainer>
        <HeroHeader count={0} />
        <EmptyState
          title="No orders yet"
          subtitle="Your purchases will appear here once you place your first order."
          ctaHref="/"
          ctaLabel="Start shopping"
        />
      </PageContainer>
    );
  }

  /* Stat row — derived summary across all orders */
  const totalSpent = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const inTransit = orders.filter((o) => {
    const ff = String(o.fulfillment_status || "").toLowerCase();
    const st = String(o.status || "").toLowerCase();
    return ff === "shipped" || st === "shipped" || st === "out_for_delivery" || st === "in_transit";
  }).length;

  const stats = [
    { icon: ShoppingBag, label: "Orders", value: String(orders.length) },
    { icon: IndianRupee, label: "Total spent", value: formatCurrency(totalSpent) },
    { icon: Truck, label: "In transit", value: String(inTransit) },
  ];

  /* Order list */
  return (
    <PageContainer>
      <HeroHeader count={orders.length} stats={stats} />
      <div className="grid gap-5 sm:grid-cols-1 xl:grid-cols-2">
        {orders.map((order) => (
          <OrderCard key={order._id} order={order} />
        ))}
      </div>
    </PageContainer>
  );
}
