import Link from "next/link";
import {
  ArrowRight,
  Send,
  FileText,
  CheckCircle2,
  CreditCard,
  HandshakeIcon,
  Sparkles,
  Wallet,
  Smartphone,
  Layers,
  IndianRupee,
} from "lucide-react";
import { buildWhatsAppUrl, WA_PLANNING_MESSAGE } from "@/lib/whatsapp";

const serif = "font-[family-name:var(--font-playfair),ui-serif,Georgia,serif]";

// ─── Decorative arch flourish ──────────────────────────────────────────────
function Flourish({ className = "h-5 w-20 text-primary" }) {
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

const STEPS = [
  {
    num: "01",
    icon: Send,
    title: "You tell us what you need",
    body: "Browse our categories — Photography, Decoration, Catering, Makeup, Venues, and more. Select the service you want and submit a simple enquiry form. Tell us your event date, city, number of guests, and any special requirements. That is all we need to get started.",
  },
  {
    num: "02",
    icon: FileText,
    title: "We send you the best quotes",
    body: "Our team reviews your requirements and reaches out to our verified vendor network. We get multiple quotes, add our service markup, and send you the best option — or multiple options to compare. You never have to call a vendor yourself. We handle all vendor communication.",
  },
  {
    num: "03",
    icon: CheckCircle2,
    title: "You approve the quote",
    body: "You receive the quote on WhatsApp and on your MyShaadiStore dashboard. Review the details — what is included, the price, and the delivery timeline. When you are ready, click Approve. You can ask us questions at any point before approving — our team responds within 2 hours.",
  },
  {
    num: "04",
    icon: CreditCard,
    title: "Pay securely on the platform",
    body: "Once you approve the quote, a payment link is generated automatically and sent to you. Pay the full amount or a minimum advance — your choice. All payments go through Razorpay. UPI, credit card, debit card, net banking, and EMI all available.",
  },
  {
    num: "05",
    icon: HandshakeIcon,
    title: "We assign and brief your vendor",
    body: "After payment is received, we formally assign the vendor to your order. We send them a complete brief — your event details, venue, special requirements, and our quality standards. The vendor is accountable to us, not to you. You receive a booking confirmation with your Order ID.",
  },
  {
    num: "06",
    icon: Sparkles,
    title: "Your event is managed — enjoy your day",
    body: "On your event day, your vendor reports as briefed. Our Ops team is available on WhatsApp throughout the day. After the event, you confirm the delivery and leave a rating. Your vendor is paid by us after your confirmation. If anything goes wrong — you call us, not the vendor. We resolve it.",
  },
];

const PAYMENT_OPTIONS = [
  { icon: Wallet,     title: "Pay 100%",         body: "Pay the full approved amount in one go. No balance reminders. No follow-up payments." },
  { icon: IndianRupee,title: "Pay advance only", body: "Pay minimum advance to confirm the booking. Pay the balance before your event day." },
  { icon: Layers,     title: "Pay by EMI",       body: "For orders above ₹25,000, pay in 3, 6, 9, or 12 monthly instalments using your credit card." },
  { icon: Smartphone, title: "Pay via UPI",      body: "GPay, PhonePe, Paytm, BHIM, and all UPI apps supported. Instant confirmation." },
];

const FAQ = [
  {
    q: "Do I have to contact the vendor myself?",
    a: "No. All vendor communication is handled by MyShaadiStore. You never need to call, WhatsApp, or negotiate with any vendor. We manage the entire vendor relationship on your behalf.",
  },
  {
    q: "What if I do not like the quote?",
    a: "You can ask us to get alternative quotes from other vendors, or share your feedback and we will renegotiate. You are never forced to approve a quote you are not happy with.",
  },
  {
    q: "What if the vendor does not show up on my event day?",
    a: "Our Ops team is available throughout your event day. If a vendor does not show up, we immediately escalate and arrange an alternative. You call us — not the vendor — and we resolve it.",
  },
  {
    q: "Can I cancel after I have paid?",
    a: "Yes. Cancellations are accepted as per our Refund and Cancellation Policy. Refunds are processed to your original payment source or as Store Credit — your choice.",
  },
  {
    q: "How long does it take to get a vendor assigned?",
    a: "For most service categories, vendor assignment happens within 24 to 48 hours of payment. We will always keep you updated via WhatsApp.",
  },
  {
    q: "Can I book multiple services through MyShaadiStore?",
    a: "Yes — this is exactly how MyShaadiStore is designed. You can book Photography, Decoration, Catering, Makeup, Mehendi, Music, Pandit, and more — all under one Order ID and one platform.",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────

export default function HowItWorksPageServer() {
  const waUrl = buildWhatsAppUrl(WA_PLANNING_MESSAGE);

  return (
    <>
      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-primary-soft">
        <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-secondary">
            How it works
          </p>
          <Flourish className="mx-auto mt-4 h-5 w-20 text-primary" />
          <h1 className={`${serif} mt-6 text-5xl font-bold leading-[1.05] text-text-strong sm:text-6xl lg:text-7xl`}>
            From your first enquiry
            <br />
            <span className="text-primary italic">to your event day.</span>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            MyShaadiStore is not a self-service tool. We are a managed wedding
            services platform. You tell us what you need — our team does the
            rest. Here is the complete flow, end to end.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* ── 6-step process — vertical timeline ─────────────────── */}
        <Section eyebrow="The process" title="6 steps from enquiry to event day">
          <div className="relative">
            {/* Connecting line (desktop only) */}
            <div aria-hidden className="pointer-events-none absolute left-9 top-0 hidden h-full w-px bg-border md:block" />

            <ol className="space-y-12">
              {STEPS.map((s) => (
                <li key={s.num} className="relative grid grid-cols-[auto_1fr] items-start gap-6 md:gap-10">
                  {/* Step badge */}
                  <span className="relative z-10 flex h-18 w-18 shrink-0 items-center justify-center rounded-full bg-secondary text-primary-foreground shadow-[0_12px_28px_-8px_rgba(112,1,43,0.4)]">
                    <s.icon className="h-6 w-6" aria-hidden />
                  </span>

                  {/* Body card */}
                  <div className="rounded-2xl border border-border bg-surface p-6 transition hover:shadow-[0_18px_44px_-12px_rgba(15,23,42,0.08)] sm:p-7">
                    <div className="flex items-baseline gap-3">
                      <span className={`text-3xl font-bold leading-none text-primary`}>
                        {s.num}
                      </span>
                      <h3 className={`text-xl font-semibold text-text-strong sm:text-2xl`}>
                        {s.title}
                      </h3>
                    </div>
                    <p className="mt-3 text-base leading-relaxed text-muted">
                      {s.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Section>

        {/* ── Payment options ─────────────────────────────────────── */}
        <Section eyebrow="Payment" title="Flexible payment options">
          <p className="mb-12 max-w-2xl text-base leading-relaxed text-muted">
            Pay the way you want. All payments go through Razorpay with
            bank-grade security.
          </p>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PAYMENT_OPTIONS.map((p) => (
              <div
                key={p.title}
                className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-6 transition hover:border-primary/30 hover:shadow-[0_18px_44px_-12px_rgba(112,1,43,0.12)]"
              >
                {/* Subtle pink glow on hover */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/0 blur-2xl transition group-hover:bg-primary/20"
                />
                <span className="relative mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft">
                  <p.icon className="h-5 w-5 text-secondary" aria-hidden />
                </span>
                <h3 className={`relative text-lg font-semibold text-text-strong`}>
                  {p.title}
                </h3>
                <p className="relative mt-2 text-sm leading-relaxed text-muted">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── FAQ ─ accordion ─────────────────────────────────────── */}
        <Section eyebrow="Questions" title="Frequently asked questions">
          <div className="space-y-3">
            {FAQ.map((item) => (
              <details
                key={item.q}
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
        </Section>

        {/* ── CTA ─────────────────────────────────────────────────── */}
        <section className="my-24 overflow-hidden rounded-3xl border border-border bg-surface">
          <div className="relative bg-primary-soft px-8 py-14 text-center sm:px-12 sm:py-20">
            <Flourish className="mx-auto h-5 w-20 text-primary" />
            <h2 className={`${serif} mt-5 text-4xl font-bold leading-tight text-text-strong sm:text-5xl`}>
              Ready to start planning?
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted">
              Send us a message on WhatsApp and our team will guide you from the
              very first step. Tell us your event date, city, and what services
              you need. We will take it from there.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 min-w-56 items-center justify-center gap-2 rounded-full bg-secondary px-7 text-sm font-semibold text-primary-foreground! shadow-[0_18px_36px_-8px_var(--secondary)] transition hover:opacity-90"
              >
                Chat with us on WhatsApp
              </a>
              <Link
                href="/journey/venue"
                className="inline-flex h-12 min-w-56 items-center justify-center gap-2 rounded-full border border-secondary bg-surface px-7 text-sm font-semibold text-secondary transition hover:bg-primary-soft"
              >
                Browse our services
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
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
      <div className="mt-10">{children}</div>
    </section>
  );
}
