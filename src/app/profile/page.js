import ProfilePageServer from "@/components/server/ProfilePageServer";

export const metadata = {
  title: "My Profile | MyShaadiStore",
  description: "View and manage your MyShaadiStore profile, addresses, and wedding details",
};

export default async function ProfilePage() {
  return (
    <ProfilePageServer />
  );
}
