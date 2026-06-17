import SizeChartPage from "@/components/SizeChartPage";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://myshaadistore.com";

export const metadata = {
  title: "Size Chart",
  description:
    "Find your size with the MyShaadiStore size charts — measurement tables for blouses, lehengas, kurtas and more, all in inches.",
  keywords: ["size chart", "wedding outfit size", "blouse measurements", "kurta size guide"],
  alternates: { canonical: `${SITE_URL}/size-chart` },
  openGraph: { url: `${SITE_URL}/size-chart`, type: "website" },
};

export default function Page() {
  return <SizeChartPage />;
}
