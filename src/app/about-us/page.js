import Link from "next/link";
import {
  ArrowRight,
  HandshakeIcon,
  ShieldCheck,
  LayoutGrid,
  CheckCircle2,
  X as XIcon,
  Quote,
  MapPin,
  Lock,
} from "lucide-react";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import JsonLd from "@/components/JsonLd";
import { webPageSchema } from "@/lib/jsonld";
import { buildWhatsAppUrl, WA_PLANNING_MESSAGE } from "@/lib/whatsapp";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://myshaadistore.com";

export const metadata = {
  title: "About Us",
  description:
    "MyShaadiStore is a managed wedding services platform serving couples in Mumbai, Delhi, and Lucknow. Not a directory — a managed platform where we handle the vendors so you don't have to.",
  keywords: ["about MyShaadiStore", "managed wedding platform India", "wedding planning Mumbai Delhi Lucknow"],
  alternates: { canonical: `${SITE_URL}/about-us` },
  openGraph: { url: `${SITE_URL}/about-us`, type: "website" },
};

const serif = "font-[family-name:var(--font-playfair),ui-serif,Georgia,serif]";

// Inline LinkedIn glyph — lucide-react doesn't export Linkedin in this version
function LinkedinIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5V8h3v11zM6.5 6.732c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zM19 19h-3v-5.604c0-3.368-4-3.113-4 0V19h-3V8h3v1.765c1.396-2.586 7-2.777 7 2.476V19z" />
    </svg>
  );
}

// Subtle decorative arch — used as a section ornament
function Flourish({ className = "h-6 w-24 text-primary/60" }) {
  return (
    <svg viewBox="0 0 96 24" fill="none" className={className} aria-hidden="true">
      <path d="M2 22 Q 48 2 94 22" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="48" cy="9" r="2" fill="currentColor" />
      <circle cx="14" cy="20" r="1" fill="currentColor" />
      <circle cx="82" cy="20" r="1" fill="currentColor" />
    </svg>
  );
}

// ─── Data ──────────────────────────────────────────────────────────────────

const MODEL_TILES = [
  {
    icon: HandshakeIcon,
    title: "Managed end to end",
    body: "You tell us what you need. We find the right vendors, send curated quotes, coordinate everything, and make sure your event goes exactly as planned. You do not chase vendors — we do.",
  },
  {
    icon: ShieldCheck,
    title: "Verified vendors only",
    body: "Every vendor on MyShaadiStore is personally screened and onboarded by our team. They are briefed before your event, monitored during delivery, and rated after every booking.",
  },
  {
    icon: LayoutGrid,
    title: "One platform for everything",
    body: "Photography, Decoration, Catering, Makeup, Mehendi, Music, Invitations, Gifts, Honeymoon, Streedhan — book every wedding service in one place.",
  },
  {
    icon: WhatsAppIcon,
    title: "WhatsApp-first support",
    body: "Our team is available on WhatsApp from 10 AM to 8 PM, Monday to Saturday. One message and we respond — always.",
  },
];

const COMPARISON_ROWS = [
  { others: "Show you a list of vendors", us: "We assign you the right vendor", you: "You do not have to compare, call, or negotiate" },
  { others: "You contact vendors directly", us: "We handle all vendor communication", you: "No awkward calls, no ignored messages" },
  { others: "Vendor quality is unverified", us: "Every vendor is screened and rated", you: "Consistent quality, every time" },
  { others: "You coordinate on event day", us: "Our Ops team monitors the event", you: "One number to call if anything goes wrong" },
  { others: "No accountability after booking", us: "We stand behind every booking", you: "You have a guarantee — not just a listing" },
];

const SERVICES = {
  Services: [
    "Photography & Videography", "Decoration & Styling", "Catering",
    "Bridal Makeup & Styling", "Mehendi Artists", "Music & Entertainment",
    "Pandit & Ritual Services", "Venue Coordination",
  ],
  Shopping: [
    "Wedding Clothing (Bride)", "Wedding Clothing (Groom)", "Fashion Jewellery",
    "Footwear", "Gifting", "Cakes & Desserts", "Sweets & Mithai", "Streedhan (Electronics)",
  ],
  More: [
    "Wedding Invitations", "Pre-Wedding Shoot", "Honeymoon & Travel",
    "Digital Wedding Services", "Beauty & Wellness", "Wedding Rentals",
    "Guest Management", "Pagfera & Post-Wedding",
  ],
};

const FOOTER_PILLARS = [
  { label: "Our focus", value: "Customer first — always" },
  { label: "Our approach", value: "Managed, not just listed" },
  { label: "Our support", value: "WhatsApp — always available" },
];

