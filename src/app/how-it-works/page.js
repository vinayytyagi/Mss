import HowItWorksPageServer from "@/components/server/HowItWorksPageServer";
import JsonLd from "@/components/JsonLd";
import { webPageSchema, howToSchema } from "@/lib/jsonld";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://myshaadistore.com";

export const metadata = {
  title: "How It Works",
  description:
    "Discover how MyShaadiStore simplifies wedding planning — sign up, follow your personalised journey, request vendor quotations, and shop all in one place.",
  keywords: ["how MyShaadiStore works", "wedding planning steps", "wedding vendor quotation"],
  alternates: { canonical: `${SITE_URL}/how-it-works` },
  openGraph: { url: `${SITE_URL}/how-it-works`, type: "website" },
};

export default function HowItWorksPage() {
  const pageUrl = `${SITE_URL}/how-it-works`;
  return (
    <>
      <JsonLd
        data={[
          webPageSchema({
            title: "How It Works | MyShaadiStore",
            description: metadata.description,
            url: pageUrl,
            breadcrumbs: [
              { name: "Home", url: `${SITE_URL}/` },
              { name: "How It Works", url: pageUrl },
            ],
          }),
          howToSchema(),
        ]}
      />
      <HowItWorksPageServer />
    </>
  );
}
