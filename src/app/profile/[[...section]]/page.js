import { notFound } from "next/navigation";
import ProfilePageServer from "@/components/server/ProfilePageServer";

export const metadata = {
  title: "My Profile",
  description:
    "Manage your MyShaadiStore account — track quotations, orders, wallet, wedding details, delivery addresses and preferences in one secure dashboard.",
  robots: { index: false, follow: false },
};

// Each profile tab is its own URL. This optional catch-all serves the bare
// /profile (the "profile" tab) plus /profile/<section> for every other tab, so
// switching tabs is a normal client navigation that stays mounted (no reload).
const VALID_SECTIONS = new Set([
  "wallet",
  "orders",
  "quotations",
  "wedding",
  "budget",
  "addresses",
  "settings",
]);

export default async function ProfilePage({ params }) {
  const { section } = await params;
  if (Array.isArray(section) && (section.length > 1 || !VALID_SECTIONS.has(section[0]))) {
    notFound();
  }
  return <ProfilePageServer />;
}
