"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Minus, Plus } from "lucide-react";
import { addToCart } from "@/lib/cartStore";
import { toast } from "sonner";
const DEMO_COLORS = [
  { id: "beige", label: "Beige", className: "bg-[#e8dcc8]" },
  { id: "pink", label: "Pink", className: "bg-[#f9b4c9]" },
];

const DEMO_SIZES = ["S", "M", "L"];

export default function ShoppingProductDetailControls({ cartItem }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(DEMO_COLORS[0].id);
  const [selectedSize, setSelectedSize] = useState("M");
  const [wishlisted, setWishlisted] = useState(false);

  function handleBuyNow() {
    addToCart("shopping", cartItem, quantity);
    toast.success("Added to cart");
    router.push("/cart");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-base font-medium text-slate-800">Colours:</p>
        <div className="mt-3 flex gap-3">
          {DEMO_COLORS.map((c) => {
            const active = selectedColor === c.id;
            return (
              <button
                key={c.id}
                type="button"
                title={c.label}
                onClick={() => setSelectedColor(c.id)}
                className={`relative h-9 w-9 rounded-full border border-slate-200/80 shadow-sm transition ${c.className} ${
                  active ? "ring-2 ring-slate-900 ring-offset-2" : "hover:opacity-90"
                }`}
                aria-label={`Colour ${c.label}`}
                aria-pressed={active}
              />
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-base font-medium text-slate-800">Size:</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DEMO_SIZES.map((size) => {
            const active = selectedSize === size;
            return (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size)}
                className={`flex h-11 min-w-12 items-center justify-center rounded-lg border px-4 text-sm font-semibold transition ${
                  active
                    ? "border-[#ff4f86] bg-[#ff4f86] text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
                aria-pressed={active}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-12 items-stretch overflow-hidden rounded-lg border border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex w-11 items-center justify-center text-slate-600 transition hover:bg-slate-50"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" strokeWidth={2.25} />
          </button>
          <span className="flex min-w-12 items-center justify-center border-x border-slate-200 text-base font-semibold text-slate-900">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="flex w-11 items-center justify-center bg-[#ff4f86] text-white transition hover:bg-[#ff3d79]"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>

        <button
          type="button"
          onClick={handleBuyNow}
          className="h-12 min-w-[min(100%,14rem)] flex-1 rounded-lg bg-[#ff4f86] px-8 text-base font-semibold text-white shadow-sm transition hover:bg-[#ff3d79]"
        >
          Buy Now
        </button>

        <button
          type="button"
          onClick={() => {
            setWishlisted((w) => {
              const next = !w;
              toast.message(next ? "Saved to wishlist" : "Removed from wishlist");
              return next;
            });
          }}
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white transition hover:bg-slate-50 ${
            wishlisted ? "text-[#ff4f86]" : "text-slate-900"
          }`}
          aria-pressed={wishlisted}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`h-5 w-5 ${wishlisted ? "fill-current" : ""}`} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
