"use client";

/**
 * SubcategoryStrip — horizontal, scrollable row of subcategory pills with a
 * right-arrow that is PINNED to the far right edge (it no longer drifts with
 * the number of pills) and only appears when the row actually overflows.
 *
 * The pills themselves are passed in as `children` (server-rendered <Link>s
 * from ShoppingCatalog) so all the URL/filter logic stays on the server.
 */

import { useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";

export default function SubcategoryStrip({ children }) {
  const ref = useRef(null);
  const [canScroll, setCanScroll] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const check = () => setCanScroll(el.scrollWidth - el.clientWidth > 8);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [children]);

  const scrollRight = () => {
    const el = ref.current;
    if (el) el.scrollBy({ left: Math.max(220, el.clientWidth * 0.6), behavior: "smooth" });
  };

  return (
    <div className="relative mt-6">
      <div
        ref={ref}
        className={`no-scrollbar flex items-center gap-2 overflow-x-auto py-1 ${canScroll ? "pr-12" : ""}`}
      >
        {children}
      </div>
      {canScroll ? (
        <button
          type="button"
          onClick={scrollRight}
          aria-label="Scroll subcategories forward"
          className="absolute right-0 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-shop-chip-active text-text-strong shadow-md transition hover:brightness-95"
        >
          <ChevronRight className="h-5 w-5" strokeWidth={2.25} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
