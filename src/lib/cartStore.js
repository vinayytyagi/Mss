"use client";

import { useMemo, useSyncExternalStore } from "react";

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
    item_id: item.item_id,
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

export function addToCart(cartType, item, quantity = 1) {
  if (!item?.item_id || !["quotation", "shopping"].includes(cartType)) return;
  updateCartState((current) => {
    const list = [...current[cartType]];
    const existingIndex = list.findIndex((entry) => entry.item_id === item.item_id);
    if (existingIndex >= 0) {
      list[existingIndex] = {
        ...list[existingIndex],
        ...normalizeCartItem(item, 1),
        quantity: (Number(list[existingIndex].quantity) || 0) + Math.max(1, Number(quantity) || 1),
      };
    } else {
      list.push(normalizeCartItem(item, quantity));
    }
    return { ...current, [cartType]: list };
  });
}

export function updateCartQuantity(cartType, itemId, quantity) {
  if (!["quotation", "shopping"].includes(cartType)) return;
  const nextQuantity = Math.max(1, Number(quantity) || 1);
  updateCartState((current) => ({
    ...current,
    [cartType]: current[cartType].map((item) =>
      item.item_id === itemId ? { ...item, quantity: nextQuantity } : item
    ),
  }));
}

export function removeFromCart(cartType, itemId) {
  if (!["quotation", "shopping"].includes(cartType)) return;
  updateCartState((current) => ({
    ...current,
    [cartType]: current[cartType].filter((item) => item.item_id !== itemId),
  }));
}

export function clearCart(cartType) {
  if (!["quotation", "shopping"].includes(cartType)) return;
  updateCartState((current) => ({ ...current, [cartType]: [] }));
}

export function clearAllCarts() {
  updateCartState(() => ({ quotation: [], shopping: [] }));
}
