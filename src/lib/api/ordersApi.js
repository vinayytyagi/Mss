import { apiFetch, apiPost } from "./apiClient";

export async function submitQuotationRequest(payload, { idempotencyKey } = {}) {
  return apiPost("/quotation-requests", { payload, idempotencyKey });
}

export async function createShoppingOrder(payload, { idempotencyKey } = {}) {
  return apiPost("/orders", { payload, idempotencyKey });
}

export async function verifyRazorpayPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature }, { idempotencyKey } = {}) {
  return apiPost("/orders/verify-payment", {
    payload: { razorpay_order_id, razorpay_payment_id, razorpay_signature },
    idempotencyKey,
  });
}

export async function trackOrder(orderNumber, phone) {
  const qs = new URLSearchParams({ order_number: orderNumber, phone });
  return apiFetch(`/orders/track?${qs.toString()}`, { revalidateSeconds: 60 });
}
