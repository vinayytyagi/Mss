/**
 * Deterministic idempotency key generator (client-side).
 * Goal:
 * - Double-click submits the same key within a time bucket.
 * - Retries after the bucket create a new key.
 *
 * Note: Backend must honor `Idempotency-Key` for true end-to-end idempotency.
 * Right now we use it to prevent duplicate browser submissions.
 */

function stableStringify(value) {
  if (value === null || value === undefined) return String(value);
  if (typeof value !== "object") return JSON.stringify(value);

  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  }

  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
}

// Lightweight non-crypto hash (good enough for local idempotency keys)
function hashString(str) {
  let h1 = 0xdeadbeef ^ str.length;
  let h2 = 0x41c6ce57 ^ str.length;

  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  // Convert to unsigned 32-bit and mix
  h1 = (h1 ^ (h1 >>> 16)) >>> 0;
  h2 = (h2 ^ (h2 >>> 16)) >>> 0;
  const combined = (h1 * 31 + h2) >>> 0;
  return combined.toString(16);
}

export function makeIdempotencyKey(action, payload, { bucketMs = 5 * 60 * 1000 } = {}) {
  const bucket = Math.floor(Date.now() / bucketMs);
  const stable = stableStringify(payload);
  return `${action}:${bucket}:${hashString(stable)}`;
}

