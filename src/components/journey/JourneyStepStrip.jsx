"use client";

/**
 * JourneyStepStrip — the shared journey chrome: step-pill strip +
 * progress bar + step title/subtitle. The strip scrolls horizontally via
 * left/right arrows AND click-and-drag (plus native touch scroll on mobile).
 */

import { useRef } from "react";
import { Check, LockKeyhole, ChevronLeft, ChevronRight } from "lucide-react";

export default function JourneyStepStrip({ steps, step, subtitle }) {
  const activeIndex = Math.max(
    0,
    steps.findIndex((item) => item.step_id === step.step_id)
  );
  const progress = Math.round(((activeIndex + 1) / Math.max(steps.length, 1)) * 100);

  const scrollRef = useRef(null);
  const drag = useRef({ down: false, startX: 0, startScroll: 0, moved: false });

  const scrollByDir = (dir) => {
    const el = scrollRef.current;
    if (el) el.scrollBy({ left: dir * Math.max(220, el.clientWidth * 0.6), behavior: "smooth" });
  };
  const onMouseDown = (e) => {
    const el = scrollRef.current;
    if (!el) return;
    drag.current = { down: true, startX: e.clientX, startScroll: el.scrollLeft, moved: false };
  };
  const onMouseMove = (e) => {
    const el = scrollRef.current;
    if (!el || !drag.current.down) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    el.scrollLeft = drag.current.startScroll - dx;
  };
  const endDrag = () => {
    drag.current.down = false;
  };
  // Swallow the click that ends a drag so it doesn't navigate a step.
  const onClickCapture = (e) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  return (
    <>
      <div className="relative w-full">
        <button
          type="button"
          onClick={() => scrollByDir(-1)}
          aria-label="Previous steps"
          className="absolute left-0 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-sm transition hover:bg-surface-muted hover:text-text sm:flex"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div
          ref={scrollRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          onClickCapture={onClickCapture}
          className="w-full cursor-grab select-none overflow-x-auto no-scrollbar active:cursor-grabbing sm:px-10"
        >
          <div className="inline-flex min-w-full items-center justify-start rounded-full bg-surface px-1 py-1 shadow-[0_12px_30px_rgba(0,0,0,0.03)] ring-1 ring-border md:justify-center">
            <div className="flex items-center">
              {steps.map((item, index) => {
                const isLast = index === steps.length - 1;

                return (
                  <div key={item.step_id} className="flex items-center">
                    <a
                      href={`/journey/${item.slug}`}
                      title={item.title}
                      draggable={false}
                      className={`flex items-center gap-2 rounded-full px-3 py-1 transition-all duration-300 shrink-0 transform active:scale-95 cursor-pointer ${
                        index <= activeIndex ? "bg-primary-soft" : "hover:bg-surface-muted"
                      }`}
                    >
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all shadow-sm ${
                          index <= activeIndex
                            ? "bg-primary text-primary-foreground"
                            : "bg-primary-accent text-primary-foreground"
                        }`}
                      >
                        {index <= activeIndex ? (
                          <Check className="w-3 h-3" strokeWidth={4} />
                        ) : (
                          <LockKeyhole className="h-3.5 w-3.5" strokeWidth={3} />
                        )}
                      </div>
                      <span
                        className={`whitespace-nowrap text-sm font-semibold transition-colors duration-300 ${
                          index <= activeIndex ? "text-text-strong" : "text-subtle"
                        }`}
                      >
                        {item.title}
                      </span>
                    </a>
                    {!isLast && (
                      <div className="h-1 w-4 lg:w-6 bg-linear-to-r from-primary-soft via-primary to-primary-soft shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => scrollByDir(1)}
          aria-label="Next steps"
          className="absolute right-0 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-sm transition hover:bg-surface-muted hover:text-text sm:flex"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="max-w-4xl mx-auto mt-4">
        <div className="rounded-full bg-surface/80 px-2 py-1 shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-4 overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-primary shadow-[0_10px_20px_rgba(255,79,134,0.35)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-muted">{progress}% Completed</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl px-6 py-6 mx-auto mt-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">{step.title}</h1>
        <p className="mt-3 text-sm text-muted">
          {subtitle || step.subtitle || "Select the perfect option for your special day."}
        </p>
      </div>
    </>
  );
}
