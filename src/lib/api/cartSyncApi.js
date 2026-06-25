/**
 * Cart sync — mirrors the localStorage cart to the server so the admin can see
 * "added to cart but didn't buy" (abandoned-cart tracking).
 *
 * Fire-and-forget, keepalive — exactly like analytics events: it must NEVER
 * block or break the cart UX. Identity comes from the stable session id
 * (lib/attribution) plus, when logged in, the customer JWT + contact details.
 */

import { getSessionId, getStoredLeadSource } from "../attribution";
import { getAuthToken, getAuthUser } from "../authCookies";

const API_BASE = (
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE) ||
  "http://localhost:5000/api/v1"
).replace(/\/$/, "");

function authHeaders() {
  const token = typeof window !== "undefined" ? getAuthToken() : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function currentContact() {
  const user = getAuthUser();
  if (!user) return undefined;
  const contact = {
    name: user.name || "",
    phone: user.phone || "",
    email: user.email || "",
  };
  return contact.name || contact.phone || contact.email ? contact : undefined;
}

/** Push the current cart state to the server (debounce this at the call site). */
export function syncCartSnapshot(carts) {
  if (typeof window === "undefined") return;
  const session_id = getSessionId();
  if (!session_id) return;
  try {
    const lead = getStoredLeadSource();
    fetch(`${API_BASE}/cart-snapshot`, {
      method: "POST",
      headers: authHeaders(),
      keepalive: true,
      body: JSON.stringify({
        session_id,
        carts: { quotation: carts?.quotation || [], shopping: carts?.shopping || [] },
        contact: currentContact(),
        source: lead?.source || null,
      }),
    }).catch(() => {});
  } catch {
    /* cart UX must never break */
  }
}

/**
 * Mark this session's cart as converted (order placed / quotation submitted).
 * Call this right before clearing the local cart on success.
 */
export function markCartConverted(kind = "order") {
  if (typeof window === "undefined") return;
  const session_id = getSessionId();
  if (!session_id) return;
  try {
    fetch(`${API_BASE}/cart-snapshot/convert`, {
      method: "POST",
      headers: authHeaders(),
      keepalive: true,
      body: JSON.stringify({ session_id, kind }),
    }).catch(() => {});
  } catch {
    /* best-effort */
  }
}
