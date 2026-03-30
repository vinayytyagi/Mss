import CartPageServer from "@/components/server/CartPageServer";

export const metadata = {
  title: "Cart | MyShaadiStore",
  description: "Review your quotation and shopping cart and checkout securely.",
};

export default function CartPage() {
  return (
    <CartPageServer />
  );
}
