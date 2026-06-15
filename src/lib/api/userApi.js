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

/** The logged-in customer's service orders (managed-service lifecycle). */
export async function fetchMyServiceOrders(token) {
  return apiFetch("/user/service-orders", {
    cacheMode: "no-store",
    headers: withAuthHeaders(token),
  });
}

export async function fetchMyServiceOrder(token, id) {
  return apiFetch(`/user/service-orders/${encodeURIComponent(id)}`, {
    cacheMode: "no-store",
    headers: withAuthHeaders(token),
  });
}

/** Approve the whole compiled multi-line quote on a service order. Locks the customer's choice. */
export async function approveServiceQuote(token, id, { idempotencyKey } = {}) {
  return apiPost(`/user/service-orders/${encodeURIComponent(id)}/approve`, {
    payload: {},
    headers: withAuthHeaders(token),
    idempotencyKey,
  });
}

export async function confirmServiceDelivery(token, id, { idempotencyKey } = {}) {
  return apiPost(`/user/service-orders/${encodeURIComponent(id)}/confirm-delivery`, {
    payload: {},
    headers: withAuthHeaders(token),
    idempotencyKey,
  });
}

export async function getServiceBalanceLink(token, id, { idempotencyKey } = {}) {
  return apiPost(`/user/service-orders/${encodeURIComponent(id)}/balance-link`, {
    payload: {},
    headers: withAuthHeaders(token),
    idempotencyKey,
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

/** Customer store-credit balance + ledger (Task 9). */
export async function fetchMyCredit(token) {
  return apiFetch("/user/credit", {
    cacheMode: "no-store",
    headers: withAuthHeaders(token),
  });
}

/** Create a Razorpay order to add money to the wallet. amountPaise is integer paise. */
export async function createWalletTopupOrder(token, amountPaise) {
  return apiPost("/user/wallet/topup", {
    payload: { amount_paise: amountPaise },
    headers: withAuthHeaders(token),
  });
}

/** Verify a wallet top-up Razorpay payment and credit the wallet. */
export async function verifyWalletTopupPayment(
  token,
  { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount_paise },
) {
  return apiPost("/user/wallet/topup/verify-payment", {
    payload: { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount_paise },
    headers: withAuthHeaders(token),
  });
}

/** The logged-in customer's return / replacement requests (Task 7). */
export async function fetchMyReturnRequests(token) {
  return apiFetch("/user/return-requests", {
    cacheMode: "no-store",
    headers: withAuthHeaders(token),
  });
}

/** Create a return / replacement request for one delivered item (Task 7). */
export async function createItemReturnRequest(token, orderId, itemId, payload, { idempotencyKey } = {}) {
  return apiPost(
    `/user/orders/${encodeURIComponent(orderId)}/items/${encodeURIComponent(itemId)}/return-request`,
    { payload, headers: withAuthHeaders(token), idempotencyKey },
  );
}

/** Confirm the reverse-shipping payment for a change-of-mind return (Task 7). */
export async function confirmReturnPayment(token, returnId, payload, { idempotencyKey } = {}) {
  return apiPost(`/user/return-requests/${encodeURIComponent(returnId)}/confirm-payment`, {
    payload,
    headers: withAuthHeaders(token),
    idempotencyKey,
  });
}

/** Wipes onboarding + budget on the user doc. After this returns, send
 *  the user to /signup/engaged to walk through the wizard again. */
export async function restartMyJourney(token) {
  return apiPost("/auth/user/restart-journey", {
    payload: {},
    headers: withAuthHeaders(token),
  });
}

/** Soft-deletes the customer account. Logged-in sessions become useless
 *  (login route refuses), so the UI must clear auth cookies after this. */
export async function deleteMyAccount(token) {
  return apiPost("/auth/user/delete-me", {
    payload: {},
    headers: withAuthHeaders(token),
  });
}
