"use client";

/**
 * wishlistStore — persistent favourites (heart icon) store.
 *
 * Modelled after `cartStore.js` (same useSyncExternalStore pattern,
 * same window-event broadcast so other tabs / components stay in
 * lockstep), but kept entirely independent: adding to wishlist does
 * NOT add to cart and vice-versa.
 *
 * Two buckets — intentionally NOT merged:
 *   - "journey"  → items hearted from a `/journey/[step]` page
 *   - "shopping" → items hearted from `/shopping` or `/shopping/[itemId]`
 *
 * NOTE: this store is PURE — it does not call sonner / toast on its
 * own. The calling component owns the user-facing toast so we can
 * vary wording per surface ("Saved to favourites" vs "Removed").
 */

import { useMemo, useSyncExternalStore } from "react";

const STORAGE_KEY = "mss_wishlist_v1";
const WISHLIST_EVENT = "mss-wishlist-change";
const EMPTY_RAW = JSON.stringify({ journey: [], shopping: [] });

const VALID_KINDS = ["journey", "shopping"];

function readRawSnapshot() {
  if (typeof window === "undefined") return EMPTY_RAW;
  try {
    return window.localStorage.getItem(STORAGE_KEY) || EMPTY_RAW;
  } catch {
    return EMPTY_RAW;
  }
}

function parseWishlist(rawValue) {
  try {
    const parsed = JSON.parse(rawValue || EMPTY_RAW);
    return {
      journey: Array.isArray(parsed?.journey) ? parsed.journey : [],
      shopping: Array.isArray(parsed?.shopping) ? parsed.shopping : [],
    };
  } catch {
    return { journey: [], shopping: [] };
  }
}

function emitChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(WISHLIST_EVENT));
  }
}

function writeWishlist(nextState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  emitChange();
}

function updateWishlistState(updater) {
  const current = parseWishlist(readRawSnapshot());
  const next = updater(current);
  writeWishlist({
    journey: Array.isArray(next?.journey) ? next.journey : [],
    shopping: Array.isArray(next?.shopping) ? next.shopping : [],
  });
}

// Snapshot just enough of an item to render an ItemCardV2 without
// re-fetching from /api/v1/items. Mirrors the shape ItemCardV2 reads.
function normalizeWishlistItem(item) {
  return {
    item_id: item.item_id,
    name: item.name || "Untitled item",
    slug: item.slug || "",
    images: Array.isArray(item.images)
      ? item.images
      : item.image
        ? [item.image]
        : [],
    price: Number(item.price) || 0,
    final_price: Number(item.final_price) || Number(item.price) || 0,
    discount_percentage: Number(item.discount_percentage) || 0,
    is_discount_active: item.is_discount_active === true,
    vendor_business_name: item.vendor_business_name || item.vendor_name || "",
    vendor_id: item.vendor_id || "",
    journey_step_id: item.journey_step_id || "",
    journey_title: item.journey_title || "",
    category_id: item.category_id || "",
    category_label: item.category_label || "",
    subcategory_id: item.subcategory_id || "",
    subcategory_label: item.subcategory_label || "",
    sub_subcategory_id: item.sub_subcategory_id || "",
    location_city: item.location_city || "",
    location_state: item.location_state || "",
    attributes: item.attributes && typeof item.attributes === "object" ? item.attributes : {},
    item_type: item.item_type || "Product",
    stock_status: item.stock_status || "",
    policies: item.policies || null,
    added_at: new Date().toISOString(),
  };
}

function subscribe(callback) {
  if (typeof window === "undefined") return () => {};

  const onStorage = (event) => {
    if (!event.key || event.key === STORAGE_KEY) callback();
  };

  window.addEventListener(WISHLIST_EVENT, callback);
  window.addEventListener("storage", onStorage);
  window.addEventListener("focus", callback);

  return () => {
    window.removeEventListener(WISHLIST_EVENT, callback);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("focus", callback);
  };
}

export function useWishlistState() {
  const raw = useSyncExternalStore(subscribe, readRawSnapshot, () => EMPTY_RAW);
  return useMemo(() => parseWishlist(raw), [raw]);
}

export function useIsWishlisted(kind, itemId) {
  const state = useWishlistState();
  return useMemo(() => {
    if (!VALID_KINDS.includes(kind) || !itemId) return false;
    return state[kind].some((entry) => entry.item_id === itemId);
  }, [state, kind, itemId]);
}

/**
 * Add an item to the wishlist for the given kind.
 *
 * NOTE: this function is PURE — it does NOT show a toast. The calling
 * component (ItemCardV2 / ProductDetailPage / FavouritesPage) owns the
 * sonner toast so we can vary wording per surface.
 */
export function addToWishlist(kind, item) {
  if (!item?.item_id || !VALID_KINDS.includes(kind)) return;
  updateWishlistState((current) => {
    const list = current[kind];
    if (list.some((entry) => entry.item_id === item.item_id)) {
      // Already wishlisted — no-op (dedupe by item_id).
      return current;
    }
    return { ...current, [kind]: [...list, normalizeWishlistItem(item)] };
  });
}

/**
 * Remove an item from the wishlist for the given kind.
 *
 * NOTE: pure — toast is owned by the caller. See `addToWishlist`.
 */
export function removeFromWishlist(kind, itemId) {
  if (!itemId || !VALID_KINDS.includes(kind)) return;
  updateWishlistState((current) => ({
    ...current,
    [kind]: current[kind].filter((entry) => entry.item_id !== itemId),
  }));
}

export function isInWishlist(kind, itemId) {
  if (!VALID_KINDS.includes(kind) || !itemId) return false;
  const state = parseWishlist(readRawSnapshot());
  return state[kind].some((entry) => entry.item_id === itemId);
}

/**
 * Clear wishlist. If `kind` is omitted, clears both buckets.
 */
export function clearWishlist(kind) {
  if (kind == null) {
    updateWishlistState(() => ({ journey: [], shopping: [] }));
    return;
  }
  if (!VALID_KINDS.includes(kind)) return;
  updateWishlistState((current) => ({ ...current, [kind]: [] }));
}
