import { apiFetch, apiPost, withAuthHeaders } from "./apiClient";
import { getAuthToken } from "../authCookies";

// All three endpoints require a customer JWT — `requireCustomer()` on the
// backend returns 401 "Login required" if no Authorization header is
// present. We pull the token from the auth cookie and attach it
// transparently so callers can stay terse.
function authHeaders() {
  const token = typeof window !== "undefined" ? getAuthToken() : null;
  return token ? withAuthHeaders(token) : { "Content-Type": "application/json" };
}

export async function submitQuotationRequest(payload, { idempotencyKey } = {}) {
  return apiPost("/quotation-requests", {
    payload,
    idempotencyKey,
    headers: authHeaders(),
  });
}

export async function createShoppingOrder(payload, { idempotencyKey } = {}) {
  return apiPost("/orders", {
    payload,
    idempotencyKey,
    headers: authHeaders(),
  });
}

export async function verifyRazorpayPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature }, { idempotencyKey } = {}) {
  return apiPost("/orders/verify-payment", {
    payload: { razorpay_order_id, razorpay_payment_id, razorpay_signature },
    idempotencyKey,
    headers: authHeaders(),
  });
}

export async function trackOrder(orderNumber, phone) {
  const qs = new URLSearchParams({ order_number: orderNumber, phone });
  return apiFetch(`/orders/track?${qs.toString()}`, { revalidateSeconds: 60 });
}
