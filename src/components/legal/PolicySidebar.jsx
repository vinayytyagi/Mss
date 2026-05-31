"use client";

/**
 * Sticky sidebar for legal pages.
 *
 * - Left column stays pinned (top: 6rem) for as long as the content
 *   column has scroll room. Once the article ends, the sidebar scrolls
 *   away with it (this is how `position: sticky` inside a grid behaves
 *   when the sidebar is shorter than the article).
 *
 * - The "On this page" TOC uses an IntersectionObserver to track which
 *   section is currently in view, and darkens that link. This is the
 *   classic scroll-spy pattern used by docs sites (MDN, Stripe, etc.).
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const serif = "font-[family-name:var(--font-playfair),ui-serif,Georgia,serif]";

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function PolicySidebar({ links, currentSlug, sections }) {
  const [activeId, setActiveId] = useState(null);
  const observersRef = useRef([]);

  useEffect(() => {
    // Build the list of section IDs from the headings prop. We observe
    // each in the DOM. `rootMargin` of "-96px 0px -65% 0px" means:
    // - top: subtract the sticky header height so a section is "active"
    //   only AFTER it crosses just under the header
    // - bottom: -65% so the next section takes over once the current one
    //   is mostly past the middle of the viewport (feels more natural
    //   than waiting until it leaves the bottom entirely)
    const ids = sections.map((s) => slugify(s.heading));
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!elements.length) return;

    // Track visible-intersection ratios for every observed section.
    // The "active" one is the topmost section whose top has crossed
    // the rootMargin threshold.
    const visible = new Map();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.set(entry.target.id, entry.boundingClientRect.top);
          } else {
            visible.delete(entry.target.id);
          }
        }

        // Pick the one closest to (but below) the top of the viewport.
        let topMost = null;
        let topMostY = Infinity;
        for (const [id, y] of visible.entries()) {
          if (y < topMostY) {
            topMostY = y;
            topMost = id;
          }
        }

        if (topMost) {
          setActiveId(topMost);
        } else {
          // Fallback: if nothing is intersecting (e.g. scrolled past
          // everything), keep whatever was last active. If we're at the
          // very top before any section enters, pick the first one.
          if (window.scrollY < 200) setActiveId(ids[0] || null);
        }
      },
      {
        // 96px = top: 6rem (sticky header offset)
        rootMargin: "-96px 0px -65% 0px",
        threshold: 0,
      }
    );

    elements.forEach((el) => observer.observe(el));
    observersRef.current = [observer];

    return () => {
      observer.disconnect();
      observersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlug, sections.length]);

  return (
    // Desktop only — the mobile nav lives in <PolicyMobileNav />.
    // Outer aside is PURE sticky — never set overflow/max-height here.
    // The inner wrapper handles overflow so the sticky behaviour stays
    // clean: scrolls with page → sticks at top:6rem → scrolls away
    // again when the grid cell ends.
    <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
      <div className="scrollbar-soft lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-2">
      {/* Legal pages list */}
      <nav className="rounded-2xl border border-border bg-surface p-4">
        <p className={`${serif} text-sm font-bold text-text-strong`}>Legal pages</p>
        <ul className="mt-3 space-y-1">
          {links.map((l) => {
            const active = l.slug === currentSlug;
            return (
              <li key={l.slug}>
                <Link
                  href={`/legal/${l.slug}`}
                  className={`block rounded-xl px-3 py-2 text-sm transition ${
                    active
                      ? "bg-primary-soft font-semibold text-secondary"
                      : "text-muted hover:bg-surface-muted hover:text-text"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* In-page TOC with scroll-spy */}
      <nav className="mt-4 rounded-2xl border border-border bg-surface p-4">
        <p className={`${serif} text-sm font-bold text-text-strong`}>On this page</p>
        <ul className="mt-3 space-y-0.5">
          {sections.map((s) => {
            const id = slugify(s.heading);
            const isActive = id === activeId;
            return (
              <li key={s.heading}>
                <a
                  href={`#${id}`}
                  aria-current={isActive ? "true" : undefined}
                  className={`group flex items-start gap-2 rounded-lg px-2 py-1.5 text-xs leading-relaxed transition-colors ${
                    isActive
                      ? "font-semibold text-text-strong"
                      : "text-muted hover:text-text"
                  }`}
                  title={s.heading}
                >
                  {/* Active marker — small pill that fills when active */}
                  <span
                    aria-hidden
                    className={`mt-1 inline-block h-3.5 w-0.5 shrink-0 rounded-full transition ${
                      isActive ? "bg-primary" : "bg-transparent group-hover:bg-border-strong"
                    }`}
                  />
                  <span className="truncate">{s.heading}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
      </div>
    </aside>
  );
}
