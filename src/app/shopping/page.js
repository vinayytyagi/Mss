import ShoppingPageServer from "@/components/server/ShoppingPageServer";
import JsonLd from "@/components/JsonLd";
import { webPageSchema } from "@/lib/jsonld";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://myshaadistore.com";

export const metadata = {
  title: "Wedding Shopping",
  description:
    "Shop curated wedding products on MyShaadiStore — bridal outfits, décor, gifts, invitations, jewellery, and more. Secure checkout with fast delivery across India.",
  keywords: [
    "wedding shopping India",
    "bridal outfits",
    "wedding decor products",
    "wedding gifts",
    "wedding invitations",
    "buy wedding items online",
  ],
  alternates: { canonical: `${SITE_URL}/shopping` },
  openGraph: { url: `${SITE_URL}/shopping`, type: "website" },
};

export default async function ShoppingPage({ searchParams }) {
  const pageUrl = `${SITE_URL}/shopping`;
  return (
    <>
      <JsonLd
        data={webPageSchema({
          title: "Wedding Shopping | MyShaadiStore",
          description: metadata.description,
          url: pageUrl,
          breadcrumbs: [
            { name: "Home", url: `${SITE_URL}/` },
            { name: "Shopping", url: pageUrl },
          ],
        })}
      />
      <ShoppingPageServer searchParams={searchParams} />
    </>
  );
}