const FOUNDER_CREDENTIALS = [
  { title: "20+ years experience", body: "Technology, business strategy, and operational leadership" },
  { title: "Multi-company founder", body: "Pinnacle Edits · ScaleBusinessNow · MyShaadiStore" },
  { title: "Based in Mumbai", body: "Serving couples across Mumbai, Delhi, and Lucknow" },
];

// ─── Page ──────────────────────────────────────────────────────────────────

export default function AboutUsPage() {
  const pageUrl = `${SITE_URL}/about-us`;
  const waUrl = buildWhatsAppUrl(WA_PLANNING_MESSAGE);

  return (
    <>
      <JsonLd
        data={webPageSchema({
          title: "About Us | MyShaadiStore",
          description: metadata.description,
          url: pageUrl,
          breadcrumbs: [
            { name: "Home", url: `${SITE_URL}/` },
            { name: "About Us", url: pageUrl },
          ],
        })}
      />

      {/* ── HERO — soft editorial banner, no garish gradient ────────── */}
      <section className="relative overflow-hidden bg-primary-soft">
        <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-secondary">
            About MyShaadiStore
          </p>
          <Flourish className="mx-auto mt-4 h-5 w-20 text-primary" />
          <h1 className={`${serif} mt-6 text-5xl font-bold leading-[1.05] text-text-strong sm:text-6xl lg:text-7xl`}>
            A simpler way to plan
            <br />
            <span className="text-primary italic">your wedding.</span>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            MyShaadiStore is a managed wedding services platform serving couples in
            <span className="font-semibold text-text"> Mumbai, Delhi, and Lucknow</span>.
            Not a directory. Not an aggregator. A managed platform — where you make
            decisions and we handle everything else.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/how-it-works"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-[0_18px_36px_-8px_var(--primary)] transition hover:bg-primary-hover"
            >
              See how it works
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-secondary bg-surface px-7 text-sm font-semibold text-secondary transition hover:bg-primary-soft"
            >
              Chat with us on WhatsApp
            </a>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* ── Our model ─ editorial numbered split ───────────────── */}
        <Section eyebrow="Our model" title="What we do">
          <p className="mb-14 max-w-2xl text-base leading-relaxed text-muted">
            Everything you need for your wedding — managed by us, delivered by
            verified experts.
          </p>

          <div className="grid gap-5 md:grid-cols-2">
            {MODEL_TILES.map((t) => (
              <article
                key={t.title}
                className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-7 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_24px_50px_-18px_rgba(112,1,43,0.18)]"
              >
                {/* Soft blush wash on hover */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/0 blur-3xl transition duration-500 group-hover:bg-primary/15"
                />

                <div className="relative flex items-start gap-5">
                  {/* Icon medallion */}
                  <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft ring-1 ring-primary/15 transition group-hover:bg-primary group-hover:ring-primary">
                    <t.icon
                      className="h-6 w-6 text-secondary transition group-hover:text-primary-foreground"
                      aria-hidden
                      strokeWidth={1.6}
                    />
                  </span>

                  <div className="min-w-0 flex-1">
                    <h3 className={`text-xl font-semibold leading-tight text-text-strong sm:text-xl`}>
                      {t.title}
                    </h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-muted">
                      {t.body}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Section>

        {/* ── Why we're different ─ refined split, not loud table ── */}
        <Section eyebrow="Why choose us" title="Why MyShaadiStore is different">
          <p className="mb-12 max-w-2xl text-base leading-relaxed text-muted">
            Most wedding platforms show you a list and leave you to figure it
            out. We don&apos;t.
          </p>

          <div className="space-y-3">
            {COMPARISON_ROWS.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-1 overflow-hidden rounded-2xl border border-border bg-surface md:grid-cols-[1fr_1fr_1fr]"
              >
                <div className="flex items-start gap-3 border-b border-border bg-surface p-5 md:border-b-0 md:border-r">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface text-muted ring-1 ring-border">
                    <XIcon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">
                      Other platforms
                    </p>
                    <p className="mt-1 text-sm text-muted line-through decoration-muted">
                      {row.others}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 border-b border-border p-5 md:border-b-0 md:border-r">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                      MyShaadiStore
                    </p>
                    <p className="mt-1 text-sm font-semibold text-text">{row.us}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-5">
                  <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-secondary" aria-hidden />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary">
                      What this means for you
                    </p>
                    <p className="mt-1 text-sm text-text">{row.you}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Stats strip — quick at-a-glance proof points ────────── */}
        <section className="-mt-4 mb-12 overflow-hidden rounded-3xl border border-border bg-surface">
          <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
            {[
              { icon: MapPin, title: "3 Cities", sub: "Mumbai · Delhi · Lucknow" },
              { icon: LayoutGrid, title: "21 Categories", sub: "Every wedding service in one place" },
              { icon: WhatsAppIcon, title: "10 AM – 8 PM", sub: "WhatsApp support · Monday to Saturday" },
              { icon: Lock, title: "Secure Payments", sub: "Powered by Razorpay" },
            ].map((s, i) => (
              <div
                key={s.title}
                className={`flex flex-col items-center px-6 py-8 text-center ${i < 4 ? "sm:border-r sm:border-border lg:border-r-0" : ""}`}
              >
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft">
                  <s.icon className="h-5 w-5 text-secondary" aria-hidden />
                </span>
                <p className={`text-xl font-semibold text-text-strong sm:text-xl`}>
                  {s.title}
                </p>
                <p className="mt-1.5 text-[10px] leading-relaxed text-muted">{s.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Our story ─ editorial pull-quote layout ─────────────── */}
        <Section eyebrow="Our story" title="Why we built MyShaadiStore">
          <div className="relative grid gap-10 md:grid-cols-[1fr_auto_1fr]">
            <div className="space-y-5 text-base leading-relaxed text-muted">
              <p>
                Planning a wedding in India is one of the most joyful — and most
                overwhelming — experiences a family can go through. Venues,
                vendors, decor, catering, invitations, outfits, jewellery — the
                list never ends. And every single item requires research,
                negotiation, follow-up, and coordination.
              </p>
              <p>
                We built MyShaadiStore because we believed there was a better
                way. Not a directory where you are left to figure it out
                yourself. Not an aggregator that shows you 500 options with no
                guidance. A managed platform — where you make decisions and we
                handle everything else.
              </p>
            </div>

            {/* vertical divider on desktop only */}
            <div aria-hidden className="hidden h-full w-px bg-border md:block" />

            <div className="flex items-center">
              <blockquote className={`${serif} text-2xl font-medium leading-snug text-text-strong sm:text-3xl`}>
                <span className="text-primary">&ldquo;</span>
                Your wedding day should be a{" "}
                <em className="not-italic text-primary">memory</em>, not a
                management project.
                <span className="text-primary">&rdquo;</span>
              </blockquote>
            </div>
          </div>
        </Section>

        {/* ── What we offer ─ refined three-column ───────────────── */}
        <Section eyebrow="What we offer" title="Everything for your wedding — in one place">
          <p className="mb-12 max-w-2xl text-base leading-relaxed text-muted">
            Book every wedding service through MyShaadiStore — we manage the
            vendor, coordinate the delivery, and guarantee the quality.
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            {Object.entries(SERVICES).map(([group, items]) => (
              <div
                key={group}
                className="overflow-hidden rounded-2xl border border-border bg-surface transition hover:shadow-[0_18px_44px_-12px_rgba(112,1,43,0.12)]"
              >
                <div className="border-b border-border bg-surface-muted/60 px-6 py-4">
                  <p className={`${serif} text-xl font-semibold text-secondary`}>
                    {group}
                  </p>
                </div>
                <ul className="space-y-3 p-6">
                  {items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-text">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Founder ─ editorial magazine spread ────────────────── */}
        <Section eyebrow="Meet the founder" title="The person behind MyShaadiStore">
          <div className="overflow-hidden rounded-3xl border border-border bg-surface">
            <div className="grid gap-0 lg:grid-cols-[340px_1fr]">
              {/* Portrait side */}
              <aside className="relative flex flex-col items-center justify-start gap-5 bg-primary-soft px-8 py-12 text-center">
                <div aria-hidden className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 50% 30%, var(--primary) 0%, transparent 60%)" }} />

                <div className="relative">
                  <div className="absolute inset-0 -m-3 rounded-full border-2 border-dashed border-primary/30" aria-hidden />
                  <div className={`${serif} relative flex h-44 w-44 items-center justify-center rounded-full bg-secondary text-6xl font-bold text-primary-foreground shadow-[0_24px_60px_-12px_rgba(112,1,43,0.45)]`}>
                    AA
                  </div>
                </div>

                <div className="relative">
                  <p className={`${serif} text-2xl font-bold text-text-strong`}>
                    Mohd Azim Ansari
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
                    Founder · Mumbai
                  </p>
                </div>

                <a
                  href="https://www.linkedin.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative inline-flex items-center gap-2 rounded-full bg-text-strong px-5 py-2.5 text-sm font-semibold text-white! transition hover:bg-secondary"
                >
                  <LinkedinIcon className="h-4 w-4" /> Connect on LinkedIn
                </a>
              </aside>

              {/* Bio side */}
              <div className="p-8 sm:p-12">
                <p className="text-sm leading-relaxed text-muted">
                  With over 20 years of experience across technology, business
                  strategy, and operational leadership, I have built and scaled
                  companies from the ground up — leading teams, designing
                  systems, and driving transformation across industries. But no
                  business I have built has felt as meaningful as this one.
                  Because this one is about people, not just processes.
                </p>

                <div className="relative my-7 rounded-2xl bg-primary-soft px-6 py-7 sm:px-8">
                  <Quote className="absolute -top-3 left-6 h-7 w-7 rounded-full bg-primary p-1.5 text-primary-foreground" aria-hidden />
                  <p className={`${serif} text-lg leading-relaxed text-text-strong italic`}>
                    In India, a wedding is not just an event. It is a promise.
                    It is the moment two families come together, bound by trust,
                    love, and tradition. A shaadi is not a transaction — it is a
                    lifetime commitment. And it deserves to be treated like one.
                  </p>
                </div>

                <p className="text-sm leading-relaxed text-muted">
                  I built MyShaadiStore because I saw how that sacred moment was
                  being left to chance. Families spending weeks chasing vendors.
                  Quality that disappoints on the day. No one to call when
                  something goes wrong. India believes in relationships — in the
                  warmth of a handshake, the trust of a promise, the bond of a
                  commitment. MyShaadiStore is built on exactly that.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Every vendor agreement, every quality standard, every process
                  on this platform has been personally built and reviewed by me.
                  If you are planning your wedding with MyShaadiStore — you have
                  my personal commitment.
                </p>
              </div>
            </div>

            {/* signature quote band */}
            <div className="relative overflow-hidden bg-secondary px-8 py-14 text-center text-primary-foreground sm:px-12 sm:py-16">
              {/* Decorative background quote marks — huge, faint */}
              <span
                aria-hidden
                className={`${serif} pointer-events-none absolute left-4 top-0 select-none text-[10rem] leading-none text-primary-foreground/10 sm:left-10 sm:text-[14rem]`}
              >
                &ldquo;
              </span>
              <span
                aria-hidden
                className={`${serif} pointer-events-none absolute bottom-[-3rem] right-4 select-none text-[10rem] leading-none text-primary-foreground/10 sm:right-10 sm:bottom-[-4rem] sm:text-[14rem]`}
              >
                &rdquo;
              </span>

              <Flourish className="relative mx-auto mb-5 h-5 w-20 text-primary-foreground/60" />

              <blockquote className="relative mx-auto max-w-3xl">
                <span className={`${serif} text-xl italic leading-snug sm:text-2xl`}>
                  A shaadi is a lifetime commitment. The people you trust with it
                  should be too.
                </span>
              </blockquote>

              <p className="relative mt-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary-foreground/80">
                — Mohd Azim Ansari · Founder, MyShaadiStore
              </p>
            </div>
          </div>

          {/* tagline */}
          <p className={`mt-12 text-center text-lg italic text-muted sm:text-xl`}>
            Connecting hearts. Delivering moments. Building memories that last a lifetime.
          </p>

          {/* credentials */}
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {FOUNDER_CREDENTIALS.map((c) => (
              <div
                key={c.title}
                className="rounded-2xl border border-border bg-surface p-5"
              >
                <p className={`text-base font-semibold text-secondary`}>
                  {c.title}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{c.body}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Closing CTA ─ refined, less loud ────────────────────── */}
        <section className="my-24 overflow-hidden rounded-3xl border border-border bg-surface">
          <div className="relative bg-primary-soft px-8 py-14 text-center sm:px-12 sm:py-20">
            <Flourish className="mx-auto h-5 w-20 text-primary" />
            <h2 className={`${serif} mt-5 text-4xl font-bold leading-tight text-text-strong sm:text-5xl`}>
              Talk to us anytime
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted">
              Whether you are just starting to plan or your event is next week —
              our team is here to help. Tell us what you need, share your date
              and city, and we will guide you from the very first step to the
              last.
            </p>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-secondary px-8 text-sm font-semibold text-primary-foreground! shadow-[0_18px_36px_-8px_var(--secondary)] transition hover:opacity-90"
            >
              Chat with us on WhatsApp
            </a>
          </div>

          {/* pillars */}
          <div className="grid divide-border border-t border-border sm:grid-cols-3 sm:divide-x">
            {FOOTER_PILLARS.map((p) => (
              <div key={p.label} className="px-6 py-7 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-secondary">
                  {p.label}
                </p>
                <p className={`mt-2 text-base font-medium text-text-strong`}>
                  {p.value}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

// ─── Reusable section heading ─────────────────────────────────────────────
function Section({ eyebrow, title, children }) {
  return (
    <section className="py-20">
      <div className="mb-2 flex items-center gap-3">
        <span className="h-px w-10 bg-primary" aria-hidden />
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-secondary">
          {eyebrow}
        </p>
      </div>
      <h2 className={`${serif} max-w-3xl text-4xl font-bold leading-tight text-text-strong sm:text-5xl`}>
        {title}
      </h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}
