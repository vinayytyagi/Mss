"use client";

/**
 * Mirrors the localStorage cart to the server for abandoned-cart tracking.
 * Mounted once in the root layout. Subscribes to cart changes via the cart
 * store and pushes a debounced snapshot so the admin can see filled-but-unpaid
 * carts. Purely a side-effect — renders nothing.
 */

import { useEffect, useRef } from "react";
import { useCartState } from "@/lib/cartStore";
import { syncCartSnapshot } from "@/lib/api/cartSyncApi";

const DEBOUNCE_MS = 1200;

export default function CartSync() {
  const carts = useCartState();
  const timer = useRef(null);
  // Skip the very first render: it's the initial hydration snapshot, not a
  // user action, and the server already has (or doesn't need) this state.
  const primed = useRef(false);

  useEffect(() => {
    if (!primed.current) {
      primed.current = true;
      return undefined;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => syncCartSnapshot(carts), DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [carts]);

  return null;
}
