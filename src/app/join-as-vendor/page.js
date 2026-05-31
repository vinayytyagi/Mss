import Link from "next/link";
import {
  ArrowRight,
  HeartHandshake,
  Sparkles,
  ShieldCheck,
  Users,
  TrendingUp,
  Globe2,
  ChevronRight,
} from "lucide-react";
import JsonLd from "@/components/JsonLd";
import { webPageSchema } from "@/lib/jsonld";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://myshaadistore.com";
const VENDOR_PANEL_URL =
  process.env.NEXT_PUBLIC_VENDOR_PANEL_URL || "https://mss-vendor.vercel.app";

export const metadata = {
  title: "Join as Vendor",
  description:
    "Partner with MyShaadiStore as a wedding vendor — reach thousands of engaged couples, manage quotations, and grow your business on India's leading wedding platform.",
  keywords: ["wedding vendor registration", "list wedding business", "wedding vendor India"],
  alternates: { canonical: `${SITE_URL}/join-as-vendor` },
  openGraph: { url: `${SITE_URL}/join-as-vendor`, type: "website" },
};

const BENEFITS = [
  {
    icon: Users,
    title: "Engaged couples, ready to book",
    description:
      "Get matched with couples actively planning their wedding — no cold outreach.",
  },
  {
    icon: TrendingUp,
    title: "Track quotations & orders",
    description:
      "A full dashboard for inquiries, bookings, payouts and order tracking.",
  },
  {
    icon: ShieldCheck,
    title: "Verified by MyShaadiStore",
    description:
      "Admin-reviewed profile gives couples the trust signal that converts.",
  },
  {
    icon: Globe2,
    title: "Pan-India reach",
    description:
      "Serve customers across cities, with shipping and logistics handled.",
  },
];

const STEPS = [
  { num: "1", title: "Sign up & upload KYC", body: "Business details + 1 verification document. Takes 5 minutes." },
  { num: "2", title: "Admin review", body: "We verify your KYC, commission and service categories within 24–48 hrs." },
  { num: "3", title: "Go live", body: "List your products / packages and start receiving inquiries the same day." },
];

export default function JoinAsVendorPage() {
  const pageUrl = `${SITE_URL}/join-as-vendor`;
  const vendorSignupUrl = `${VENDOR_PANEL_URL.replace(/\/$/, "")}/signup`;
  const vendorLoginUrl = `${VENDOR_PANEL_URL.replace(/\/$/, "")}/login`;

  return (
    <>
      <JsonLd
        data={webPageSchema({
          title: "Join as Vendor | MyShaadiStore",
          description: metadata.description,
          url: pageUrl,
          breadcrumbs: [
            { name: "Home", url: `${SITE_URL}/` },
            { name: "Join as Vendor", url: pageUrl },
          ],
        })}
      />

      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {/* Hero */}
        <section className="text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Become a partner
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-black leading-tight text-text sm:text-5xl">
            Grow your wedding business with{" "}
            <span className="text-primary">MyShaadiStore</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            Reach engaged couples across India, manage quotations and orders from one
            dashboard, and get paid securely. Free to join — admin reviews your
            application within 24–48 hours.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={vendorSignupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex h-12 min-w-56 items-center justify-center gap-2 rounded-2xl bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-[0_16px_36px_rgba(255,79,134,0.28)] transition hover:bg-primary/90 hover:shadow-[0_20px_44px_rgba(255,79,134,0.36)]"
            >
              Start vendor application
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </a>
            <a
              href={vendorLoginUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 min-w-56 items-center justify-center rounded-2xl border border-border bg-surface px-8 text-sm font-semibold text-text transition hover:border-primary/40 hover:bg-surface-muted"
            >
              I already have an account
            </a>
          </div>

          <p className="mt-4 text-xs text-subtle">
            Vendor portal opens in a new tab · No setup fee
          </p>
        </section>

        {/* Benefits */}
        <section className="mt-20">
          <h2 className="text-center text-xs font-bold uppercase tracking-[0.18em] text-muted">
            Why partner with us
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl border border-border bg-surface p-5 transition hover:shadow-[0_12px_32px_rgba(16,24,40,0.07)]"
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <b.icon className="h-5 w-5 text-primary" aria-hidden />
                </div>
                <h3 className="text-sm font-bold text-text">{b.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">
                  {b.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How onboarding works */}
        <section className="mt-20 rounded-3xl bg-primary/5 p-8 sm:p-12">
          <div className="text-center">
            <h2 className="text-2xl font-black text-text sm:text-3xl">
              Onboarding in 3 steps
            </h2>
            <p className="mt-2 text-sm text-muted">
              From application to your first inquiry — typically under 48 hours.
            </p>
          </div>
          <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:items-start sm:gap-2">
            {STEPS.map((s, i) => (
              <div key={s.num} className="contents sm:flex sm:flex-1 sm:items-start">
                <div className="flex-1 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-base font-black text-primary-foreground">
                    {s.num}
                  </div>
                  <h3 className="text-base font-bold text-text">{s.title}</h3>
                  <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-muted">
                    {s.body}
                  </p>
                </div>
                {i < STEPS.length - 1 ? (
                  <>
                    {/* Desktop arrow — horizontal */}
                    <div className="hidden sm:flex sm:shrink-0 sm:items-center sm:pt-4">
                      <ArrowRight className="h-5 w-5 text-primary/40" aria-hidden />
                    </div>
                    {/* Mobile divider — vertical dotted */}
                    <div
                      className="mx-auto h-6 w-px border-l-2 border-dashed border-primary/30 sm:hidden"
                      aria-hidden
                    />
                  </>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        {/* What you'll need */}
        <section className="mt-20 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2 className="text-2xl font-black text-text sm:text-3xl">
              What you&apos;ll need to sign up
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Keep these handy before you start. The whole application takes
              about 5 minutes to complete.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-text">
              {[
                "Business name & contact details",
                "Years in business (we'll ask the range)",
                "Instagram handle or portfolio link (strongly recommended)",
                "At least one KYC document (GST / Udyam / PAN / Aadhaar)",
                "Categories of services you can offer",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8 lg:self-start">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <HeartHandshake className="h-5 w-5 text-primary" aria-hidden />
              </span>
              <h3 className="text-base font-bold text-text">Ready to join?</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted">
              Hit the button below to open the vendor portal. You can save your
              progress and come back later — your application stays in draft
              until you submit.
            </p>
            <a
              href={vendorSignupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-[0_12px_28px_rgba(255,79,134,0.24)] transition hover:bg-primary/90"
            >
              Open vendor portal
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="/how-it-works"
              className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-border bg-surface text-sm font-semibold text-text transition hover:bg-surface-muted"
            >
              Learn how MyShaadiStore works
            </Link>
          </div>
        </section>

        {/* Footer note */}
        <p className="mt-16 text-center text-xs text-subtle">
          <Sparkles className="mr-1 inline h-3 w-3" aria-hidden />
          Already 500+ verified vendors growing with MyShaadiStore
        </p>
      </main>
    </>
  );
}
