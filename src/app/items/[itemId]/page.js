import ProductDetailPage from "@/components/ProductDetailPage";
import { fetchItem } from "@/lib/api";

export async function generateMetadata({ params }) {
  const { itemId } = await params;
  try {
    const item = await fetchItem(itemId);
    const title = item?.name ? `${item.name} | MyShaadiStore` : "Item | MyShaadiStore";
    const description =
      item?.description ||
      item?.subcategory_label ||
      item?.category_label ||
      item?.item_type ||
      "Explore details and add to your wedding plan.";
    return { title, description };
  } catch {
    return {
      title: "Item | MyShaadiStore",
      description: "Explore item details and add to your wedding plan.",
    };
  }
}

export default async function Page({ params }) {
  const { itemId } = await params;
  return <ProductDetailPage itemId={itemId} />;
}
