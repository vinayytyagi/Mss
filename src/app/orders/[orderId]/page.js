import OrderDetailPageServer from "@/components/server/OrderDetailPageServer";

export const metadata = {
  title: "Order Details",
  description: "Detailed view of your MyShaadiStore order — items, vendors, delivery tracking, invoices and return options, all in one screen.",
  robots: { index: false, follow: false },
};

export default async function OrderDetailPage({ params }) {
  return (
    <OrderDetailPageServer
      params={params}
    />
  );
}
