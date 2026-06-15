"use client";

/**
 * JourneyStepStrip — the shared journey chrome: step-pill strip +
 * progress bar + step title/subtitle. Extracted from JourneyStepPage so
 * the new per-step page modes (packages / enquiry) reuse the exact same
 * navigation shell instead of re-implementing it.
 */

import { Check, LockKeyhole } from "lucide-react";

export default function JourneyStepStrip({ steps, step, subtitle }) {
  const activeIndex = Math.max(
    0,
    steps.findIndex((item) => item.step_id === step.step_id)
  );
  const progress = Math.round(((activeIndex + 1) / Math.max(steps.length, 1)) * 100);

  return (
    <>
      <div className="w-full overflow-x-auto no-scrollbar">
        <div className="inline-flex min-w-full items-center justify-start rounded-full bg-surface px-1 py-1 shadow-[0_12px_30px_rgba(0,0,0,0.03)] ring-1 ring-border md:justify-center">
          <div className="flex items-center">
            {steps.map((item, index) => {
              const isLast = index === steps.length - 1;

              return (
                <div key={item.step_id} className="flex items-center">
                  <a
                    href={`/journey/${item.slug}`}
                    title={item.title}
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
