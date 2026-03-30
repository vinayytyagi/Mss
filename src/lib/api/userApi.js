import { apiFetch, apiPost, withAuthHeaders } from "./apiClient";

export async function fetchMyProfile(token) {
  return apiFetch("/user/me", {
    cacheMode: "no-store",
    headers: withAuthHeaders(token),
  });
}

export async function updateMyProfile(token, payload) {
  return apiFetch("/user/me", {
    cacheMode: "no-store",
    method: "PUT",
    headers: withAuthHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function fetchMyOrders(token) {
  return apiFetch("/user/orders", {
    cacheMode: "no-store",
    headers: withAuthHeaders(token),
  });
}

export async function cancelMyOrder(token, orderId, reason, { idempotencyKey } = {}) {
  return apiPost(`/user/orders/${encodeURIComponent(orderId)}/cancel`, {
    payload: { reason: reason || "" },
    headers: withAuthHeaders(token),
    idempotencyKey,
  });
}

export async function requestMyOrderRefund(token, orderId, reason, { idempotencyKey } = {}) {
  return apiPost(`/user/orders/${encodeURIComponent(orderId)}/refund`, {
    payload: { reason: reason || "" },
    headers: withAuthHeaders(token),
    idempotencyKey,
  });
}
