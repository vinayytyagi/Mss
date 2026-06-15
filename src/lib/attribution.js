/**
 * Lead attribution (client-side) — client PRD.
 *
 * Captures WHERE a visitor came from via URL query params BEFORE they log in,
 * stores it first-touch in localStorage, then (after login) posts it to the
 * backend so it lands on the user's profile. Admin generates per-platform
 * tracked links (see the admin Lead Sources page) like:
 *   https://myshaadistore.com/?source=instagram&utm_campaign=diwali
 *
 * Also exposes trackEvent() for the analytics funnel (page_view, product_view,
 * add_to_cart, checkout_started, purchase).
 */

const LS_KEY = "mss_lead_source";
const SESSION_KEY = "mss_session_id";

const API_BASE = (
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE) ||
  "http://localhost:5000/api/v1"
).replace(/\/$/, "");

function readParam(params, ...keys) {
  for (const k of keys) {
    const v = params.get(k);
    if (v) return v.slice(0, 200);
  }
  return null;
}

/** Stable per-browser session id for funnel grouping. */
export function getSessionId() {
  if (typeof window === "undefined") return null;
  try {
    let sid = localStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = `s_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return null;
  }
}

/**
 * Capture the lead source from the current URL (first-touch). If something is
 * already stored we keep it — the original channel wins. Returns the stored
 * lead source (or null when nothing to capture and nothing stored).
 */
export function captureLeadSource() {
  if (typeof window === "undefined") return null;
  try {
    const existing = localStorage.getItem(LS_KEY);
    if (existing) return JSON.parse(existing);

    const params = new URLSearchParams(window.location.search);
    const source = readParam(params, "source", "utm_source", "ref");
    const utm_source = readParam(params, "utm_source");
    const utm_medium = readParam(params, "utm_medium");
    const utm_campaign = readParam(params, "utm_campaign", "campaign");
    const utm_content = readParam(params, "utm_content");
    const utm_term = readParam(params, "utm_term");

    // Only record an attribution if there's a signal (param or external referrer).
    const referrer = document.referrer && !document.referrer.includes(window.location.host) ? document.referrer : null;
    if (!source && !utm_source && !utm_campaign && !referrer) return null;

    const lead = {
      source: source || (referrer ? "referral" : "direct"),
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      referrer: referrer ? referrer.slice(0, 500) : null,
      landing_path: window.location.pathname.slice(0, 500),
      captured_at: new Date().toISOString(),
    };
    localStorage.setItem(LS_KEY, JSON.stringify(lead));
    return lead;
  } catch {
    return null;
  }
}

export function getStoredLeadSource() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Send the captured lead source to the backend (first-touch stamp). Call this
 * right after the customer logs in / signs up, passing their auth token.
 */
export async function sendAttribution(token) {
  if (!token) return { ok: false };
  const lead = getStoredLeadSource();
  if (!lead) return { ok: false, skipped: true };
  try {
    const res = await fetch(`${API_BASE}/user/attribution`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ lead_source: lead }),
    });
    return await res.json().catch(() => ({ ok: res.ok }));
  } catch {
    return { ok: false };
  }
}

/** Fire-and-forget analytics event for the funnel. */
export function trackEvent(type, meta = {}) {
  if (typeof window === "undefined") return;
  try {
    const lead = getStoredLeadSource();
    fetch(`${API_BASE}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        type,
        meta,
        session_id: getSessionId(),
        source: lead?.source || null,
        path: window.location.pathname,
      }),
    }).catch(() => {});
  } catch {
    /* analytics must never break UX */
  }
}
