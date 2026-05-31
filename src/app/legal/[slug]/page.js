import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, AlertTriangle, Info, ShieldAlert } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import { webPageSchema, breadcrumbSchema } from "@/lib/jsonld";
import { LEGAL_DOCS, LEGAL_LINKS, COMPANY_NAME, COMPANY_ADDRESS, SUPPORT_HOURS } from "@/lib/legalDocs";
import PolicySidebar from "@/components/legal/PolicySidebar";
import PolicyMobileNav from "@/components/legal/PolicyMobileNav";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://myshaadistore.com";
const serif = "font-[family-name:var(--font-playfair),ui-serif,Georgia,serif]";

// ─── Metadata per slug ────────────────────────────────────────────────────
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const doc = LEGAL_DOCS[slug];
  if (!doc) return { title: "Legal" };

  return {
    title: `${doc.title} | MyShaadiStore`,
    description: doc.tagline,
    alternates: { canonical: `${SITE_URL}/legal/${slug}` },
    openGraph: {
      title: `${doc.title} | MyShaadiStore`,
      description: doc.tagline,
      url: `${SITE_URL}/legal/${slug}`,
      type: "article",
    },
  };
}

export function generateStaticParams() {
  return Object.keys(LEGAL_DOCS).map((slug) => ({ slug }));
}

