"use client";

/**
 * Mounts once in the root layout. Captures the lead source from the URL on
 * first visit (first-touch) and fires a page_view event. If the user is
 * already logged in, it also flushes the stored attribution to their profile.
 */

import { useEffect } from "react";
import { captureLeadSource, sendAttribution, trackEvent } from "@/lib/attribution";
import { getAuthToken } from "@/lib/authCookies";

export default function AttributionCapture() {
  useEffect(() => {
    captureLeadSource();
    trackEvent("page_view");
    // If already authenticated, flush attribution (first-touch on the server).
    try {
      const token = getAuthToken?.();
      if (token) sendAttribution(token);
    } catch {
      /* no-op */
    }
  }, []);

  return null;
}
