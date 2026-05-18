import Link from "next/link";
import { HeartHandshake, Sparkles, ShoppingBag, MessageCircle } from "lucide-react";

export const metadata = {
  title: "About Us | MyShaadiStore",
  description:
    "MyShaadiStore helps couples plan their wedding journey step-by-step with curated shopping and human support.",
};

function Stat({ label, value }) {
  return (
    <div className="rounded-3xl border border-surface/70 bg-surface/70 p-5 shadow-[0_18px_46px_rgba(15,23,42,0.06)] backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-text-strong">{value}</p>
    </div>
  );
}

export default function AboutUsPage() {
  return (
    <main className="w-full px-4 py-10 mx-auto max-w-7xl sm:px-6 lg:px-20">
      <section className="relative overflow-hidden rounded-4xl border border-surface/70 bg-surface/70 p-7 shadow-[0_22px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-10">
        <div className="absolute right-0 w-56 h-56 rounded-full pointer-events-none -top-24 bg-primary/15 blur-3xl" aria-hidden />
        <div className="absolute w-56 h-56 rounded-full pointer-events-none -bottom-20 left-10 bg-primary-accent-2/10 blur-3xl" aria-hidden />

        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full bg-primary-soft text-primary">
              <Sparkles className="w-4 h-4" />
              A simpler way to plan a wedding
            </p>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-text-strong sm:text-4xl">
              About <span className="text-primary">MyShaadiStore</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
              We help couples plan their wedding journey step-by-step — with curated options, transparent budgets, and
              quick human support when you need it. Less confusion. More confidence. More celebration.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/how-it-works"
              className="inline-flex items-center justify-center px-5 py-3 text-sm font-semibold transition border rounded-2xl border-border-strong bg-surface text-text hover:bg-surface-muted"
            >
              How it works
            </Link>
            <Link
              href="/shopping"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_16px_40px_rgba(255,79,134,0.28)] transition hover:bg-primary-hover"
            >
              <ShoppingBag className="w-4 h-4" />
              Browse shopping
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-5 mt-10 lg:grid-cols-3">
        <div className="rounded-4xl border border-surface/70 bg-surface/70 p-7 shadow-[0_18px_46px_rgba(15,23,42,0.06)] backdrop-blur lg:col-span-2">
          <h2 className="text-xl font-bold text-text-strong">What we do</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            MyShaadiStore brings wedding planning and shopping into one guided flow. Pick your journey step, filter by
            category and budget, and build your shortlist faster — without jumping across random vendors and links.
          </p>

          <div className="grid gap-4 mt-6 sm:grid-cols-2">
            <div className="p-5 border rounded-3xl border-border bg-surface">
              <p className="text-sm font-semibold text-text-strong">Guided journey</p>
              <p className="mt-2 text-sm text-muted">
                Wedding tasks split into steps so you always know what to do next.
              </p>
            </div>
            <div className="p-5 border rounded-3xl border-border bg-surface">
              <p className="text-sm font-semibold text-text-strong">Curated shopping</p>
              <p className="mt-2 text-sm text-muted">
                Browse items and services matched to the step you’re currently planning.
              </p>
            </div>
            <div className="p-5 border rounded-3xl border-border bg-surface">
              <p className="text-sm font-semibold text-text-strong">Budget-friendly filters</p>
              <p className="mt-2 text-sm text-muted">
                Keep your list realistic with caps and step-wise budget planning.
              </p>
            </div>
            <div className="p-5 border rounded-3xl border-border bg-surface">
              <p className="text-sm font-semibold text-text-strong">Human support</p>
              <p className="mt-2 text-sm text-muted">
                Get quick WhatsApp help for suggestions, orders, or quotations.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5">
          <Stat label="Focus" value="Clarity + speed" />
          <Stat label="Approach" value="Curated, not cluttered" />
          <Stat label="Support" value="WhatsApp-first" />
        </div>
      </section>

      <section className="mt-10 rounded-4xl border border-surface/70 bg-[linear-gradient(165deg,var(--surface)_0%,var(--primary-soft)_42%,var(--surface-muted)_100%)] p-7 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:p-9">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="flex items-center gap-2 text-xl font-bold text-text-strong">
              <HeartHandshake className="w-5 h-5 text-primary" />
              Talk to us anytime
            </h2>
            <p className="mt-2 text-sm text-muted">
              Need help deciding, want a quote, or stuck at any step? Message us and we’ll guide you.
            </p>
          </div>
          <a
            href="https://wa.me/919568559915?text=Hi%20MyShaadiStore"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#128C7E] px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_14px_30px_rgba(18,140,126,0.25)] transition hover:bg-[#0d6f63]"
          >
            <MessageCircle className="w-4 h-4" />
            Chat on WhatsApp
          </a>
        </div>
      </section>
    </main>
  );
}