// ─── Block renderer ──────────────────────────────────────────────────────
function Block({ block }) {
  if (!block) return null;
  switch (block.type) {
    case "p":
      return (
        <p className={`text-[15px] leading-relaxed ${block.lead ? "text-text-strong" : "text-text"}`}>
          {block.text}
        </p>
      );

    case "subheading":
      return (
        <h3 className={`${serif} mt-8 text-xl font-semibold text-text-strong`}>
          {block.text}
        </h3>
      );

    case "list":
      return (
        <ul className="space-y-2 text-[15px] leading-relaxed text-text">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );

    case "table":
      return (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead>
              <tr className="bg-primary-soft">
                {block.headers.map((h, i) => (
                  <th
                    key={i}
                    className={`${serif} px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary sm:px-5 sm:py-3.5`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {block.rows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? "bg-surface" : "bg-surface-muted/30"}>
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className="whitespace-pre-line px-4 py-3 align-top text-[13px] leading-relaxed text-text sm:px-5 sm:py-4 sm:text-sm"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "callout": {
      const tone = block.tone || "info";
      const toneClass = {
        info:   "border-primary/30 bg-primary-soft",
        warn:   "border-warning/40 bg-warning/10",
        danger: "border-danger/30 bg-danger/10",
      }[tone];
      const Icon = { info: Info, warn: AlertTriangle, danger: ShieldAlert }[tone];
      const iconColor = { info: "text-primary", warn: "text-warning-strong", danger: "text-danger" }[tone];
      return (
        <div className={`rounded-2xl border ${toneClass} p-4 sm:p-5`}>
          <div className="flex items-start gap-3">
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconColor}`} aria-hidden />
            <div className="min-w-0 flex-1">
              {block.title ? (
                <p className="text-sm font-bold text-text-strong">{block.title}</p>
              ) : null}
              <p className={`${block.title ? "mt-1.5" : ""} text-sm leading-relaxed text-text`}>
                {block.body}
              </p>
            </div>
          </div>
        </div>
      );
    }

    case "spacer":
      return <div className="h-4" aria-hidden />;

    default:
      return null;
  }
}

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function PolicySection({ heading, blocks = [] }) {
  return (
    // scroll-mt-36 on mobile = SiteHeader (88) + mobile sticky bar (~50)
    // scroll-mt-24 on lg+    = SiteHeader (88) only
    <section className="space-y-4 scroll-mt-36 lg:scroll-mt-24" id={slugify(heading)}>
      <h2 className={`${serif} text-xl font-bold text-text-strong sm:text-2xl lg:text-3xl`}>
        {heading}
      </h2>
      <div className="space-y-4">
        {blocks.map((b, i) => (
          <Block key={i} block={b} />
        ))}
      </div>
    </section>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────
export default async function LegalPage({ params }) {
  const { slug } = await params;

  // Friendly aliases
  if (slug === "privacy") redirect("/legal/privacy-policy");
  if (slug === "terms")   redirect("/legal/terms-of-service");
  if (slug === "refund")  redirect("/legal/refund-policy");
  if (slug === "cookies") redirect("/legal/cookie-policy");

  const doc = LEGAL_DOCS[slug];
  if (!doc) notFound();

  const pageUrl = `${SITE_URL}/legal/${slug}`;

  return (
    <>
      <JsonLd
        data={[
          webPageSchema({
            title: `${doc.title} | MyShaadiStore`,
            description: doc.tagline,
            url: pageUrl,
          }),
          breadcrumbSchema([
            { name: "Home", url: `${SITE_URL}/` },
            { name: "Legal", url: `${SITE_URL}/legal/${slug}` },
            { name: doc.title, url: pageUrl },
          ]),
        ]}
      />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-primary-soft">
        <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-20 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary transition hover:text-primary sm:text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back to home
          </Link>

          <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-5 sm:gap-3">
            <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-foreground sm:px-3 sm:py-1 sm:text-[11px] sm:tracking-[0.18em]">
              {doc.badge}
            </span>
            <span className="text-[11px] font-medium text-muted sm:text-xs">{doc.effectiveDate}</span>
          </div>

          <h1 className={`${serif} mt-4 max-w-3xl text-3xl font-bold leading-tight text-text-strong sm:mt-5 sm:text-5xl lg:text-6xl`}>
            {doc.title}
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:mt-5 sm:text-lg">
            {doc.tagline}
          </p>
          {doc.intro ? (
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted sm:mt-3 sm:text-sm">{doc.intro}</p>
          ) : null}
        </div>
      </section>

      {/* ── Body grid ──────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Mobile-only: doc-switcher pills + sticky 'On this page' bar */}
        <PolicyMobileNav
          links={LEGAL_LINKS}
          currentSlug={slug}
          sections={doc.sections.map((s) => ({ heading: s.heading }))}
        />

        <div className="grid gap-10 lg:grid-cols-[260px_1fr]">

          {/* Sticky sidebar with scroll-spy TOC (desktop only) */}
          <PolicySidebar
            links={LEGAL_LINKS}
            currentSlug={slug}
            sections={doc.sections.map((s) => ({ heading: s.heading }))}
          />

          {/* Sections */}
          <article className="min-w-0 space-y-10 sm:space-y-12">
            {doc.sections.map((s) => (
              <PolicySection key={s.heading} heading={s.heading} blocks={s.blocks} />
            ))}

            {/* Contact card — always at the bottom */}
            <section className="overflow-hidden rounded-3xl border border-border bg-surface">
              <div className="border-b border-border bg-primary-soft px-6 py-5 sm:px-8">
                <p className={`${serif} text-xl font-bold text-secondary`}>Need help?</p>
                <p className="mt-1 text-sm text-muted">Reach out — we respond {SUPPORT_HOURS}.</p>
              </div>
              <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary">WhatsApp</p>
                  <a
                    href="https://wa.me/919568559915"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-sm font-semibold text-primary underline-offset-2 hover:underline"
                  >
                    +91 95685 59915
                  </a>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary">Email</p>
                  <a
                    href="mailto:connect@myshaadistore.com"
                    className="mt-1 block text-sm font-semibold text-primary underline-offset-2 hover:underline"
                  >
                    connect@myshaadistore.com
                  </a>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary">Registered office</p>
                  <p className="mt-1 text-sm text-text">{COMPANY_NAME}</p>
                  <p className="mt-1 text-sm text-muted">{COMPANY_ADDRESS}</p>
                </div>
              </div>
            </section>
          </article>
        </div>
      </main>
    </>
  );
}
