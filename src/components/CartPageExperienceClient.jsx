"use client";

import { useRouter, useSearchParams } from "next/navigation";
import CartItemsClient from "@/components/CartItemsClient";
import CartActionsClient from "@/components/CartActionsClient";

export default function CartPageExperienceClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const activeCart = tabParam === "quotation" ? "quotation" : "shopping";

  function setActiveCart(tab) {
    router.replace(`/cart?tab=${tab}`, { scroll: false });
  }

  return (
    <section className="mt-6">
      <section className="grid gap-7 xl:grid-cols-[1.18fr_0.82fr]">
        <div className="xl:sticky xl:top-24 xl:self-start">
          <div className="mb-5 inline-flex rounded-2xl border border-border bg-surface-muted p-1.5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
            <button
              type="button"
              onClick={() => setActiveCart("quotation")}
              className={`h-10 rounded-xl px-5 text-sm font-semibold transition ${
                activeCart === "quotation"
                  ? "bg-surface text-primary shadow-[0_4px_12px_rgba(15,23,42,0.08)]"
                  : "text-muted hover:text-text"
              }`}
            >
              Quotation Cart
            </button>
            <button
              type="button"
              onClick={() => setActiveCart("shopping")}
              className={`h-10 rounded-xl px-5 text-sm font-semibold transition ${
                activeCart === "shopping"
                  ? "bg-surface text-primary shadow-[0_4px_12px_rgba(15,23,42,0.08)]"
                  : "text-muted hover:text-text"
              }`}
            >
              Shopping Cart
            </button>
          </div>
          <CartItemsClient activeCart={activeCart} />
        </div>
        <div className="xl:self-start">
          <CartActionsClient activeCart={activeCart} />
        </div>
      </section>
    </section>
  );
}
