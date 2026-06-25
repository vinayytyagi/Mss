"use client";

import { useMemo, useSyncExternalStore } from "react";
import { trackEvent } from "./attribution";

const STORAGE_KEY = "mss_carts";
const CART_EVENT = "mss-cart-change";
const EMPTY_CARTS_RAW = JSON.stringify({ quotation: [], shopping: [] });

function readRawSnapshot() {
  if (typeof window === "undefined") return EMPTY_CARTS_RAW;
  try {
    return window.localStorage.getItem(STORAGE_KEY) || EMPTY_CARTS_RAW;
  } catch {
    return EMPTY_CARTS_RAW;
  }
}

function parseCarts(rawValue) {
  try {
    const parsed = JSON.parse(rawValue || EMPTY_CARTS_RAW);
    return {
      quotation: Array.isArray(parsed?.quotation) ? parsed.quotation : [],
      shopping: Array.isArray(parsed?.shopping) ? parsed.shopping : [],
    };
  } catch {
    return { quotation: [], shopping: [] };
  }
}

function emitCartChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CART_EVENT));
  }
}

function writeCarts(nextState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  emitCartChange();
}

function updateCartState(updater) {
  const current = parseCarts(readRawSnapshot());
  const next = updater(current);
  writeCarts({
    quotation: Array.isArray(next?.quotation) ? next.quotation : [],
    shopping: Array.isArray(next?.shopping) ? next.shopping : [],
  });
}

function normalizeCartItem(item, quantity = 1) {
  return {
    line_type: item.line_type || "product",
    item_id: item.item_id,
    variant_id: item.variant_id || "",
    variant_size: item.variant_size || item.size || "",
    variant_color: item.variant_color || item.color || "",
    variant_material: item.variant_material || item.material || "",
    name: item.name || "Untitled item",
    slug: item.slug || "",
    image: item.image || item.images?.[0] || "",
    images: Array.isArray(item.images) ? item.images : item.image ? [item.image] : [],
    quantity: Math.max(1, Number(quantity) || 1),
    price: Number(item.price) || 0,
    final_price: Number(item.final_price) || Number(item.price) || 0,
    is_discount_active: item.is_discount_active === true,
    discount_percentage: Number(item.discount_percentage) || 0,
    journey_step_id: item.journey_step_id || "",
    journey_title: item.journey_title || "",
    category_id: item.category_id || "",
    category_label: item.category_label || "",
    subcategory_id: item.subcategory_id || "",
    subcategory_label: item.subcategory_label || "",
    item_type: item.item_type || "Product",
    location: item.location || "",
    location_city: item.location_city || "",
    description: item.description || "",
    vendor_id: item.vendor_id || "",
    policies: item.policies || null,
    // Per-line event details captured at add time (decor → theme / colour /
    // notes). Null for plain product lines. Rides along to the backend.
    meta: item.meta && typeof item.meta === "object" ? item.meta : null,
    source: item.source || "catalog",
    added_at: new Date().toISOString(),
  };
}

function subscribe(callback) {
  if (typeof window === "undefined") return () => {};

  const onStorage = (event) => {
    if (!event.key || event.key === STORAGE_KEY) callback();
  };

  window.addEventListener(CART_EVENT, callback);
  window.addEventListener("storage", onStorage);
  window.addEventListener("focus", callback);

  return () => {
    window.removeEventListener(CART_EVENT, callback);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("focus", callback);
  };
}

export function useCartState() {
  const raw = useSyncExternalStore(subscribe, readRawSnapshot, () => EMPTY_CARTS_RAW);
  return useMemo(() => parseCarts(raw), [raw]);
}

export function useCartSummary() {
  const carts = useCartState();
  return useMemo(() => {
    const quotationCount = carts.quotation.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const shoppingCount = carts.shopping.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const shoppingTotal = carts.shopping.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.final_price) || Number(item.price) || 0),
      0
    );
    return {
      quotationCount,
      shoppingCount,
      totalCount: quotationCount + shoppingCount,
      shoppingTotal,
    };
  }, [carts]);
}

/**
 * Build a normalized PACKAGE quotation line from a TiersBuilder/SectionsBuilder
 * selection. Package lines carry `line_type:"package"` and a `selection` blob
 * (tier / addons / sections / details) instead of a vendor product. They reuse
 * the product-line fields the cart UI reads (`item_id`, `name`, `quantity`,
 * `price`/`final_price`) so the existing cart row + quotation submit pipeline
 * renders and ships them unchanged — the backend routes them by `line_type`.
 */
