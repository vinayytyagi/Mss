"use client";

import { useMemo, useState } from "react";
import { formatPriceDetailed } from "@/lib/shopUi";
import ShoppingProductDetailControls from "@/components/ShoppingProductDetailControls";

export default function ShoppingProductPurchasePanel({ item, cartItem }) {
  const [selectedVariant, setSelectedVariant] = useState(null);

  const effectivePrice = useMemo(() => {
    const v = selectedVariant;
    if (!v) return item?.final_price || item?.price || 0;
    return Number(v.price) || item?.final_price || item?.price || 0;
  }, [selectedVariant, item?.final_price, item?.price]);

  return (
    <>
      <div className="mt-6 flex flex-wrap items-baseline gap-3">
        <p className="text-3xl font-semibold text-text-strong sm:text-[2rem]">
          {formatPriceDetailed(effectivePrice)}
        </p>
        {item?.is_discount_active ? (
          <>
            <span className="text-xl font-medium text-subtle line-through">
              {formatPriceDetailed(item.price)}
            </span>
            <span className="rounded-md bg-primary-soft px-2.5 py-0.5 text-sm font-semibold text-primary">
              {item.discount_percentage}% off
            </span>
          </>
        ) : null}
      </div>

      <div className="my-8 h-px w-full bg-border-strong" />

      <ShoppingProductDetailControls
        cartItem={cartItem}
        onVariantChange={(variant) => {
          setSelectedVariant(variant);
        }}
      />
    </>
  );
}

