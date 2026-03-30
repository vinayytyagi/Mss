import MyOrdersClient from "@/components/MyOrdersClient";
import { getAuthTokenServer } from "@/lib/authCookiesServer";
import { fetchMyOrders } from "@/lib/api";

export default async function OrdersPageServer() {
  const token = await getAuthTokenServer();
  let initialOrders = [];
  let initialError = "";

  if (token) {
    try {
      const data = await fetchMyOrders(token);
      initialOrders = data.orders || [];
    } catch (err) {
      initialError = err.message || "Failed to load orders";
    }
  }

  return (
    <MyOrdersClient
      initialOrders={initialOrders}
      initialError={initialError}
      hasServerSession={Boolean(token)}
    />
  );
}

