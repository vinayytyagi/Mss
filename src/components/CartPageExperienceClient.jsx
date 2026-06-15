"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Receipt, ShoppingCart } from "lucide-react";
import CartItemsClient from "@/components/CartItemsClient";
import CartActionsClient from "@/components/CartActionsClient";
import { useCartSummary } from "@/lib/cartStore";

function TabButton({ active, onClick, icon: Icon, label, count, accent }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group relative flex flex-1 items-center justify-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold transition ${
        active
          ? "bg-surface text-text-strong shadow-[0_6px_18px_rgba(15,23,42,0.08)]"
          : "text-muted hover:text-text"
      }`}
    >
      <Icon
        className={`h-4 w-4 ${active ? (accent === "quote" ? "text-[#d4720a]" : "text-primary") : "text-subtle group-hover:text-muted"}`}
        strokeWidth={2}
      />
      <span>{label}</span>
      <span
        className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold transition ${
          active
            ? accent === "quote"
              ? "bg-[#d4720a] text-white"
              : "bg-primary text-primary-foreground"
            : "bg-surface-muted text-muted group-hover:bg-border-strong"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

export default function CartPageExperienceClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { quotationCount, shoppingCount } = useCartSummary();

  const tabParam = searchParams.get("tab");
  const activeCart = tabParam === "quotation" ? "quotation" : "shopping";

  function setActiveCart(tab) {
    router.replace(`/cart?tab=${tab}`, { scroll: false });
  }

  return (
    <section className="mt-7 grid gap-7 xl:grid-cols-[1.18fr_0.82fr]">
      <div className="min-w-0 xl:sticky xl:top-24 xl:self-start">
        {/* Tab switcher */}
        <div className="mb-5 inline-flex w-full max-w-md rounded-2xl border border-border bg-surface-muted p-1.5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
          <TabButton
            active={activeCart === "quotation"}
            onClick={() => setActiveCart("quotation")}
            icon={Receipt}
            label="Quotation"
            count={quotationCount}
            accent="quote"
          />
          <TabButton
            active={activeCart === "shopping"}
            onClick={() => setActiveCart("shopping")}
            icon={ShoppingCart}
            label="Shopping Cart"
            count={shoppingCount}
            accent="shop"
          />
        </div>

        <CartItemsClient activeCart={activeCart} />
      </div>

      <div className="min-w-0 xl:self-start">
        <CartActionsClient activeCart={activeCart} />
      </div>
    </section>
  );
}
