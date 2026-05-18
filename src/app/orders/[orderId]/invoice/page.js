"use client";

/**
 * Customer-facing invoice viewer.
 *
 * Hits `GET /api/v1/user/orders/[orderId]/invoice` with the customer's
 * auth token, renders the returned HTML inline, and gives a Print button.
 * Linked from the order-placed email + (TODO) the order detail page.
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAuthToken } from "@/lib/authCookies";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "/api/v1").replace(/\/$/, "");

export default function CustomerInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId;

  const [html, setHtml] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace(`/login?next=${encodeURIComponent(`/orders/${orderId}/invoice`)}`);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/user/orders/${orderId}/invoice`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body?.message || `Failed (${r.status})`);
        }
        const text = await r.text();
        if (!cancelled) setHtml(text);
      } catch (e) {
        if (!cancelled) setError(e.message || "Couldn't load invoice");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, router]);

  if (error) {
    return (
      <div style={{ padding: 32, maxWidth: 480, margin: "0 auto", fontFamily: "system-ui" }}>
        <h1>Invoice unavailable</h1>
        <p>{error}</p>
        <p>
          <a href="/orders">← Back to orders</a>
        </p>
      </div>
    );
  }

  if (!html) {
    return (
      <div style={{ padding: 32, textAlign: "center", color: "#64748b", fontFamily: "system-ui" }}>
        Loading invoice…
      </div>
    );
  }

  // The server returns a full HTML document; render it inside an iframe so
  // its <style> / <script> don't leak into the parent app.
  return (
    <iframe
      title="Invoice"
      srcDoc={html}
      style={{ border: 0, width: "100%", height: "100vh", display: "block" }}
    />
  );
}
