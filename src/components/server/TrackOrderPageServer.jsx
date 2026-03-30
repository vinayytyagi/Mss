import TrackOrderClient from "@/components/TrackOrderClient";
import { fetchMyOrders } from "@/lib/api";
import { getAuthTokenServer, getAuthUserServer } from "@/lib/authCookiesServer";

export default async function TrackOrderPageServer() {
  const token = await getAuthTokenServer();
  const user = await getAuthUserServer();
  let initialOrders = [];

  if (token) {
    try {
      const ordersRes = await fetchMyOrders(token);
      initialOrders = Array.isArray(ordersRes?.orders) ? ordersRes.orders : [];
    } catch {
      initialOrders = [];
    }
  }

  return (
    <TrackOrderClient initialOrders={initialOrders} initialPhone={user?.phone || ""} />
  );
}

