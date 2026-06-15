"use client";

/**
 * TrustStrip — slim row of icon + claim cells rendered under the step
 * heading on journey pages (per the Part 1 / Part 2 mockups: "All venues
 * verified by MyShaadi", "Coordinator on event day", …).
 *
 * `items` — [{ icon: LucideComponent, label: string }]
 */

export default function TrustStrip({ items = [] }) {
  if (!items.length) return null;
  return (
    <div className="mx-auto mt-2 grid w-full max-w-4xl grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center">
      {items.map(({ icon: Icon, label }) => (
        <div
          key={label}
          className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-muted"
        >
          {Icon ? <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden /> : null}
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
