"use client";

/**
 * Mobile-only legal-page navigation.
 *
 * Two pieces:
 *   1. A horizontally-scrollable pill row of legal pages (Privacy /
 *      Terms / Refund / Cookie) — lets the user switch documents
 *      without going to the footer.
 *
 *   2. A sticky single-row "On this page" bar that sits just under
 *      the SiteHeader (top: 5.5rem = below the 88px fixed header).
 *      Tap it to expand a slide-down sheet with every section. Each
 *      section link smooth-scrolls to its anchor and auto-closes the
 *      sheet. The bar's label live-updates via scroll-spy so the user
 *      always knows where they are.
 *
 * Hidden on lg+ — desktop uses <PolicySidebar />.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, List } from "lucide-react";

const serif = "font-[family-name:var(--font-playfair),ui-serif,Georgia,serif]";

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function PolicyMobileNav({ links, currentSlug, sections }) {
  const [activeId, setActiveId] = useState(null);
  const [open, setOpen] = useState(false);
  const sheetRef = useRef(null);

  // Scroll-spy (same logic as desktop sidebar, but only writes label)
  useEffect(() => {
    const ids = sections.map((s) => slugify(s.heading));
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!els.length) return;

    const visible = new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.set(e.target.id, e.boundingClientRect.top);
          else visible.delete(e.target.id);
        }
        let top = null;
        let topY = Infinity;
        for (const [id, y] of visible.entries()) {
          if (y < topY) { topY = y; top = id; }
        }
        if (top) setActiveId(top);
        else if (window.scrollY < 200) setActiveId(ids[0] || null);
      },
      // 132px = SiteHeader (88) + mobile sticky bar (~44)
      { rootMargin: "-132px 0px -65% 0px", threshold: 0 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [currentSlug, sections.length]);

  // Close sheet when scrolling the page (so taps land on real content)
  useEffect(() => {
    if (!open) return;
    function onScroll() { setOpen(false); }
    function onKey(e) { if (e.key === "Escape") setOpen(false); }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const activeSection = sections.find((s) => slugify(s.heading) === activeId);
  const activeLabel = activeSection?.heading || "Jump to section";

  return (
    <div className="lg:hidden">
      {/* ── Doc switcher pills — non-sticky ─────────────────────── */}
      <div className="-mx-4 mb-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 scrollbar-soft">
        <div className="flex gap-2 pb-1">
          {links.map((l) => {
            const active = l.slug === currentSlug;
            return (
              <Link
                key={l.slug}
                href={`/legal/${l.slug}`}
                className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-secondary bg-secondary text-primary-foreground"
                    : "border-border bg-surface text-muted hover:border-border-strong hover:text-text"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Sticky "On this page" bar ─────────────────────────── */}
      <div className="sticky top-[5.5rem] z-30 -mx-4 mb-6 sm:-mx-6">
        <div className="border-y border-border bg-surface/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="policy-mobile-toc"
            className="flex w-full items-center justify-between gap-3 py-3 text-left"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-soft">
                <List className="h-3.5 w-3.5 text-secondary" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary">
                  On this page
                </span>
                <span className={`${serif} block truncate text-sm font-semibold text-text-strong`}>
                  {activeLabel}
                </span>
              </span>
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
        </div>

        {/* ── Slide-down sheet ──────────────────────────────────── */}
        <div
          id="policy-mobile-toc"
          ref={sheetRef}
          className={`overflow-hidden border-b border-border bg-surface transition-[max-height,opacity] duration-200 ease-out ${
            open ? "max-h-[60vh] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="scrollbar-soft max-h-[60vh] overflow-y-auto px-4 py-2 sm:px-6">
            <ul className="space-y-0.5 py-2">
              {sections.map((s) => {
                const id = slugify(s.heading);
                const isActive = id === activeId;
                return (
                  <li key={s.heading}>
                    <a
                      href={`#${id}`}
                      onClick={() => setOpen(false)}
                      className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm leading-relaxed transition ${
                        isActive
                          ? "bg-primary-soft font-semibold text-text-strong"
                          : "text-muted hover:bg-surface-muted hover:text-text"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`mt-1.5 inline-block h-3 w-0.5 shrink-0 rounded-full transition ${
                          isActive ? "bg-primary" : "bg-transparent"
                        }`}
                      />
                      <span>{s.heading}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
