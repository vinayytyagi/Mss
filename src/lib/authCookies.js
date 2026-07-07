"use client";

import { useEffect, useState } from "react";

const TOKEN_COOKIE = "mss_token";
const USER_COOKIE = "mss_user";
// localStorage key holding the FULL user profile (no ~4KB cookie cap).
const USER_STORE = "mss_user_full";
const AUTH_EVENT = "mss-auth-change";

/** How long login cookies stay valid (must match backend JWT expiry). */
export const AUTH_COOKIE_DAYS = 30;

function readCookie(name) {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split("; ").find((item) => item.startsWith(`${name}=`));
  if (!parts) return null;
  return decodeURIComponent(parts.split("=").slice(1).join("="));
}

function writeCookie(name, value, days = AUTH_COOKIE_DAYS) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; samesite=lax`;
}

function clearCookie(name) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; samesite=lax`;
}

/* ── localStorage (full profile) ─────────────────────────────────────────
 * The full user object lives in localStorage, which has no ~4KB limit, so the
 * complete profile (full budget breakdown, addresses, …) is always available
 * client-side. We strip only the avatar (`image_url`) — a ~140KB base64 string
 * that's re-fetched from the server in ProfileClient — to keep reads fast.
 */
const STORE_DROP_FIELDS = new Set(["image_url", "avatar", "photo", "passwordHash", "otp"]);

function userForStore(user) {
  if (!user || typeof user !== "object") return user;
  const out = {};
  for (const [key, value] of Object.entries(user)) {
    if (STORE_DROP_FIELDS.has(key)) continue;
    out[key] = value;
  }
  return out;
}

function readStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_STORE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredUser(user) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(USER_STORE, JSON.stringify(userForStore(user)));
  } catch {
    /* quota / disabled storage — cookie still carries the compact copy */
  }
}

function clearStoredUser() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(USER_STORE);
  } catch {
    /* ignore */
  }
}

/* ── cookie (compact copy for SSR) ───────────────────────────────────────
 * SERVER components (SiteHeader, the journey budget cap, order/track pages)
 * read the user from this cookie — and the server CANNOT read localStorage.
 * So the cookie keeps a COMPACT copy: identity + onboarding, with the heavy
 * `budget_allocations` reduced to the only fields the server needs
 * ({ step_id, amount } for the per-step budget cap). The avatar is dropped.
 * This keeps the cookie well under the browser's ~4KB cap so it's never
 * silently dropped (which would log the user out in the header).
 */
const COOKIE_DROP_FIELDS = STORE_DROP_FIELDS;
const MAX_COOKIE_STRING = 1024;
const COOKIE_BYTE_BUDGET = 3600;

function encodedLen(obj) {
  return encodeURIComponent(JSON.stringify(obj)).length;
}

function compactAllocations(allocations) {
  if (!Array.isArray(allocations)) return allocations;
  // Keep only what server-side personalization reads (step_id + amount; slug as
  // a fallback key). Titles/blurbs/min/max live in localStorage + the server.
  return allocations.map((a) => ({
    step_id: a?.step_id,
    slug: a?.slug,
    amount: Number(a?.amount) || 0,
  }));
}

function slimUserForCookie(user) {
  if (!user || typeof user !== "object") return user;

  let out = {};
  for (const [key, value] of Object.entries(user)) {
    if (COOKIE_DROP_FIELDS.has(key)) continue;
    if (typeof value === "string" && value.length > MAX_COOKIE_STRING) continue;
    out[key] = value;
  }

  // Compact the budget breakdown (biggest part of onboarding) so the server's
  // per-step budget cap still works without bloating the cookie.
  if (out.onboarding && typeof out.onboarding === "object" && Array.isArray(out.onboarding.budget_allocations)) {
    out = { ...out, onboarding: { ...out.onboarding, budget_allocations: compactAllocations(out.onboarding.budget_allocations) } };
  }

  // Hard guard: if still over budget, shed remaining heavy fields (these are
  // all re-readable from localStorage / the server) so the cookie never gets
  // silently dropped by the browser.
  const shedders = [
    () => {
      if (out.onboarding?.budget_allocations) {
        const { budget_allocations, ...rest } = out.onboarding;
        out = { ...out, onboarding: rest };
        return true;
      }
      return false;
    },
    () => {
      if ("addresses" in out) {
        const { addresses, ...rest } = out;
        out = rest;
        return true;
      }
      return false;
    },
    () => {
      if ("onboarding" in out) {
        const { onboarding, ...rest } = out;
        out = rest;
        return true;
      }
      return false;
    },
  ];
  for (const shed of shedders) {
    if (encodedLen(out) <= COOKIE_BYTE_BUDGET) break;
    shed();
  }
  return out;
}

export function saveAuthCookies(data, days = AUTH_COOKIE_DAYS) {
  writeCookie(TOKEN_COOKIE, data.token, days);
  // Full profile (minus avatar) → localStorage. Compact copy → cookie (SSR).
  writeStoredUser(data.user);
  writeCookie(USER_COOKIE, JSON.stringify(slimUserForCookie(data.user)), days);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_EVENT));
  }
}

export function clearAuthCookies() {
  clearCookie(TOKEN_COOKIE);
  clearCookie(USER_COOKIE);
  clearStoredUser();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_EVENT));
  }
}

export function getAuthToken() {
  return readCookie(TOKEN_COOKIE);
}

export function getAuthUser() {
  // localStorage holds the FULL profile and is the client source of truth.
  // Fall back to the compact cookie copy (e.g. first paint before a write, or
  // if localStorage is unavailable).
  const stored = readStoredUser();
  if (stored) return stored;
  try {
    const raw = readCookie(USER_COOKIE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useAuthUser(initialUser = null) {
  const [user, setUser] = useState(() => initialUser || getAuthUser());

  useEffect(() => {
    // On mount, promote to the full localStorage profile if present (SSR seeded
    // the compact cookie copy). Then keep in sync with login/logout + focus.
    const refreshAuthUser = () => setUser(getAuthUser());
    refreshAuthUser();

    window.addEventListener(AUTH_EVENT, refreshAuthUser);
    window.addEventListener("focus", refreshAuthUser);

    return () => {
      window.removeEventListener(AUTH_EVENT, refreshAuthUser);
      window.removeEventListener("focus", refreshAuthUser);
    };
  }, []);

  return user;
}
