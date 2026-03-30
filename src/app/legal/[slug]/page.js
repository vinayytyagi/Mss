import Link from "next/link";
import { notFound } from "next/navigation";

const DOCS = {
  privacy: {
    title: "Privacy Policy",
    badge: "Your Privacy",
    tagline:
      "A clear overview of what we collect, why we collect it, and how you can control your information on MyShaadiStore.",
    effectiveDate: "Effective from 30 March 2026",
    sections: [
      {
        heading: "1) Information we collect",
        paragraphs: [
          "When you use MyShaadiStore, we may collect personal information such as your name, phone number, email address, and order-related details.",
          "We may also collect non-personal information like device type, browser details, IP address, and aggregated usage analytics to help us improve the website."
        ],
      },
      {
        heading: "2) How we use your information",
        paragraphs: [
          "To provide and manage services (including booking/order processing).",
          "To communicate with you about your order, updates, and support requests.",
          "To improve user experience, troubleshoot issues, and measure performance."
        ],
      },
      {
        heading: "3) Sharing and disclosures",
        paragraphs: [
          "We may share information with trusted service providers who help us run the website and deliver services (for example, payment processors, hosting providers, and support tools).",
          "We may also disclose information if required by law, to protect rights, safety, or to comply with valid legal processes."
        ],
      },
      {
        heading: "4) Cookies & similar technologies",
        paragraphs: [
          "We may use cookies to remember preferences, enable essential features, and understand website usage. You can control cookies through your browser settings."
        ],
      },
      {
        heading: "5) Security",
        paragraphs: [
          "We take reasonable administrative, technical, and physical measures to help protect your personal information from unauthorized access, alteration, disclosure, or destruction.",
          "However, no method of transmission or storage is 100% secure. Please use caution when sharing sensitive information."
        ],
      },
      {
        heading: "6) Your choices and rights",
        paragraphs: [
          "Depending on applicable law, you may be able to request access, correction, or deletion of your data, or object to certain processing.",
          "For assistance, contact us via the WhatsApp link available in the website footer."
        ],
      },
      {
        heading: "7) Changes to this policy",
        paragraphs: [
          "We may update this Privacy Policy from time to time. Any changes will be reflected on this page with the updated effective date."
        ],
        callout:
          "Note: This page is a general policy summary. Final details may vary based on your order type and current legal requirements."
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    badge: "Agreement",
    tagline:
      "By using MyShaadiStore, you agree to these terms. If you have any questions, contact us via WhatsApp from the website footer.",
    effectiveDate: "Effective from 30 March 2026",
    sections: [
      {
        heading: "1) Acceptance of terms",
        paragraphs: [
          "These Terms of Service (“Terms”) govern your access to and use of MyShaadiStore.",
          "By using the website, you agree to comply with these Terms and all applicable laws."
        ],
      },
      {
        heading: "2) Eligibility",
        paragraphs: [
          "You must be legally capable of entering into a binding agreement to use the services on this website.",
          "If you are using the service on behalf of someone else, you confirm you have the authority to do so."
        ],
      },
      {
        heading: "3) Orders, payments, and service fulfillment",
        paragraphs: [
          "When you place an order, you agree to provide accurate information and to follow instructions related to the order.",
          "Prices and availability may change. Any confirmed order is subject to our fulfillment and verification processes.",
          "Refunds and cancellations are handled as per our Refund Policy."
        ],
      },
      {
        heading: "4) User responsibility",
        paragraphs: [
          "You are responsible for maintaining the confidentiality of any account credentials (if applicable) and for all activities under your profile.",
          "Do not attempt to interfere with the website, security, or user experience."
        ],
      },
      {
        heading: "5) Intellectual property",
        paragraphs: [
          "All content, features, and functionality on MyShaadiStore are owned by us or our licensors and are protected by intellectual property laws.",
          "You may not copy, modify, distribute, or create derivative works from our content without permission."
        ],
      },
      {
        heading: "6) Limitation of liability",
        paragraphs: [
          "To the maximum extent permitted by law, MyShaadiStore is not liable for indirect, incidental, special, or consequential damages arising out of your use of the website.",
          "We strive to provide accurate information, but we do not guarantee that the site will be error-free or uninterrupted."
        ],
      },
      {
        heading: "7) Termination and changes",
        paragraphs: [
          "We may suspend or terminate access to the website if we believe you have violated these Terms.",
          "We may update the Terms. Continued use after updates constitutes acceptance."
        ],
        callout:
          "Note: These terms are intended as a general template. Specific arrangements may apply for different services or order types."
      },
    ],
  },
  refund: {
    title: "Refund Policy",
    badge: "Cancellations & Refunds",
    tagline:
      "Refund and cancellation rules depend on your order type and payment status. Use this page for the general process and contact details.",
    effectiveDate: "Effective from 30 March 2026",
    sections: [
      {
        heading: "1) When refunds may be available",
        paragraphs: [
          "Refund availability depends on the stage of your order (for example: before fulfillment begins, in-progress, or after processing has started).",
          "Some charges may be non-refundable if specific vendor/partner arrangements have already been initiated."
        ],
      },
      {
        heading: "2) Cancellation requests",
        paragraphs: [
          "If you want to cancel, please check your order status in `My Orders`.",
          "For help with an existing order, contact us via WhatsApp from the website footer so we can review your case."
        ],
      },
      {
        heading: "3) Refund processing timeline",
        paragraphs: [
          "If a refund is approved, it will be processed to the original payment method.",
          "Processing time can vary based on your bank/payment provider. In many cases, it may take several business days to reflect."
        ],
      },
      {
        heading: "4) Partial refunds",
        paragraphs: [
          "In certain situations, we may offer partial refunds based on work completed, vendor costs, or non-cancellable charges related to your order."
        ],
      },
      {
        heading: "5) Non-refundable cases (examples)",
        paragraphs: [
          "Customized/non-transferable services where work has already started.",
          "Orders where cancellation is requested after a defined milestone and vendor costs cannot be recovered (case-by-case)."
        ],
      },
      {
        heading: "6) How to request a refund",
        paragraphs: [
          "Open `My Orders` to locate your order details.",
          "If you need support, reach out on WhatsApp so our team can review and guide you."
        ],
      },
      {
        heading: "7) Changes to this policy",
        paragraphs: [
          "We may update this Refund Policy. Any updates will appear on this page with the effective date."
        ],
      },
    ],
  },
};

function renderPolicySection({ heading, paragraphs = [], callout }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-slate-900">{heading}</h2>
      <div className="mt-3 space-y-3 text-sm sm:text-base leading-relaxed text-slate-700">
        {paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      {callout ? (
        <div className="mt-4 rounded-2xl border border-pink-100 bg-pink-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
          {callout}
        </div>
      ) : null}
    </section>
  );
}

export function generateStaticParams() {
  return [{ slug: "privacy" }, { slug: "terms" }, { slug: "refund" }];
}

export default async function LegalPage({ params }) {
  const { slug } = await params;
  const doc = DOCS[slug];
  if (!doc) {
    notFound();
  }

  const legalLinks = [
    { slug: "privacy", label: "Privacy Policy" },
    { slug: "terms", label: "Terms of Service" },
    { slug: "refund", label: "Refund Policy" },
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="w-full lg:max-w-2xl">
          <Link href="/" className="text-sm font-semibold text-[#ff4f86] hover:underline">
            ← Back to home
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
              {doc.badge}
            </span>
            <span className="text-xs font-medium text-slate-500">{doc.effectiveDate}</span>
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">{doc.title}</h1>
          <p className="mt-3 text-base leading-relaxed text-slate-700">{doc.tagline}</p>
        </div>

        <aside className="w-full lg:w-72">
          <div className="rounded-3xl border border-slate-100 bg-white/70 p-4 shadow-sm backdrop-blur">
            <p className="text-sm font-semibold text-slate-900">Legal pages</p>
            <div className="mt-3 space-y-1">
              {legalLinks.map((l) => {
                const active = l.slug === slug;
                return (
                  <Link
                    key={l.slug}
                    href={`/legal/${l.slug}`}
                    className={`block rounded-2xl px-3 py-2 text-sm font-semibold transition ${
                      active ? "bg-[#fff1f6] text-[#ff4f86]" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              Need help? Contact us via WhatsApp from the website footer.
            </p>
          </div>
        </aside>
      </div>

      <section className="mt-8 rounded-3xl border border-slate-100 bg-white/75 p-6 shadow-sm backdrop-blur sm:p-7">
        {doc.sections.map((s) => renderPolicySection(s))}
        <div className="mt-10 rounded-3xl border border-slate-100 bg-slate-50/60 p-4">
          <p className="text-sm font-semibold text-slate-900">Disclaimer</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            This content is a general information summary. For specific scenarios related to your order,
            please reach out on WhatsApp so our team can review your case.
          </p>
        </div>
      </section>
    </main>
  );
}
