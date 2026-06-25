"use client";

/**
 * JourneyStepNav — the shared "content flanked by prev/next step arrows"
 * shell used by every journey-step page mode (listing / packages /
 * enquiry). Centralising it here guarantees ALL step pages share the
 * exact same content width and the exact same left/right arrow position,
 * instead of each mode hand-rolling its own (which had drifted to
 * max-w-400 / max-w-5xl / max-w-4xl with three different arrow styles).
 *
 * Pass the resolved prev/next hrefs. When there is no next step, point
 * `nextHref` at the quote basket and set `nextIsCart` (this only changes the
 * link target + aria/title — the arrow icon stays the consistent ChevronRight
 * used on every step).
 */

import { ChevronLeft, ChevronRight } from "lucide-react";

// Single source of truth for journey-step content width. Matches the
// site-wide max-w-7xl container used by the cart/header so steps line up
// with the rest of the app.
const ARROW_BTN =
  "group sticky top-24 z-10 mt-1 hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 ring-border transition-all active:scale-90 md:flex";

export default function JourneyStepNav({ prevHref, nextHref, nextIsCart = false, children }) {
  return (
    <div className="mx-auto mt-8 flex w-full max-w-7xl items-start gap-4 md:gap-6">
      {/* Left — previous step */}
      <a
        href={prevHref || "#"}
        aria-label="Previous step"
        className={`${ARROW_BTN} bg-surface shadow-xl hover:bg-primary-soft hover:shadow-2xl ${
          prevHref ? "cursor-pointer" : "pointer-events-none opacity-10"
        }`}
      >
        <ChevronLeft className="h-6 w-6 text-primary transition-colors group-hover:text-primary-hover" />
      </a>

      {/* Content */}
      <div className="min-w-0 flex-1 pb-20">{children}</div>

      {/* Right — next step (or the quote basket on the last step) */}
      <a
        href={nextHref || "#"}
        aria-label={nextIsCart ? "Review quote basket" : "Next step"}
        title={nextIsCart ? "Review your quote basket" : "Next step"}
        className={`${ARROW_BTN} cursor-pointer bg-primary hover:shadow-2xl`}
      >
        <ChevronRight className="h-6 w-6 text-primary-foreground" />
      </a>
    </div>
  );
}
