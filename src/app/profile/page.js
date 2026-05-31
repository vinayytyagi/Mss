import ProfilePageServer from "@/components/server/ProfilePageServer";

export const metadata = {
  title: "My Profile",
  description: "Manage your MyShaadiStore account — update wedding details, delivery addresses, preferences and notification settings in one secure dashboard.",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  return (
    <ProfilePageServer />
  );
}