function normalizePackageLine(line) {
  const indicative = Number(line.indicative_total);
  const price = Number.isFinite(indicative) && indicative > 0 ? indicative : 0;
  // Stable synthetic id so cart keys, qty controls and remove() work. Packages
  // are always quantity 1, so a per-add timestamped id keeps duplicates distinct.
  const itemId = line.item_id || `pkg_${line.journey_slug || "step"}_${Date.now()}`;
  return {
    line_type: "package",
    item_id: itemId,
    journey_step_id: line.journey_step_id || "",
    journey_slug: line.journey_slug || "",
    journey_title: line.journey_title || line.package_title || "",
    mode_key: line.mode_key ?? null,
    package_title: line.package_title || "Custom package",
    name: line.package_title || "Custom package",
    image: line.image || "",
    images: [],
    selection: line.selection || {},
    indicative_total: price,
    price,
    final_price: price,
    is_discount_active: false,
    discount_percentage: 0,
    category_label: line.category_label || "Package",
    item_type: "Package",
    quantity: 1,
    source: "package-builder",
    added_at: new Date().toISOString(),
  };
}

export function addPackageToCart(line) {
  if (!line || !line.package_title) return;
  updateCartState((current) => ({
    ...current,
    quotation: [...current.quotation, normalizePackageLine(line)],
  }));
  trackEvent("add_to_cart", {
    cart: "quotation",
    line_type: "package",
    name: line.package_title,
    value: Number(line.indicative_total) || 0,
  });
}

export function addToCart(cartType, item, quantity = 1) {
  if (!item?.item_id || !["quotation", "shopping"].includes(cartType)) return;
  updateCartState((current) => {
    const list = [...current[cartType]];
    const normalized = normalizeCartItem(item, 1);
    const existingIndex = list.findIndex(
      (entry) => entry.item_id === normalized.item_id && String(entry.variant_id || "") === String(normalized.variant_id || ""),
    );
    if (existingIndex >= 0) {
      list[existingIndex] = {
        ...list[existingIndex],
        ...normalized,
        quantity: (Number(list[existingIndex].quantity) || 0) + Math.max(1, Number(quantity) || 1),
      };
    } else {
      list.push(normalizeCartItem(item, quantity));
    }
    return { ...current, [cartType]: list };
  });
  trackEvent("add_to_cart", {
    cart: cartType,
    item_id: item.item_id,
    name: item.name || "",
    value: Number(item.final_price) || Number(item.price) || 0,
    quantity: Math.max(1, Number(quantity) || 1),
  });
}

export function updateCartQuantity(cartType, itemId, quantity, variantId = "") {
  if (!["quotation", "shopping"].includes(cartType)) return;
  const nextQuantity = Math.max(1, Number(quantity) || 1);
  updateCartState((current) => ({
    ...current,
    [cartType]: current[cartType].map((item) =>
      item.item_id === itemId && String(item.variant_id || "") === String(variantId || "")
        ? { ...item, quantity: nextQuantity }
        : item
    ),
  }));
}

export function removeFromCart(cartType, itemId, variantId = "") {
  if (!["quotation", "shopping"].includes(cartType)) return;
  updateCartState((current) => ({
    ...current,
    [cartType]: current[cartType].filter(
      (item) => !(item.item_id === itemId && String(item.variant_id || "") === String(variantId || "")),
    ),
  }));
}

export function clearCart(cartType) {
  if (!["quotation", "shopping"].includes(cartType)) return;
  updateCartState((current) => ({ ...current, [cartType]: [] }));
}

export function clearAllCarts() {
  updateCartState(() => ({ quotation: [], shopping: [] }));
}

// ──────────────────────────────────────────────────────────────────────────
// Event date — required before anything can be added to the quote basket.
// Stored separately so it persists across the session and all journey steps.
// ──────────────────────────────────────────────────────────────────────────

const EVENT_DATE_KEY = "mss_event_date";
const EVENT_DATE_EVENT = "mss-event-date-change";

/** Read the saved wedding/event date (YYYY-MM-DD) or "" if none. */
export function getEventDate() {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(EVENT_DATE_KEY) || "";
  } catch {
    return "";
  }
}

/** Save the event date (pass "" to clear). Fires a change event. */
export function setEventDate(value) {
  if (typeof window === "undefined") return;
  try {
    const v = String(value || "").trim();
    if (v) window.localStorage.setItem(EVENT_DATE_KEY, v);
    else window.localStorage.removeItem(EVENT_DATE_KEY);
    window.dispatchEvent(new Event(EVENT_DATE_EVENT));
    emitCartChange();
  } catch {
    /* ignore */
  }
}

export function hasEventDate() {
  return Boolean(getEventDate());
}

function subscribeEventDate(callback) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT_DATE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT_DATE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/** Reactive hook for the saved event date. */
export function useEventDate() {
  return useSyncExternalStore(subscribeEventDate, getEventDate, () => "");
}
