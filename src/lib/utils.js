import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Merge conditional Tailwind class names. clsx handles conditionals/arrays/objects;
// twMerge resolves Tailwind conflicts so the last class wins (e.g. cn("p-2", "p-4") → "p-4").
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 10);
}

export function formatLakhs(amount) {
  if (!amount) return "₹0";
  const num = Number(amount);
  if (num >= 100000) {
    const lakhs = num / 100000;
    return `₹${lakhs.toFixed(2).replace(/\.00$/, "")} L`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

export function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Build a CSS `url("...")` value safe for inline style injection from an
// untrusted URL string. Encodes characters that could otherwise close the
// url() / quoted-string and inject CSS.
export function safeCssUrl(url) {
  const s = String(url || "").trim();
  if (!s) return "none";
  const encoded = s.replace(/["()'\\\s]/g, encodeURIComponent);
  return `url("${encoded}")`;
}
