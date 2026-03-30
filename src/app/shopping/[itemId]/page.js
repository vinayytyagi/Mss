import ShoppingItemPageServer from "@/components/server/ShoppingItemPageServer";
import { fetchItem } from "@/lib/api";

export async function generateMetadata({ params }) {
  const { itemId } = await params;

  try {
    const item = await fetchItem(itemId);
    const title = item?.name ? `${item.name} | MyShaadiStore` : "Shopping Item | MyShaadiStore";
    const description =
      item?.description ||
      item?.subcategory_label ||
      item?.category_label ||
      item?.item_type ||
      "Explore details and related products.";

    return { title, description };
  } catch {
    return {
      title: "Shopping Item | MyShaadiStore",
      description: "Explore details and related products.",
    };
  }
}

export default async function ShoppingProductPage({ params }) {
  return (
    <ShoppingItemPageServer
      params={params}
    />
  );
}
