import TrackOrderPageServer from "@/components/server/TrackOrderPageServer";

export const metadata = {
  title: "Track Your Order | MyShaadiStore",
  description: "Track your MyShaadiStore order using your order number and phone number",
};

export default function TrackPage() {
  return (
    <TrackOrderPageServer />
  );
}
