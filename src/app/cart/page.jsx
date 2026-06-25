import CartPageServer from "@/components/server/CartPageServer";

export const metadata = {
  title: "Cart",
  description: "Review your wedding Quote cart and Shop cart, compare vendor quotes, and check out securely with Razorpay — fast pan-India delivery.",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <CartPageServer />
  );
}
