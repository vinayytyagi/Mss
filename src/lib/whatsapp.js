/**
 * Central WhatsApp helpers.
 *
 * Number is read from `NEXT_PUBLIC_WA_NUMBER` in .env so we can swap it
 * per environment without code changes. Format: country code + number,
 * digits only (e.g. "919568559915" for India + 95685 59915).
 *
 * Always import from here. Hard-coded `wa.me/...` URLs anywhere else are
 * a bug — they break the per-env override.
 */

const WA_NUMBER = process.env.NEXT_PUBLIC_WA_NUMBER || "919568559915";

/** Human-readable variant for display in footers / contact strips. */
export const WA_DISPLAY_NUMBER = "+91 91521 80808";

/**
 * Default opener — warm, contextual, ends with a clear ask.
 * Used by the floating WhatsApp FAB and any "Chat with us" CTA that
 * isn't tied to a specific page intent.
 */
export const WA_DEFAULT_MESSAGE =
  "Hi MyShaadiStore team! 👋 I'm planning my wedding and would love your help. Could you guide me through the next steps?";

/** Sent from the "Start planning on WhatsApp" CTAs (How it works, About us). */
export const WA_PLANNING_MESSAGE =
  "Hi MyShaadiStore! 👋 I'd like to start planning my wedding. Could you walk me through what you offer?";

/** Sent from the Cart page when a customer needs help with a quotation. */
export const WA_QUOTATION_MESSAGE =
  "Hi MyShaadiStore! 👋 I have a few items in my quotation cart and would like to confirm my requirements. Could you help?";

/** Sent from the Careers page. */
export const WA_CAREERS_MESSAGE =
  "Hi MyShaadiStore! 👋 I came across your careers page and would like to apply. Could you share next steps?";

export function buildWhatsAppUrl(message = WA_DEFAULT_MESSAGE) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
}
