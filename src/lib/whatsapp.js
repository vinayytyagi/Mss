const WA_NUMBER = process.env.NEXT_PUBLIC_WA_NUMBER || "919568559915";

/** Default opener (matches previous layout: `Hi MyShaadiStore`) */
export const WA_DEFAULT_MESSAGE = "Hi MyShaadiStore";

/** Careers line via WhatsApp */
export const WA_CAREERS_MESSAGE = "Hi MyShaadiStore — Careers inquiry";

export function buildWhatsAppUrl(message = WA_DEFAULT_MESSAGE) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
}
