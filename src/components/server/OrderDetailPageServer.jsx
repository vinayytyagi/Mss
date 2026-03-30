import OrderDetailClient from "@/components/OrderDetailClient";
import { getAuthTokenServer, getAuthUserServer } from "@/lib/authCookiesServer";
import { fetchMyOrders, trackOrder } from "@/lib/api";

export default async function OrderDetailPageServer({ params }) {
  const { orderId } = await params;
  const token = await getAuthTokenServer();
  const user = await getAuthUserServer();
  let initialOrder = null;
  let initialTracking = null;
  let initialError = "";

  if (token) {
    try {
      const ordersRes = await fetchMyOrders(token);
      const orders = ordersRes?.orders || [];
      initialOrder = orders.find((o) => o._id === orderId || o.order_number === orderId) || null;
      if (!initialOrder) {
        initialError = "Order not found";
      } else if (initialOrder.shipment?.awb_code && user?.phone) {
        try {
          initialTracking = await trackOrder(initialOrder.order_number, user.phone);
        } catch {
          initialTracking = null;
        }
      }
    } catch (err) {
      initialError = err.message || "Failed to load order";
    }
  }

  return (
    <OrderDetailClient
      initialOrder={initialOrder}
      initialTracking={initialTracking}
      initialError={initialError}
      hasServerSession={Boolean(token)}
    />
  );
}

