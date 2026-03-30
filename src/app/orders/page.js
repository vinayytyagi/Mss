import OrdersPageServer from "@/components/server/OrdersPageServer";

export const metadata = {
  title: "My Orders | MyShaadiStore",
  description: "View and track all your MyShaadiStore orders",
};

export default async function OrdersPage() {
  return (
    <OrdersPageServer />
  );
}
