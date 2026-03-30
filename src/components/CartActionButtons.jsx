"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/lib/cartStore";
import { toast } from "sonner";

function baseButtonClass(kind) {
  if (kind === "quotation") {
    return "rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50";
  }
  return "rounded-2xl bg-[#ff4f86] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(255,79,134,0.2)] transition hover:bg-[#ff3d79]";
}

export default function CartActionButtons({
  item,
  showQuotation = true,
  showShopping = false,
  quotationLabel = "Add to Basket",
  shoppingLabel = "Add to Cart",
  layout = "row",
  redirectOnShoppingAdd = false,
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState("");

  function flash(message) {
    setFeedback(message);
    toast.success(message);
    window.setTimeout(() => setFeedback(""), 1400);
  }

  function handleAdd(type) {
    addToCart(type, item, 1);
    flash(type === "quotation" ? "Added to basket" : "Added to shopping cart");
    if (type === "shopping" && redirectOnShoppingAdd) {
      router.push("/cart");
    }
  }

  return (
    <div className={`flex ${layout === "column" ? "flex-col" : "flex-wrap"} gap-3`}>
      {showQuotation ? (
        <button type="button" onClick={() => handleAdd("quotation")} className={baseButtonClass("quotation")}>
          {feedback === "Added to basket" ? "Added" : quotationLabel}
        </button>
      ) : null}

      {showShopping ? (
        <button type="button" onClick={() => handleAdd("shopping")} className={baseButtonClass("shopping")}>
          {feedback === "Added to shopping cart" ? "Added" : shoppingLabel}
        </button>
      ) : null}
    </div>
  );
}
