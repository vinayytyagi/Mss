import HomePageServer from "@/components/server/HomePageServer";
import JsonLd from "@/components/JsonLd";
import { webPageSchema, faqSchema } from "@/lib/jsonld";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://myshaadistore.com";

export const metadata = {
  title: "Plan Your Dream Wedding",
  description:
    "Plan your perfect wedding with MyShaadiStore — guided journey steps, 500+ verified vendors, and seamless shopping for photography, décor, catering, makeup & more.",
  keywords: [
    "wedding planning India",
    "wedding vendors",
    "wedding photography",
    "wedding decor",
    "wedding catering",
    "bridal makeup",
    "wedding venue",
    "online wedding shopping",
  ],
  alternates: { canonical: `${SITE_URL}/` },
  openGraph: {
    url: `${SITE_URL}/`,
    type: "website",
  },
};

const HOMEPAGE_FAQS = [
  {
    question: "What is MyShaadiStore?",
    answer:
      "MyShaadiStore is India's all-in-one wedding planning platform. We guide couples through every step of their wedding — from venue and catering to photography, décor, makeup, and shopping — with verified vendors and a seamless digital experience.",
  },
  {
    question: "How does MyShaadiStore work?",
    answer:
      "Create a free account, enter your wedding details (date, venue, guests, budget), and follow your personalised journey. Each step surfaces curated vendors you can inquire about or shop from directly.",
  },
  {
    question: "Is MyShaadiStore free to use?",
    answer:
      "Yes, creating an account and browsing vendors is completely free. You only pay when you place an order or confirm a vendor booking.",
  },
  {
    question: "Can I buy wedding products on MyShaadiStore?",
    answer:
      "Yes! Our Shopping section lets you browse and purchase wedding products — outfits, décor items, gifts, invitations, and more — with secure Razorpay checkout and delivery across India.",
  },
  {
    question: "How do I request a quotation from a vendor?",
    answer:
      "Add services to your Quote Cart and submit a single inquiry form. Our team will share tailored quotations from matched vendors within 24 hours.",
  },
];

export default function HomePage() {
  const pageUrl = `${SITE_URL}/`;
  return (
    <>
      <JsonLd
        data={[
          webPageSchema({
            title: "MyShaadiStore — Plan Your Dream Wedding",
            description: metadata.description,
            url: pageUrl,
            breadcrumbs: [{ name: "Home", url: pageUrl }],
          }),
          faqSchema(HOMEPAGE_FAQS),
        ]}
      />
      <HomePageServer />
    </>
  );
}
