"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Minus, Plus } from "lucide-react";
import { addToCart } from "@/lib/cartStore";
import { toast } from "sonner";
import { fetchItemVariants } from "@/lib/api/variantsApi";

function uniq(arr) {
  return Array.from(new Set(arr.filter(Boolean)));
}

function isCssColor(value) {
  if (typeof window === "undefined") return false;
  const v = String(value || "").trim();
  if (!v) return false;
  return window.CSS?.supports?.("color", v) || false;
}

function ColorSwatch({ color, active }) {
  const canRender = isCssColor(color);
  return (
    <span
      className={`inline-flex h-6 w-6 items-center justify-center rounded-full border ${
        active ? "border-text-strong" : "border-border-strong"
      }`}
      style={canRender ? { backgroundColor: String(color).trim() } : undefined}
      aria-hidden="true"
      title={String(color || "")}
    >
      {!canRender ? (
        <span className="text-[10px] font-black text-text">
          {String(color || "").trim().slice(0, 1).toUpperCase()}
        </span>
      ) : null}
    </span>
  );
}

export default function ShoppingProductDetailControls({ cartItem, onVariantChange }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [variantsData, setVariantsData] = useState(null);

  const variants = Array.isArray(variantsData?.variants) ? variantsData.variants : [];
  const sizes = useMemo(() => uniq(variants.map((v) => v.size)), [variants]);
  const colors = useMemo(() => uniq(variants.map((v) => v.color)), [variants]);
  const materials = useMemo(() => uniq(variants.map((v) => v.material)), [variants]);

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchItemVariants(cartItem.item_id)
      .then((d) => {
        if (!alive) return;
        setVariantsData(d);
      })
      .catch(() => {
        if (!alive) return;
        setVariantsData({ variants: [] });
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [cartItem.item_id]);

  useEffect(() => {
    if (!variants.length) return;
    if (!selectedSize && sizes.length) setSelectedSize(sizes[0]);
    if (!selectedColor && colors.length) setSelectedColor(colors[0]);
    if (!selectedMaterial && materials.length) setSelectedMaterial(materials[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantsData]);

  const selectedVariant = useMemo(() => {
    if (!variants.length) return null;
    const exact = variants.find(
      (v) =>
        (selectedSize ? v.size === selectedSize : true) &&
        (selectedColor ? v.color === selectedColor : true) &&
        (selectedMaterial ? v.material === selectedMaterial : true),
    );
    return exact || variants[0] || null;
  }, [variants, selectedSize, selectedColor, selectedMaterial]);

  useEffect(() => {
    if (!selectedVariant) return;
    onVariantChange?.(selectedVariant);
  }, [selectedVariant?.variant_id]);

  function handleBuyNow() {
    const variantPayload = selectedVariant
      ? {
          variant_id: selectedVariant.variant_id,
          variant_size: selectedVariant.size || "",
          variant_color: selectedVariant.color || "",
          variant_material: selectedVariant.material || "",
          price: Number(selectedVariant.price) || cartItem.price,
          final_price: Number(selectedVariant.price) || cartItem.final_price || cartItem.price,
        }
      : {};
    addToCart("shopping", { ...cartItem, ...variantPayload }, quantity);
    toast.success("Added to cart");
    router.push("/cart");
  }

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="text-sm font-semibold text-muted">Loading options…</div>
      ) : variants.length ? (
        <>
          {colors.length ? (
            <div>
              <p className="text-base font-medium text-text-strong">Colour:</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {colors.map((c) => {
                  const active = selectedColor === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`flex h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition ${
                        active
                          ? "border-primary bg-primary-soft text-primary"
                          : "border-border-strong bg-surface text-text hover:border-border-strong"
                      }`}
                      aria-pressed={active}
                    >
                      <ColorSwatch color={c} active={active} />
                      <span className="max-w-[9rem] truncate">{c}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {sizes.length ? (
            <div>
              <p className="text-base font-medium text-text-strong">Size:</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {sizes.map((size) => {
                  const active = selectedSize === size;
                  const disabled = variants.some((v) => v.size === size) && variants.filter((v) => v.size === size).every((v) => Number(v.stock_quantity) <= 0);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      disabled={disabled}
                      className={`flex h-11 min-w-12 items-center justify-center rounded-lg border px-4 text-sm font-semibold transition ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border-strong bg-surface text-text hover:border-border-strong"
                      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                      aria-pressed={active}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {materials.length ? (
            <div>
              <p className="text-base font-medium text-text-strong">Material:</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {materials.map((m) => {
                  const active = selectedMaterial === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSelectedMaterial(m)}
                      className={`flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition ${
                        active
                          ? "border-primary bg-primary-soft text-primary"
                          : "border-border-strong bg-surface text-text hover:border-border-strong"
                      }`}
                      aria-pressed={active}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-12 items-stretch overflow-hidden rounded-lg border border-border-strong bg-surface">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex w-11 items-center justify-center bg-primary text-primary-foreground transition hover:bg-primary-hover"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" strokeWidth={2.25} />
          </button>
          <span className="flex min-w-12 items-center justify-center border-x border-border-strong text-base font-semibold text-text-strong">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="flex w-11 items-center justify-center bg-primary text-primary-foreground transition hover:bg-primary-hover"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>

        <button
          type="button"
          onClick={handleBuyNow}
          className="h-12 min-w-[min(100%,14rem)] flex-1 rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover"
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
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border-strong bg-surface transition hover:bg-surface-muted ${
            wishlisted ? "text-primary" : "text-text-strong"
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
