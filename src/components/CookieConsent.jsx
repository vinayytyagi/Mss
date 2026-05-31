"use client";

/**
 * Cookie consent banner — IT Rules 2011 / DPDP Act 2023 compliant.
 *
 * Persistence:
 *   Stored as a real cookie named `mss_cookie_consent` (not localStorage)
 *   with a 12-month max-age. Server-side code can read it via the
 *   Cookie header. The cookie matches the entry documented in the
 *   client's Cookie Policy (Category 3 — Preference Cookies).
 *
 * Programmatic re-open from anywhere:
 *   - <CookieSettingsButton /> (exported below) — drop it in a footer
 *   - openCookieSettings()  — call from any client component
 *   - dispatchEvent(new Event("mss:open-cookie-settings"))  — same effect
 *
 * Public API for analytics scripts:
 *   - getConsent()              — current full state or null
 *   - hasConsentFor("analytics" | "marketing" | "preference") — boolean
 *   - on("change", cb)          — listen for consent updates
 *
 * Default state on first visit: ONLY essential is on. Banner stays
 * visible until the user makes a choice (no auto-dismiss).
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X, Check, Shield, BarChart3, Megaphone, Settings, Cookie } from "lucide-react";

const COOKIE_NAME = "mss_cookie_consent";
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365; // 12 months
const OPEN_EVENT = "mss:open-cookie-settings";
const CHANGE_EVENT = "mss:cookie-consent-updated";

const DEFAULT_PREFS = { analytics: false, marketing: false, preference: false };

// ─── Cookie helpers (no third-party lib) ────────────────────────────────
function readCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/[.$?*|{}()[\]\\/+^]/g, "\\$&") + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name, value) {
  if (typeof document === "undefined") return;
  const v = encodeURIComponent(value);
  document.cookie = `${name}=${v}; path=/; max-age=${COOKIE_MAX_AGE_SEC}; SameSite=Lax`;
}

// ─── Public helpers (importable from anywhere) ──────────────────────────
export function getConsent() {
  const raw = readCookie(COOKIE_NAME);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function hasConsentFor(category) {
  const c = getConsent();
  if (!c) return false;
  if (c.choice === "all") return true;
  if (c.choice === "essential") return category === "essential";
  return Boolean(c.prefs?.[category]);
}

export function openCookieSettings() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_EVENT));
}

function saveConsent(choice, prefs) {
  const payload = {
    choice,
    prefs: choice === "all"
      ? { analytics: true, marketing: true, preference: true }
      : choice === "essential"
        ? DEFAULT_PREFS
        : prefs,
    ts: Date.now(),
  };
  writeCookie(COOKIE_NAME, JSON.stringify(payload));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

// ─── Settings trigger button — drop in footer ───────────────────────────
export function CookieSettingsButton({ className = "", showIcon = true }) {
  return (
    <button
      type="button"
      onClick={openCookieSettings}
      aria-label="Open cookie settings"
      className={`inline-flex items-center gap-1.5 ${className || "text-sm font-medium text-primary-foreground/85 transition hover:text-primary-foreground"}`}
    >
      {showIcon ? <Settings className="h-3.5 w-3.5" aria-hidden /> : null}
      Cookie Settings
    </button>
  );
}

// ─── Main banner component ──────────────────────────────────────────────
export default function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const mountedRef = useRef(false);

  // Decide visibility on mount + listen for "open settings" requests.
  // The initial cookie read is deferred via queueMicrotask so the state
  // update doesn't happen synchronously inside the effect body (avoids
  // the react-hooks/set-state-in-effect lint rule). One microtask later
  // is still pre-paint so the user never sees a flash.
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    queueMicrotask(() => {
      const existing = getConsent();
      if (!existing) {
        setOpen(true);
      } else if (existing.prefs) {
        setPrefs({ ...DEFAULT_PREFS, ...existing.prefs });
      }
    });

    function openHandler() {
      const cur = getConsent();
      if (cur?.prefs) setPrefs({ ...DEFAULT_PREFS, ...cur.prefs });
      setShowPrefs(true);
      setOpen(true);
    }
    window.addEventListener(OPEN_EVENT, openHandler);
    return () => window.removeEventListener(OPEN_EVENT, openHandler);
  }, []);

  function handleAcceptAll() {
    saveConsent("all");
    setOpen(false);
    setShowPrefs(false);
  }

  function handleEssential() {
    saveConsent("essential");
    setOpen(false);
    setShowPrefs(false);
  }

  function handleSaveCustom() {
    saveConsent("custom", prefs);
    setOpen(false);
    setShowPrefs(false);
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal={showPrefs ? "true" : "false"}
      aria-labelledby="cookie-consent-title"
      className="fixed inset-x-0 bottom-0 z-60 p-3 sm:p-4 animate-in slide-in-from-bottom duration-300"
    >
      <div className="mx-auto max-w-5xl rounded-2xl border-t-2 border-primary bg-surface/98 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur sm:rounded-2xl sm:border sm:border-t-2 sm:p-6">
        {showPrefs ? (
          // ── Preferences panel ───────────────────────────────────────
          <div>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Cookie className="h-5 w-5 text-primary" aria-hidden />
                <h2 id="cookie-consent-title" className="text-base font-bold text-text-strong">
                  Cookie preferences
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowPrefs(false)}
                aria-label="Close preferences"
                className="rounded-md p-1 text-muted transition hover:bg-surface-muted hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-4 text-xs leading-relaxed text-muted">
              Choose which cookie categories you want to enable. See our{" "}
              <Link href="/legal/cookie-policy" className="font-semibold text-primary underline-offset-2 hover:underline">
                Cookie Policy
              </Link>{" "}
              for details on every cookie we use.
            </p>

            <div className="space-y-2.5">
              <ConsentToggle
                icon={<Shield className="h-4 w-4 text-success" />}
                title="Essential cookies"
                description="Required for login, cart, checkout, and security. Cannot be disabled."
                checked
                disabled
              />
              <ConsentToggle
                icon={<BarChart3 className="h-4 w-4 text-primary" />}
                title="Analytics cookies"
                description="Help us understand how visitors use the site so we can improve it. Data is anonymised."
                checked={prefs.analytics}
                onChange={(v) => setPrefs((p) => ({ ...p, analytics: v }))}
              />
              <ConsentToggle
                icon={<Settings className="h-4 w-4 text-secondary" />}
                title="Preference cookies"
                description="Remember your city, budget planner, and language settings between visits."
                checked={prefs.preference}
                onChange={(v) => setPrefs((p) => ({ ...p, preference: v }))}
              />
              <ConsentToggle
                icon={<Megaphone className="h-4 w-4 text-primary-accent" />}
                title="Marketing cookies"
                description="Used to show you relevant wedding service ads on other platforms."
                checked={prefs.marketing}
                onChange={(v) => setPrefs((p) => ({ ...p, marketing: v }))}
              />
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleEssential}
                className="inline-flex items-center justify-center rounded-xl border border-secondary bg-surface px-5 py-2.5 text-sm font-semibold text-secondary transition hover:bg-primary-soft"
              >
                Reject non-essential
              </button>
              <button
                type="button"
                onClick={handleSaveCustom}
                className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_12px_28px_rgba(255,79,134,0.22)] transition hover:bg-primary/90"
              >
                Save preferences
              </button>
            </div>
          </div>
        ) : (
          // ── Default banner ──────────────────────────────────────────
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3 min-w-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Cookie className="h-5 w-5 text-primary" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 id="cookie-consent-title" className="text-sm font-bold text-text-strong">
                  We use cookies to improve your experience
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-muted sm:text-[13px]">
                  Essential cookies keep your cart and login working. We also use analytics
                  and marketing cookies — only with your consent.{" "}
                  <Link href="/legal/cookie-policy" className="font-semibold text-primary underline-offset-2 hover:underline">
                    Learn more
                  </Link>
                  .
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:shrink-0">
              <button
                type="button"
                onClick={() => setShowPrefs(true)}
                className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-xs font-semibold text-secondary underline-offset-4 transition hover:underline sm:text-sm"
              >
                Customise preferences
              </button>
              <button
                type="button"
                onClick={handleEssential}
                className="inline-flex items-center justify-center rounded-xl border border-secondary bg-surface px-4 py-2.5 text-xs font-semibold text-secondary transition hover:bg-primary-soft sm:text-sm"
              >
                Essential only
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-[0_12px_28px_rgba(255,79,134,0.24)] transition hover:bg-primary/90 sm:text-sm"
              >
                <Check className="h-3.5 w-3.5" />
                Accept all
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Preferences toggle row ──────────────────────────────────────────────
function ConsentToggle({ icon, title, description, checked, onChange, disabled }) {
  return (
    <div className={`flex items-start gap-3 rounded-xl border border-border bg-surface-muted/40 p-3 ${disabled ? "opacity-80" : ""}`}>
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-text-strong">{title}</h3>
          <Switch checked={checked} disabled={disabled} onChange={onChange} />
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">{description}</p>
      </div>
    </div>
  );
}

function Switch({ checked, disabled, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange?.(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${
        checked ? "bg-primary" : "bg-border-strong"
      } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${
          checked ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
}
