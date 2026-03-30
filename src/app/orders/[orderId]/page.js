import OrderDetailPageServer from "@/components/server/OrderDetailPageServer";

export const metadata = {
  title: "Order Details | MyShaadiStore",
  description: "View your order details, items, and tracking information",
};

export default async function OrderDetailPage({ params }) {
  return (
    <OrderDetailPageServer
      params={params}
    />
  );
}
