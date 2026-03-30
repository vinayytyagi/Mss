/**
 * Central fetch wrapper for all API calls.
 * - Server: supports Next.js caching directives.
 * - Client: supports optional idempotency via localStorage (only when key is provided).
 */

import { ApiError } from "./httpErrors";
import { getIdempotencyResponse, setIdempotencyResponse, waitForIdempotency } from "./idempotencyClient";

function isServer() {
  return typeof window === "undefined";
}

function normalizeHeaders(headers) {
  return headers ? { ...headers } : {};
}

export async function fetchJson(url, { cacheMode = "revalidate", revalidateSeconds = 60, headers, method = "GET", body } = {}) {
  const init = {
    method,
    headers: normalizeHeaders(headers),
    body: body !== undefined ? body : undefined,
  };

  if (isServer()) {
    if (cacheMode === "force-cache") {
      init.cache = "force-cache";
    } else if (cacheMode === "no-store") {
      init.cache = "no-store";
    } else {
      // revalidate
      init.next = { revalidate: revalidateSeconds };
    }
  }

  const res = await fetch(url, init);
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new ApiError({
      message: data?.message || data?.error || `Request failed (${res.status})`,
      status: res.status,
      code: data?.code,
      details: data,
      url,
    });
  }

  return data;
}

export async function postJson(url, { payload, headers, idempotencyKey, cacheMode = "no-store", revalidateSeconds = 60 } = {}) {
  // If no idempotency key provided, behave like a normal POST.
  const shouldUseIdempotency = Boolean(idempotencyKey);
  const shouldSendIdempotencyHeader = shouldUseIdempotency && isServer();

  if (shouldUseIdempotency) {
    const existing = await getIdempotencyResponse(idempotencyKey);
    if (existing?.status === "done") return existing.response;
    if (existing?.status === "in_progress") {
      // Wait up to a short time window for the same request to finish.
      return waitForIdempotency(idempotencyKey);
    }
  }

  if (shouldUseIdempotency && !isServer()) {
    setIdempotencyResponse(idempotencyKey, { status: "in_progress" });
  }

  try {
    const resData = await fetchJson(url, {
      cacheMode,
      revalidateSeconds,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(headers || {}),
        ...(shouldSendIdempotencyHeader ? { "Idempotency-Key": idempotencyKey } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (shouldUseIdempotency && !isServer()) {
      setIdempotencyResponse(idempotencyKey, { status: "done", response: resData });
    }

    return resData;
  } catch (err) {
    if (shouldUseIdempotency && !isServer()) {
      setIdempotencyResponse(idempotencyKey, {
        status: "failed",
        response: { message: err?.message || "Request failed" },
      });
    }
    throw err;
  }
}

