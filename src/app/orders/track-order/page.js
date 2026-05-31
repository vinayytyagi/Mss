import TrackOrderPageServer from "@/components/server/TrackOrderPageServer";

export const metadata = {
  title: "Track Your Order",
  description: "Track any MyShaadiStore order live — enter your order number and phone to see real-time delivery status without logging in.",
};

export default function TrackOrderPage() {
  return <TrackOrderPageServer />;
}
