import HomePageServer from "@/components/server/HomePageServer";
import JsonLd from "@/components/JsonLd";
import { webPageSchema } from "@/lib/jsonld";

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
        ]}
      />
      <HomePageServer />
    </>
  );
}
