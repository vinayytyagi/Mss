import ProductDetailPage from "@/components/ProductDetailPage";
import JsonLd from "@/components/JsonLd";
import { fetchItem } from "@/lib/api";
import { productSchema, breadcrumbSchema } from "@/lib/jsonld";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://myshaadistore.com";

export async function generateMetadata({ params }) {
  const { itemId } = await params;
  try {
    const item = await fetchItem(itemId);
    const title = item?.name ?? "Shopping Item";
    const description =
      item?.description ||
      item?.subcategory_label ||
      item?.category_label ||
      "Explore details and add to your wedding shopping cart.";
    const image =
      (Array.isArray(item?.images) ? item.images[0] : item?.image) ||
      `${SITE_URL}/Circular_logo.png`;

    return {
      title,
      description,
      keywords: [item?.name, item?.category_label, item?.subcategory_label, "wedding shopping India"].filter(Boolean),
      alternates: { canonical: `${SITE_URL}/shopping/${itemId}` },
      openGraph: {
        title,
        description,
        url: `${SITE_URL}/shopping/${itemId}`,
        type: "website",
        images: [{ url: image, alt: title }],
      },
      twitter: { card: "summary_large_image", title, description, images: [image] },
    };
  } catch {
    return {
      title: "Shopping Item",
      description: "Explore details and add to your wedding shopping cart.",
      alternates: { canonical: `${SITE_URL}/shopping/${itemId}` },
    };
  }
}

export default async function ShoppingProductPage({ params }) {
  const { itemId } = await params;

  // Fetch for JSON-LD — Next.js deduplicates this with the generateMetadata call
  let schemas = null;
  try {
    const item = await fetchItem(itemId);
    if (item) {
      schemas = [
        productSchema(item),
        breadcrumbSchema([
          { name: "Home", url: `${SITE_URL}/` },
          { name: "Shopping", url: `${SITE_URL}/shopping` },
          { name: item.name, url: `${SITE_URL}/shopping/${itemId}` },
        ]),
      ];
    }
  } catch { /* schema is non-critical */ }

  return (
    <>
      {schemas && <JsonLd data={schemas} />}
      {/* Unified detail experience — both /items/[id] and /shopping/[id]
          now render the same polished PDP so every item detail page is
          consistent (variants + shopping cart + specs + policies). */}
      <ProductDetailPage itemId={itemId} />
    </>
  );
}
