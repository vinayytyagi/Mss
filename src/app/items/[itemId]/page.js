import ProductDetailPage from "@/components/ProductDetailPage";
import JsonLd from "@/components/JsonLd";
import { fetchItem } from "@/lib/api";
import { productSchema, breadcrumbSchema } from "@/lib/jsonld";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://myshaadistore.com";

export async function generateMetadata({ params }) {
  const { itemId } = await params;
  try {
    const item = await fetchItem(itemId);
    const title = item?.name ?? "Item";
    const description =
      item?.description ||
      item?.subcategory_label ||
      item?.category_label ||
      "Explore item details and add to your wedding plan.";
    const image =
      (Array.isArray(item?.images) ? item.images[0] : item?.image) ||
      `${SITE_URL}/Circular_logo.png`;

    return {
      title,
      description,
      keywords: [item?.name, item?.category_label, item?.subcategory_label, "wedding vendor India"].filter(Boolean),
      alternates: { canonical: `${SITE_URL}/items/${itemId}` },
      openGraph: {
        title,
        description,
        url: `${SITE_URL}/items/${itemId}`,
        type: "website",
        images: [{ url: image, alt: title }],
      },
      twitter: { card: "summary_large_image", title, description, images: [image] },
    };
  } catch {
    return {
      title: "Item",
      description: "Explore item details and add to your wedding plan.",
      alternates: { canonical: `${SITE_URL}/items/${itemId}` },
    };
  }
}

export default async function Page({ params }) {
  const { itemId } = await params;

  // Fetch for JSON-LD — deduplicated by Next.js fetch cache
  let schemas = null;
  try {
    const item = await fetchItem(itemId);
    if (item) {
      schemas = [
        productSchema(item),
        breadcrumbSchema([
          { name: "Home", url: `${SITE_URL}/` },
          { name: item.category_label || "Catalog", url: `${SITE_URL}/shopping` },
          { name: item.name, url: `${SITE_URL}/items/${itemId}` },
        ]),
      ];
    }
  } catch { /* schema is non-critical */ }

  return (
    <>
      {schemas && <JsonLd data={schemas} />}
      <ProductDetailPage itemId={itemId} />
    </>
  );
}
