"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, Star } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, getItemImage, truncateText } from "@/lib/shopUi";

function reviewCountFromItemId(id) {
  const s = String(id ?? "");
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  }
  return 40 + Math.abs(h % 71);
}

export default function ShoppingProductCard({ item, index = 0, compact = false }) {
  const image = getItemImage(item, index);
  const href = `/shopping/${item.item_id}`;
  const price = Number(item.final_price ?? item.price ?? 0);
  const [wishlisted, setWishlisted] = useState(false);
  const imgClass = compact ? "h-44" : "h-52";
  const reviews = reviewCountFromItemId(item.item_id);

  return (
    <article className="group overflow-hidden rounded-xl border border-slate-100/90 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-shadow duration-200 hover:shadow-[0_14px_44px_rgba(15,23,42,0.09)]">
      <div className="relative">
        <Link href={href} className="block p-3 pb-2">
          <div className={`relative w-full overflow-hidden rounded-lg bg-slate-100 ${imgClass}`}>
            <Image
              src={image}
              alt={item.name}
              fill
              className="object-contain object-center p-1 transition duration-300 group-hover:scale-[1.02]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              unoptimized
            />
          </div>
        </Link>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setWishlisted((w) => {
              const next = !w;
              toast.message(next ? "Saved to wishlist" : "Removed from wishlist");
              return next;
            });
          }}
          className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white shadow-md transition hover:bg-slate-800"
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wishlisted}
        >
          <Heart className={`h-5 w-5 ${wishlisted ? "fill-white" : ""}`} strokeWidth={2} />
        </button>
      </div>

      <Link href={href} className="block px-4 pb-4 pt-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 flex-1 text-base font-bold leading-snug text-slate-900 line-clamp-2">{item.name}</h3>
          <span className="shrink-0 text-base font-bold tabular-nums text-slate-900">{formatCurrency(price)}</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 line-clamp-2">
          {truncateText(item.description || "Curated wedding essential for your celebration.", 72)}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star
              key={i}
              className="h-4 w-4 fill-emerald-500 text-emerald-500"
              strokeWidth={0}
              aria-hidden
            />
          ))}
          <span className="ml-0.5 text-sm text-slate-400">({reviews})</span>
        </div>
      </Link>
    </article>
  );
}
