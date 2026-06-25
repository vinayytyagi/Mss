// Shared order-status UI helpers for the shopping order pages
// (list / detail / track). Plain helpers — no JSX. Keeping the tone map,
// label formatter and the 4-step delivery tracker source in one place so the
// SAME status renders the SAME color and the tracker behaves identically
// across MyOrdersClient, OrderDetailClient and TrackOrderClient.
//
// NOTE: the service-order domain (src/app/service-orders/*) uses a different
// status vocabulary and is intentionally NOT covered here.

/* ── Status tone ──────────────────────────────────────────
 * Semantics:
 *   success (green)   = done / paid
 *   primary (info)    = in-transit / informational
 *   warning (amber)   = in-progress / needs-action
 *   danger            = bad / terminal
 *   neutral           = unknown
 */
const STATUS_TONE = {
  // success — done / paid
  delivered: "bg-success/10 text-success",
  completed: "bg-success/10 text-success",
  paid: "bg-success/10 text-success",
  fully_paid: "bg-success/10 text-success",

  // primary — in-transit / informational
  confirmed: "bg-primary-soft text-primary",
  shipped: "bg-primary-soft text-primary",
  out_for_delivery: "bg-primary-soft text-primary",
  in_transit: "bg-primary-soft text-primary",
  processing: "bg-primary-soft text-primary",

  // primary — refund / return informational states
  refunded: "bg-primary-soft text-primary",
  partially_refunded: "bg-primary-soft text-primary",
  return_requested: "bg-primary-soft text-primary",
  returned: "bg-primary-soft text-primary",

  // warning — in-progress / needs-action
  pending: "bg-warning/15 text-warning-strong",
  placed: "bg-warning/15 text-warning-strong",
  unfulfilled: "bg-warning/15 text-warning-strong",
  partially_fulfilled: "bg-warning/15 text-warning-strong",
  awaiting_payment: "bg-warning/15 text-warning-strong",
  sourcing: "bg-warning/15 text-warning-strong",
  packed: "bg-warning/15 text-warning-strong",
  received: "bg-warning/15 text-warning-strong",

  // danger — bad / terminal
  cancelled: "bg-danger/10 text-danger",
  canceled: "bg-danger/10 text-danger",
  failed: "bg-danger/10 text-danger",
  payment_failed: "bg-danger/10 text-danger",
};

function normalizeStatus(status) {
  return String(status || "")
    .toLowerCase()
    .replace(/\s+/g, "_");
}

// Tailwind class string for a status badge, e.g. "bg-success/10 text-success".
export function statusTone(status) {
  return STATUS_TONE[normalizeStatus(status)] || "bg-surface-muted text-muted";
}

// Human label: strip underscores and Title-Case each word so both lowercase
// keys ("out_for_delivery") and already-capitalized values ("Delivered")
// render consistently ("Out For Delivery" / "Delivered").
export function statusLabel(status) {
  return String(status || "")
    .replace(/_/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/* ── Delivery progress tracker ────────────────────────────
 * 4-step tracker: Placed → Confirmed → Shipped → Delivered.
 * getStepIndex logic ported verbatim from the detail/track pages.
 */
export const ORDER_STEPS = [
  { key: "placed", label: "Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

export function getOrderStepIndex(order) {
  const status = order?.status;
  const fulfillment = order?.fulfillment_status;
  if (fulfillment === "Delivered" || status === "Delivered") return 3;
  if (fulfillment === "Shipped" || status === "Shipped") return 2;
  if (status === "Paid" || status === "Confirmed") return 1;
  return 0;
}
