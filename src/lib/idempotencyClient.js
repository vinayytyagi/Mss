/**
 * Browser-only idempotency helper.
 * Since backend currently doesn't implement Idempotency-Key, this prevents duplicate calls
 * on the client by caching responses in localStorage.
 */

const PREFIX = "mss_idempotency_v1";
const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes

function isBrowser() {
  return typeof window !== "undefined";
}

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getRecord(key) {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(`${PREFIX}:${key}`);
  if (!raw) return null;
  return safeParse(raw);
}

function setRecord(key, record) {
  if (!isBrowser()) return;
  window.localStorage.setItem(`${PREFIX}:${key}`, JSON.stringify(record));
}

export async function getIdempotencyResponse(idempotencyKey) {
  if (!idempotencyKey || !isBrowser()) return null;
  const rec = getRecord(idempotencyKey);
  if (!rec) return null;
  if (rec.expiresAt && Date.now() > rec.expiresAt) {
    window.localStorage.removeItem(`${PREFIX}:${idempotencyKey}`);
    return null;
  }
  return rec;
}

export function setIdempotencyResponse(idempotencyKey, { status, response }) {
  if (!idempotencyKey || !isBrowser()) return;
  const now = Date.now();
  setRecord(idempotencyKey, {
    status,
    response,
    expiresAt: now + DEFAULT_TTL_MS,
  });
}

export async function waitForIdempotency(idempotencyKey, { timeoutMs = 15000, pollMs = 500 } = {}) {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const rec = await getIdempotencyResponse(idempotencyKey);
    if (rec?.status === "done") return rec.response;
    if (rec?.status === "failed") {
      throw new Error(rec?.response?.message || "Request failed");
    }
    if (rec?.status !== "in_progress") break;
    await new Promise((r) => setTimeout(r, pollMs));
  }

  // If still in_progress or missing, return best-effort by throwing.
  throw new Error("Duplicate request in progress. Please try again shortly.");
}

