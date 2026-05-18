import Image from "next/image";
import Link from "next/link";
import { Home, RotateCcw, Truck } from "lucide-react";
import BasketButton from "@/components/BasketButton";
import CartActionButtons from "@/components/CartActionButtons";
import ShoppingProductCard from "@/components/ShoppingProductCard";
import { getItemImage } from "@/lib/shopUi";
import ProductReviews from "@/components/ProductReviews";
import ShoppingProductPurchasePanel from "@/components/ShoppingProductPurchasePanel";
import ItemAttributesSpec from "@/components/ItemAttributesSpec";

export default function ShoppingProductDetail({ item, categories, relatedItems = [], attributeSchema = null }) {
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
    <main className="bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-strong text-text transition hover:bg-surface-muted"
            aria-label="Home"
          >
            <Home className="h-5 w-5" strokeWidth={2} />
          </Link>
          <Link href={backHref} className="text-sm font-medium text-muted underline-offset-4 hover:text-primary hover:underline">
            Back to shopping
          </Link>
        </div>

        <section className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-xl bg-primary-soft p-6 sm:p-8">
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
                  <div key={image || index} className="relative aspect-square overflow-hidden rounded-md bg-primary-soft p-2">
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
            <h1 className="text-3xl font-bold tracking-tight text-text-strong sm:text-4xl">{item.name}</h1>

            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-base font-medium text-success">In Stock</span>
              </div>
            </div>

            <p className="mt-6 text-base leading-7 text-muted text-justify">{description}</p>

            {item?.attributes && Object.keys(item.attributes).length > 0 ? (
              <div className="mt-8">
                <ItemAttributesSpec item={item} schema={attributeSchema} />
              </div>
            ) : null}

            <ShoppingProductPurchasePanel item={item} cartItem={cartItem} />

            <div className="mt-10 rounded-lg border border-border-strong bg-surface px-5 py-5">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-strong text-text">
                  <Truck className="h-5 w-5" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold text-text-strong">Free Delivery</p>
                  <button
                    type="button"
                    className="mt-1 text-left text-sm text-muted underline decoration-subtle underline-offset-2 transition hover:text-primary"
                  >
                    Enter your postal code for Delivery Availability
                  </button>
                </div>
              </div>

              <div className="my-5 h-px bg-border-strong" />

              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-strong text-text">
                  <RotateCcw className="h-5 w-5" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold text-text-strong">Return Delivery</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    Free 30 Days Delivery Returns.{" "}
                    <button
                      type="button"
                      className="font-medium text-text-strong underline decoration-subtle underline-offset-2 hover:text-primary"
                    >
                      Details
                    </button>
                  </p>
                  {(item.policies?.returnable || item.policies?.return_policy_text) && (
                    <p className="mt-2 text-xs text-muted">
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

        <ProductReviews itemId={item.item_id} />

        <section className="mt-16 border-t border-border pt-12">
          <div className="mb-8 flex items-center gap-3">
            <span className="h-9 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
            <h2 className="text-2xl font-bold tracking-tight text-text-strong">Related Items</h2>
          </div>

          {relatedItems.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {relatedItems.map((relatedItem, index) => (
                <ShoppingProductCard key={relatedItem.item_id} item={relatedItem} index={index} compact />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface-muted/80 px-6 py-12 text-center text-muted">
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
