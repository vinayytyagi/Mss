import OrdersPageServer from "@/components/server/OrdersPageServer";

export const metadata = {
  title: "My Orders",
  description: "All your MyShaadiStore wedding orders in one place — view status, download invoices, raise returns and track deliveries across vendors.",
  robots: { index: false, follow: false },
};

export default async function OrdersPage() {
  return (
    <OrdersPageServer />
  );
}
