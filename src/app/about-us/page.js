import Link from "next/link";
import { HeartHandshake, Sparkles, ShoppingBag, MessageCircle } from "lucide-react";

export const metadata = {
  title: "About Us | MyShaadiStore",
  description:
    "MyShaadiStore helps couples plan their wedding journey step-by-step with curated shopping and human support.",
};

function Stat({ label, value }) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-[0_18px_46px_rgba(15,23,42,0.06)] backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-800">{value}</p>
    </div>
  );
}

export default function AboutUsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-20">
      <section className="relative overflow-hidden rounded-[32px] border border-white/70 bg-white/70 p-7 shadow-[0_22px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-10">
        <div className="pointer-events-none absolute -top-24 right-0 h-56 w-56 rounded-full bg-[#ff4f86]/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-[#c084fc]/12 blur-3xl" aria-hidden />

        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-[#fff1f6] px-4 py-2 text-sm font-semibold text-[#ff4f86]">
              <Sparkles className="h-4 w-4" />
              A simpler way to plan a wedding
            </p>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-800 sm:text-4xl">
              About <span className="text-[#ff4f86]">MyShaadiStore</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
              We help couples plan their wedding journey step-by-step — with curated options, transparent budgets, and
              quick human support when you need it. Less confusion. More confidence. More celebration.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/how-it-works"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              How it works
            </Link>
            <Link
              href="/shopping"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#ff4f86] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(255,79,134,0.28)] transition hover:bg-[#ff3d79]"
            >
              <ShoppingBag className="h-4 w-4" />
              Browse shopping
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-5 lg:grid-cols-3">
        <div className="rounded-[32px] border border-white/70 bg-white/70 p-7 shadow-[0_18px_46px_rgba(15,23,42,0.06)] backdrop-blur lg:col-span-2">
          <h2 className="text-xl font-bold text-slate-800">What we do</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            MyShaadiStore brings wedding planning and shopping into one guided flow. Pick your journey step, filter by
            category and budget, and build your shortlist faster — without jumping across random vendors and links.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-100 bg-white p-5">
              <p className="text-sm font-semibold text-slate-800">Guided journey</p>
              <p className="mt-2 text-sm text-slate-600">
                Wedding tasks split into steps so you always know what to do next.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-white p-5">
              <p className="text-sm font-semibold text-slate-800">Curated shopping</p>
              <p className="mt-2 text-sm text-slate-600">
                Browse items and services matched to the step you’re currently planning.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-white p-5">
              <p className="text-sm font-semibold text-slate-800">Budget-friendly filters</p>
              <p className="mt-2 text-sm text-slate-600">
                Keep your list realistic with caps and step-wise budget planning.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-white p-5">
              <p className="text-sm font-semibold text-slate-800">Human support</p>
              <p className="mt-2 text-sm text-slate-600">
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

      <section className="mt-10 rounded-[32px] border border-white/70 bg-[linear-gradient(165deg,#ffffff_0%,#fdf8fb_42%,#f6eef4_100%)] p-7 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:p-9">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800">
              <HeartHandshake className="h-5 w-5 text-[#ff4f86]" />
              Talk to us anytime
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Need help deciding, want a quote, or stuck at any step? Message us and we’ll guide you.
            </p>
          </div>
          <a
            href="https://wa.me/919568559915?text=Hi%20MyShaadiStore"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#128C7E] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(18,140,126,0.25)] transition hover:bg-[#0d6f63]"
          >
            <MessageCircle className="h-4 w-4" />
            Chat on WhatsApp
          </a>
        </div>
      </section>
    </main>
  );
}

