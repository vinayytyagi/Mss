import { fetchJson as fetchJsonWrapped, postJson as postJsonWrapped } from "../fetchWrapper";

export const API_BASE = (
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE) ||
  "http://localhost:5000/api/v1"
).replace(/\/$/, "");

export async function apiFetch(path, { cacheMode = "revalidate", revalidateSeconds = 60, headers, method = "GET", body, signal } = {}) {
  return fetchJsonWrapped(`${API_BASE}${path}`, {
    cacheMode,
    revalidateSeconds,
    headers,
    method,
    body,
    signal,
  });
}

export async function apiPost(path, { payload, headers, idempotencyKey, cacheMode = "no-store", revalidateSeconds = 60 } = {}) {
  return postJsonWrapped(`${API_BASE}${path}`, {
    payload,
    headers,
    idempotencyKey,
    cacheMode,
    revalidateSeconds,
  });
}

export function withAuthHeaders(token, extraHeaders = {}) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...extraHeaders,
  };
}
