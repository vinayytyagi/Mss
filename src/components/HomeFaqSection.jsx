const serif = "font-[family-name:var(--font-playfair),ui-serif,Georgia,serif]";

/**
 * Homepage FAQ — admin-managed accordion shown just above the footer.
 * Same look as the How-it-works page FAQ (native <details>, "+" that rotates
 * to "×" on open). `items` are { q, a } from the homepage-faqs API.
 * Renders nothing when the section is disabled or empty.
 */
export default function HomeFaqSection({ enabled = true, eyebrow, heading, items }) {
  if (enabled === false || !Array.isArray(items) || items.length === 0) return null;

  return (
    <section className="bg-surface py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-2 flex items-center gap-3">
          <span className="h-px w-10 bg-primary" aria-hidden />
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-secondary">
            {eyebrow || "Questions"}
          </p>
        </div>
        <h2 className={`${serif} max-w-3xl text-3xl font-bold leading-tight text-text-strong sm:text-5xl`}>
          {heading || "Frequently asked questions"}
        </h2>

        <div className="mt-10 space-y-3">
          {items.map((item, i) => (
            <details
              key={`${i}-${item.q}`}
              className="group overflow-hidden rounded-2xl border border-border bg-surface transition open:border-primary/30 open:shadow-[0_10px_28px_-12px_rgba(112,1,43,0.15)]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-base font-semibold text-text-strong transition hover:bg-surface-muted/40 sm:text-lg">
                <span>{item.q}</span>
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-secondary transition group-open:rotate-45 group-open:bg-primary group-open:text-primary-foreground"
                  aria-hidden
                >
                  +
                </span>
              </summary>
              <div className="border-t border-border bg-primary-soft/40 px-6 py-5 text-sm leading-relaxed text-muted sm:text-base">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
