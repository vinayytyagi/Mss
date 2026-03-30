import ProfileClient from "@/components/ProfileClient";
import { getAuthTokenServer } from "@/lib/authCookiesServer";
import { fetchMyOrders, fetchMyProfile } from "@/lib/api";

export default async function ProfilePageServer() {
  const token = await getAuthTokenServer();
  let initialProfile = null;
  let initialOrders = [];

  if (token) {
    const [profileRes, ordersRes] = await Promise.allSettled([
      fetchMyProfile(token),
      fetchMyOrders(token),
    ]);

    if (profileRes.status === "fulfilled") {
      initialProfile = profileRes.value;
    }

    if (ordersRes.status === "fulfilled") {
      initialOrders = ordersRes.value?.orders || [];
    }
  }

  return (
    <ProfileClient
      initialProfile={initialProfile}
      initialOrders={initialOrders}
      hasServerSession={Boolean(token)}
    />
  );
}

