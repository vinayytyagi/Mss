"use client";

import { useEffect, useRef } from "react";

const GIS_SRC = "https://accounts.google.com/gsi/client";
const GIS_SCRIPT_ID = "google-gsi-client";

/**
 * Renders Google's official "Sign in with Google" button (Google Identity
 * Services). On success it calls `onCredential(credentialString)` with the
 * raw ID-token JWT, which the caller POSTs to /auth/user/google.
 *
 * Renders nothing when NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured.
 *
 * Props:
 *   - onCredential: (credential: string) => void
 *   - text?: GIS button text key ("continue_with" | "signin_with" | ...)
 */
export default function GoogleSignInButton({ onCredential, text = "continue_with" }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const containerRef = useRef(null);
  // Keep the latest callback without re-initializing GIS. Update in an effect
  // (writing a ref during render is disallowed by the React rules).
  const onCredentialRef = useRef(onCredential);
  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!clientId) return;
    if (typeof window === "undefined") return;

    let cancelled = false;

    function loadScript() {
      return new Promise((resolve, reject) => {
        if (window.google?.accounts?.id) {
          resolve();
          return;
        }
        const existing = document.getElementById(GIS_SCRIPT_ID);
        if (existing) {
          if (existing.dataset.loaded === "true") {
            resolve();
          } else {
            existing.addEventListener("load", () => resolve(), { once: true });
            existing.addEventListener("error", () => reject(new Error("GIS load failed")), { once: true });
          }
          return;
        }
        const script = document.createElement("script");
        script.id = GIS_SCRIPT_ID;
        script.src = GIS_SRC;
        script.async = true;
        script.defer = true;
        script.addEventListener(
          "load",
          () => {
            script.dataset.loaded = "true";
            resolve();
          },
          { once: true }
        );
        script.addEventListener("error", () => reject(new Error("GIS load failed")), { once: true });
        document.head.appendChild(script);
      });
    }

    loadScript()
      .then(() => {
        if (cancelled) return;
        const google = window.google;
        if (!google?.accounts?.id || !containerRef.current) return;

        google.accounts.id.initialize({
          client_id: clientId,
          callback: (resp) => {
            if (resp?.credential) onCredentialRef.current?.(resp.credential);
          },
        });

        // Clear any prior render (e.g. React fast-refresh / remount).
        containerRef.current.innerHTML = "";
        google.accounts.id.renderButton(containerRef.current, {
          theme: "outline",
          size: "large",
          type: "standard",
          text,
          width: 320,
        });
      })
      .catch(() => {
        // Network/script failure: leave the container empty rather than crash.
      });

    return () => {
      cancelled = true;
      try {
        window.google?.accounts?.id?.cancel?.();
      } catch {
        // ignore cleanup errors
      }
    };
  }, [clientId, text]);

  if (!clientId) return null;

  return <div ref={containerRef} style={{ minHeight: 40 }} />;
}
