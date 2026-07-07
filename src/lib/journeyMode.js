/**
 * Canonical per-journey-step MODE config (customer mirror of
 * mss-admin/src/lib/journeyMode.js). Keep the two in sync.
 *
 *   product — vendor-listed items; browse + add to quote cart.
 *   package — admin-defined building blocks; assemble → quote cart.
 *   dual    — BOTH a product listing and a package builder (tabbed).
 *
 * Builder types: "tiers" (tiers + add-ons, optional tabs) | "sections"
 * (selectable sections single|multi|quantity + detail fields).
 */

export const JOURNEY_MODE = Object.freeze({
  venues: { mode: "product" },
  decor: { mode: "product", capture_details: true },
  shopping: { mode: "product" },
  catering: {
    mode: "dual",
    product: { key: "hire-chef", label: "Hire a chef" },
    package: { key: "quote", label: "Get catering quote", builder: "sections" },
  },
  gifting: {
    mode: "dual",
    product: { key: "browse", label: "Browse hampers" },
    package: { key: "build", label: "Build your own hamper", builder: "sections" },
  },
  photography: { mode: "package", builder: "tiers" },
  "makeup-and-mehndi": { mode: "package", builder: "tiers", tabs: ["makeup", "mehndi"] },
  "wedding-invitation": { mode: "package", builder: "sections" },
  streedhan: { mode: "package", builder: "sections" },
  pagfera: { mode: "package", builder: "sections" },
  honeymoon: { mode: "package", builder: "sections" },
});

export function stepMode(slug) {
  return JOURNEY_MODE[String(slug || "")]?.mode || "product";
}
export function hasPackageBuilder(slug) {
  const m = JOURNEY_MODE[String(slug || "")];
  return !!m && (m.mode === "package" || m.mode === "dual");
}
export function hasProductListing(slug) {
  const m = JOURNEY_MODE[String(slug || "")];
  return !!m && (m.mode === "product" || m.mode === "dual");
}
export function builderType(slug) {
  const m = JOURNEY_MODE[String(slug || "")];
  if (!m) return null;
  if (m.mode === "package") return m.builder || "sections";
  if (m.mode === "dual") return m.package?.builder || "sections";
  return null;
}
export function showsAudienceFilter(slug) {
  return !!JOURNEY_MODE[String(slug || "")]?.audience_filter;
}
/**
 * mode_key for the package builder of a step (passed to the
 * package-definitions API + stamped on the package cart line). DUAL steps
 * carry it on `package.key` (catering → "quote", gifting → "build"); plain
 * package steps may carry it on `mode_key`. Returns null when unset.
 */
export function packageModeKey(slug) {
  const m = JOURNEY_MODE[String(slug || "")];
  if (!m) return null;
  if (m.mode === "dual") return m.package?.key || null;
  return m.mode_key || null;
}
/** Tab config for a DUAL step ({ product:{key,label}, package:{key,label} }). */
export function dualConfig(slug) {
  const m = JOURNEY_MODE[String(slug || "")];
  return m && m.mode === "dual" ? { product: m.product, package: m.package } : null;
}
/**
 * Whether adding a product on this step should prompt for extra event
 * details (decor → theme / colour / notes) that ride along on the cart
 * line `meta`. Driven by `capture_details` in JOURNEY_MODE.
 */
export function capturesDetails(slug) {
  return !!JOURNEY_MODE[String(slug || "")]?.capture_details;
}
