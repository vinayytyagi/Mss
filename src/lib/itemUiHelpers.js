/**
 * Item UI helpers shared between the catalog card (ItemCardV2) and the
 * product detail page (ProductDetailPage).
 *
 * Centralising these here lets the card + PDP stay visually consistent
 * (same star math, same rating fallback, same countdown formatting)
 * without copy/paste drift.
 */

// Tiny djb2-style hash → stable non-negative integer from a string. Used to
// derive pseudo ratings + review counts so every card/PDP shows SOMETHING
// even when no real review data exists yet.
export function stableHash(seed) {
  const s = String(seed || "x");
  let h = 5381;
  for (let i = 0; i < s.length; i += 1) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Pull a real rating off the item. Returns null when the item has no
 * reviews yet so the UI can hide the rating row entirely (we no longer
 * fabricate a synthetic 4.x rating — every star you see is a real one).
 *
 * Backend materializes `item.average_rating` + `item.review_count` on
 * the items document whenever a review is upserted/deleted.
 *
 * Returns `{ value, count }` or `null`.
 */
export function resolveRating(item) {
  const real = Number(
    item?.average_rating ?? item?.rating ?? item?.rating_avg ?? NaN,
  );
  const realCount = Number(item?.review_count ?? item?.ratings_count ?? NaN);
  if (!Number.isFinite(real) || real <= 0 || !Number.isFinite(realCount) || realCount <= 0) {
    return null;
  }
  return {
    value: Math.min(5, Math.max(0, real)),
    count: realCount,
  };
}

/**
 * "Sale ends in 2d 4h" — compact countdown when discount is enabled and
 * ends in the future. Returns null when no ends_at or already past.
 */
export function formatCountdown(endsAtIso) {
  if (!endsAtIso) return null;
  const end = new Date(endsAtIso).getTime();
  if (!Number.isFinite(end)) return null;
  const now = Date.now();
  const diff = end - now;
  if (diff <= 0) return null;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days >= 1) return `${days}d ${hours - days * 24}h`;
  if (hours >= 1) return `${hours}h ${mins - hours * 60}m`;
  return `${mins}m`;
}
