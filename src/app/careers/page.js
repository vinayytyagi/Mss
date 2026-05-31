import CareersApplicationForm from "@/components/CareersApplicationForm";
import Link from "next/link";
import { HeartHandshake, Sparkles } from "lucide-react";

export const metadata = {
  title: "Careers",
  description: "Careers at MyShaadiStore — build India's leading wedding planning platform. Engineering, design, ops & content roles. Apply with your resume today.",
};

export default function CareersPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-20">
      <section className="relative overflow-hidden rounded-4xl border border-surface/70 bg-surface/70 p-7 shadow-[0_22px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-10">
        <div className="absolute -top-24 right-0 h-56 w-56 rounded-full bg-primary/15 blur-3xl pointer-events-none" aria-hidden />
        <div className="absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-primary-accent-2/10 blur-3xl pointer-events-none" aria-hidden />

        <p className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-2 text-sm font-semibold text-primary">
          <Sparkles className="h-4 w-4" />
          Careers at MyShaadiStore
        </p>
        <h1 className="mt-5 max-w-3xl text-3xl font-extrabold tracking-tight text-text-strong sm:text-4xl">
          Build the future of <span className="text-primary">wedding planning</span>
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          We're growing a team that helps couples plan with confidence — from venues and décor to shopping and support.
          If you love weddings, technology, and customer delight, we'd love to hear from you.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { title: "Meaningful work", text: "Help real couples at one of life's biggest milestones." },
            { title: "Fast-moving team", text: "Ship features, learn quickly, and wear many hats." },
            { title: "Wedding + tech", text: "Blend hospitality, e-commerce, and beautiful product." },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-border bg-surface/80 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
            >
              <HeartHandshake className="h-5 w-5 text-primary" />
              <h2 className="mt-3 text-sm font-bold text-text-strong">{item.title}</h2>
              <p className="mt-1 text-sm text-muted">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-5">
        <aside className="lg:col-span-2">
          <h2 className="text-lg font-bold text-text-strong">Open roles</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Select the closest match when you apply. We're always open to strong general applications too.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-text">
            {[
              "Engineering / Product",
              "Operations",
              "Customer Success",
              "Marketing & Growth",
              "Vendor Partnerships",
              "General application",
            ].map((role) => (
              <li key={role} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {role}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-muted">
            Questions?{" "}
            <Link href="/about-us" className="font-semibold text-primary hover:underline">
              About us
            </Link>{" "}
            or email{" "}
            <a href="mailto:connect@myshaadistore.com" className="font-semibold text-primary hover:underline">
              connect@myshaadistore.com
            </a>
          </p>
        </aside>

        <div className="lg:col-span-3">
          <CareersApplicationForm />
        </div>
      </div>
    </main>
  );
}
