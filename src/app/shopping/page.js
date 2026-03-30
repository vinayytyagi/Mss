import ShoppingPageServer from "@/components/server/ShoppingPageServer";

export const metadata = {
  title: "Shopping | MyShaadiStore",
  description: "Browse curated shopping items for your wedding journey stage.",
};

export default async function ShoppingPage({ searchParams }) {
  return (
    <ShoppingPageServer
      searchParams={searchParams}
    />
  );
}
