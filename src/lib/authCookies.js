"use client";

import { useEffect, useState } from "react";

const TOKEN_COOKIE = "mss_token";
const USER_COOKIE = "mss_user";
const AUTH_EVENT = "mss-auth-change";

function readCookie(name) {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split("; ").find((item) => item.startsWith(`${name}=`));
  if (!parts) return null;
  return decodeURIComponent(parts.split("=").slice(1).join("="));
}

function writeCookie(name, value, days = 30) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; samesite=lax`;
}

function clearCookie(name) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; samesite=lax`;
}

export function saveAuthCookies(data) {
  writeCookie(TOKEN_COOKIE, data.token);
  writeCookie(USER_COOKIE, JSON.stringify(data.user));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_EVENT));
  }
}

export function clearAuthCookies() {
  clearCookie(TOKEN_COOKIE);
  clearCookie(USER_COOKIE);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_EVENT));
  }
}

export function getAuthToken() {
  return readCookie(TOKEN_COOKIE);
}

export function getAuthUser() {
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
    const refreshAuthUser = () => setUser(getAuthUser());

    window.addEventListener(AUTH_EVENT, refreshAuthUser);
    window.addEventListener("focus", refreshAuthUser);

    return () => {
      window.removeEventListener(AUTH_EVENT, refreshAuthUser);
      window.removeEventListener("focus", refreshAuthUser);
    };
  }, []);

  return user;
}
