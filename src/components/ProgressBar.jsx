"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import "@/styles/nprogress.css";

NProgress.configure({ showSpinner: false, trickleSpeed: 200 });

export default function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstLoad = useRef(true);

  // Fire the bar on real internal navigations.
  //
  // Don't use `e.defaultPrevented` here — Next.js <Link> itself calls
  // preventDefault() to do client-side navigation, so that flag would
  // be true on every link click and we'd skip everything.
  //
  // Instead: if the click is on a <button> that's nested inside an <a>
  // (Add-to-cart, qty +/-, wishlist heart, etc.), treat it as an action,
  // not navigation. Everything else falls through and fires the bar.
  useEffect(() => {
    function handleClick(e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

      const anchor = e.target.closest("a[href]");
      if (!anchor) return;

      const btn = e.target.closest("button");
      if (btn && anchor.contains(btn)) return; // action button inside a Link

      const target = anchor.getAttribute("target");
      if (target && target !== "_self") return;

      const href = anchor.getAttribute("href") || "";
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return;

      let url;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      NProgress.start();
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // Finish the bar when the route change completes
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    const t = setTimeout(() => NProgress.done(), 100);
    return () => clearTimeout(t);
  }, [pathname, searchParams]);

  return null;
}
