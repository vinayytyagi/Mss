import Image from "next/image";
import Link from "next/link";
import { Home, RotateCcw, Star, Truck } from "lucide-react";
import BasketButton from "@/components/BasketButton";
import CartActionButtons from "@/components/CartActionButtons";
import ShoppingProductCard from "@/components/ShoppingProductCard";
import ShoppingProductDetailControls from "@/components/ShoppingProductDetailControls";
import { formatPriceDetailed, getItemImage } from "@/lib/shopUi";

function RatingSummaryRow() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <span className="flex items-center gap-0.5" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" strokeWidth={0} />
        ))}
        <Star className="h-5 w-5 text-slate-300" fill="none" strokeWidth={1.6} />
      </span>
      <span className="text-slate-400">(150 Reviews)</span>
      <span className="hidden h-4 w-px bg-slate-300 sm:block" aria-hidden />
      <span className="text-base font-medium text-emerald-600">In Stock</span>
    </div>
  );
}

export default function ShoppingProductDetail({ item, categories, relatedItems = [] }) {
  const category = categories.find((entry) => entry.category_id === item.category_id) || null;
  const subcategory = categories.find((entry) => entry.category_id === item.subcategory_id) || null;
  const detailImages = item.images?.length ? item.images : [getItemImage(item, 0)];
  const primaryImage = detailImages[0];
  const backQuery = new URLSearchParams();
  if (category?.category_id) backQuery.set("category", category.category_id);
  if (subcategory?.category_id) backQuery.set("subcategory", subcategory.category_id);
  const backHref = `/shopping${backQuery.toString() ? `?${backQuery.toString()}` : ""}`;

  const cartItem = {
    ...item,
    image: primaryImage,
    category_label: category?.name || "",
    subcategory_label: subcategory?.name || "",
    source: "shopping",
  };

  const description =
    item.description ||
    "Thoughtfully added to help you shop wedding essentials with ease. Premium fabric and craftsmanship for your celebration.";

  return (
    <main className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50"
            aria-label="Home"
          >
            <Home className="h-5 w-5" strokeWidth={2} />
          </Link>
          <Link href={backHref} className="text-sm font-medium text-slate-500 underline-offset-4 hover:text-[#ff4f86] hover:underline">
            Back to shopping
          </Link>
        </div>

        <section className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-xl bg-[#fff4f7] p-6 sm:p-8">
              <div className="relative mx-auto aspect-3/4 max-h-[520px] w-full max-w-md">
                <Image
                  src={primaryImage}
                  alt={item.name}
                  fill
                  className="object-contain object-center"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                  unoptimized
                />
              </div>
            </div>

            {detailImages.length > 1 ? (
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-4">
                {detailImages.slice(0, 4).map((image, index) => (
                  <div key={image || index} className="relative aspect-square overflow-hidden rounded-md bg-[#fff4f7] p-2">
                    <Image
                      src={image}
                      alt={`${item.name} — image ${index + 1}`}
                      fill
                      className="object-contain object-center"
                      sizes="120px"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{item.name}</h1>

            <div className="mt-4">
              <RatingSummaryRow />
            </div>

            <div className="mt-6 flex flex-wrap items-baseline gap-3">
              <p className="text-3xl font-semibold text-slate-900 sm:text-[2rem]">
                {formatPriceDetailed(item.final_price || item.price)}
              </p>
              {item.is_discount_active ? (
                <>
                  <span className="text-xl font-medium text-slate-400 line-through">
                    {formatPriceDetailed(item.price)}
                  </span>
                  <span className="rounded-md bg-[#fff1f6] px-2.5 py-0.5 text-sm font-semibold text-[#ff4f86]">
                    {item.discount_percentage}% off
                  </span>
                </>
              ) : null}
            </div>

            <p className="mt-6 text-base leading-7 text-slate-600 text-justify">{description}</p>

            <div className="my-8 h-px w-full bg-slate-200" />

            <ShoppingProductDetailControls cartItem={cartItem} />

            <div className="mt-10 rounded-lg border border-slate-200 bg-white px-5 py-5">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-700">
                  <Truck className="h-5 w-5" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold text-slate-900">Free Delivery</p>
                  <button
                    type="button"
                    className="mt-1 text-left text-sm text-slate-600 underline decoration-slate-400 underline-offset-2 transition hover:text-[#ff4f86]"
                  >
                    Enter your postal code for Delivery Availability
                  </button>
                </div>
              </div>

              <div className="my-5 h-px bg-slate-200" />

              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-700">
                  <RotateCcw className="h-5 w-5" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold text-slate-900">Return Delivery</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    Free 30 Days Delivery Returns.{" "}
                    <button
                      type="button"
                      className="font-medium text-slate-800 underline decoration-slate-400 underline-offset-2 hover:text-[#ff4f86]"
                    >
                      Details
                    </button>
                  </p>
                  {(item.policies?.returnable || item.policies?.return_policy_text) && (
                    <p className="mt-2 text-xs text-slate-500">
                      {item.policies?.return_policy_text ||
                        (item.policies?.returnable
                          ? `Returns within ${item.policies?.return_window_days || 30} days where applicable.`
                          : null)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <CartActionButtons
                item={cartItem}
                showQuotation
                showShopping={false}
                quotationLabel="Add to Quote"
                layout="row"
              />
            </div>

          </div>
        </section>

        <section className="mt-16 border-t border-slate-100 pt-12">
          <div className="mb-8 flex items-center gap-3">
            <span className="h-9 w-2 shrink-0 rounded-full bg-[#ff4f86]" aria-hidden />
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Related Items</h2>
          </div>

          {relatedItems.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {relatedItems.map((relatedItem, index) => (
                <ShoppingProductCard key={relatedItem.item_id} item={relatedItem} index={index} compact />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-6 py-12 text-center text-slate-500">
              No related items found in the same category yet.
            </div>
          )}
        </section>
      </div>

      <div className="hidden md:block">
        <BasketButton floating />
      </div>
    </main>
  );
}
