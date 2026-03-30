import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronsDown } from "lucide-react";
import BasketButton from "@/components/BasketButton";
import ShoppingProductCard from "@/components/ShoppingProductCard";
import { isProductItem } from "@/lib/shopUi";

function buildQuery(categoryId, subcategoryId) {
  const qs = new URLSearchParams();
  if (categoryId) qs.set("category", categoryId);
  if (subcategoryId) qs.set("subcategory", subcategoryId);
  const query = qs.toString();
  return query ? `?${query}` : "";
}

export default function ShoppingCatalog({
  step,
  categories,
  items,
  selectedCategoryId = "",
  selectedSubcategoryId = "",
}) {
  const productItems = items.filter(isProductItem);
  const topCategories = categories.filter((category) => !category.parent_category_id);
  const selectedCategory =
    topCategories.find((category) => category.category_id === selectedCategoryId) || null;
  const visibleSubcategories = selectedCategory
    ? categories.filter((category) => category.parent_category_id === selectedCategory.category_id)
    : [];
  const selectedSubcategory =
    visibleSubcategories.find((category) => category.category_id === selectedSubcategoryId) || null;

  const filteredItems = productItems.filter((item) => {
    if (selectedCategory && item.category_id !== selectedCategory.category_id) return false;
    if (selectedSubcategory && item.subcategory_id !== selectedSubcategory.category_id) return false;
    return true;
  });

  const showcaseCategories = topCategories.slice(0, 6);
  const filterSubcategories = visibleSubcategories.length
    ? visibleSubcategories
    : categories.filter((category) => !category.parent_category_id).slice(0, 6);

  return (
    <main className="mx-auto w-full px-4 pb-8 pt-5 sm:px-6 lg:px-8">
      <section className="rounded-[28px] bg-[#efedf0] p-5 sm:p-7">
        <div className="relative min-h-[220px]">
          <h1 className="pt-8 text-center text-2xl font-medium leading-tight text-[#75152f] sm:pt-12 sm:text-3xl">
            Shop Curated Essentials for
            <br />
            Your Dream Wedding
          </h1>
          <div className="pointer-events-none absolute right-2 top-0 hidden h-[210px] w-[220px] md:block lg:h-[260px] lg:w-[300px]">
            <div className="h-full w-full rounded-b-[120px] rounded-t-[24px] bg-[#f4d8de]/40 p-2">
              <div className="relative h-full w-full">
                <Image
                  src="/shopping_header.png"
                  alt="Bride and groom in traditional wedding attire"
                  fill
                  className="object-contain object-bottom-right"
                  sizes="(max-width: 1024px) 220px, 300px"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <h2 className="text-2xl sm:text-3xl font-medium text-slate-900">Category</h2>
          <div className="no-scrollbar mt-4 flex items-center gap-0.5 overflow-x-auto overflow-y-visible rounded-[30px] bg-[#edd6df] px-0.5 py-2">
            {showcaseCategories.map((category) => {
              const isActive = selectedCategory?.category_id === category.category_id;
              const categoryImage =
                category.image_url ||
                productItems.find((item) => item.category_id === category.category_id)?.images?.[0] ||
                productItems.find((item) => item.category_id === category.category_id)?.image ||
                "";
              return (
                <Link
                  key={category.category_id}
                  href={`/shopping${buildQuery(category.category_id, "")}`}
                  className={`flex min-w-[165px] flex-1 cursor-pointer flex-col items-center justify-between rounded-[22px] border px-3 py-4 transition-transform duration-200 ease-out ${
                    isActive
                      ? "z-10 scale-110 border-[#88072f] bg-[#88072f] text-white shadow-md"
                      : "scale-100 border-transparent bg-[#edd6df] text-slate-700"
                  }`}
                >
                  <div className="relative h-24 w-full shrink-0">
                    {categoryImage ? (
                      <Image
                        src={categoryImage}
                        alt={category.name}
                        fill
                        className="object-contain object-center rounded-md"
                        sizes="165px"
                        unoptimized
                      />
                    ) : (
                      <div className="h-full w-full rounded-md bg-white/35" aria-hidden />
                    )}
                  </div>
                  <div className="mt-2 text-slate-300 flex items-center justify-center gap-1 text-center text-lg font-normal leading-tight sm:text-xl">
                    {isActive ? <span className="text-slate-300">{category.name}</span> : <span className="text-slate-900">{category.name}</span>}
                    {isActive ? (
                      <ChevronsDown className="h-5 w-5 shrink-0 text-slate-300" aria-hidden strokeWidth={2.25} />
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="no-scrollbar mt-6 flex items-center gap-3 overflow-x-auto rounded-full bg-transparent py-1">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ff4f86]" aria-hidden />
          <span className="h-7 w-px shrink-0 bg-[#caa8b6]" aria-hidden />
          <Link
            href={
              selectedCategory
                ? `/shopping${buildQuery(selectedCategory.category_id, "")}`
                : "/shopping"
            }
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-4 py-2 text-lg ${
              !selectedSubcategory ? "bg-[#f5de32] text-slate-900" : "text-[#a44f6b]"
            }`}
          >
            All
          </Link>
          {visibleSubcategories.map((sub) => (
            <Link
              key={sub.category_id}
              href={`/shopping${buildQuery(selectedCategory?.category_id || "", sub.category_id)}`}
              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-4 py-2 text-lg ${
                selectedSubcategory?.category_id === sub.category_id
                  ? "bg-[#f5de32] text-slate-900"
                  : "text-[#a44f6b]"
              }`}
            >
              {sub.name}
            </Link>
          ))}
          <button
            type="button"
            className="ml-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f5de32] text-[#8f1036]"
            aria-label="Scroll subcategories forward"
          >
            <ChevronRight className="h-6 w-6" strokeWidth={2.25} aria-hidden />
          </button>
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-[22px] bg-[#e6ced7] p-5">
          <h3 className="text-2xl font-medium text-[#7b1535]">Filters</h3>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm font-medium text-[#8f2748]">Subcategory</p>
              <div className="mt-2 space-y-2">
                {filterSubcategories.map((sub) => (
                  <label key={sub.category_id} className="flex items-center gap-2 text-sm text-[#9f5672]">
                    <input
                      type="checkbox"
                      checked={selectedSubcategory?.category_id === sub.category_id}
                      readOnly
                      className="h-3.5 w-3.5 rounded border border-[#d7afbe] accent-[#ff4f86]"
                    />
                    <Link
                      href={`/shopping${buildQuery(selectedCategory?.category_id || "", sub.category_id)}`}
                      className={`${
                        selectedSubcategory?.category_id === sub.category_id ? "font-semibold text-[#7b1535]" : ""
                      }`}
                    >
                      {sub.name}
                    </Link>
                  </label>
                ))}
              </div>
            </div>
            <div className="h-px w-full bg-[#c89eb0]" />
            <div>
              <p className="text-sm font-medium text-[#8f2748]">Fabric</p>
              <div className="mt-2 space-y-2 text-sm text-[#9f5672]">
                {["Silk", "Velvet", "Cotton", "Brocade", "Linen", "Jacquard"].map((fabric) => (
                  <label key={fabric} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border border-[#d7afbe] accent-[#ff4f86]"
                    />
                    {fabric}
                  </label>
                ))}
              </div>
            </div>
            <div className="h-px w-full bg-[#c89eb0]" />
            <div>
              <p className="text-sm font-medium text-[#8f2748]">Price</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input className="h-8 w-full rounded border border-[#dcb9c7] bg-white px-2 text-xs" placeholder="15,000" />
                <input className="h-8 w-full rounded border border-[#dcb9c7] bg-white px-2 text-xs" placeholder="60,000" />
              </div>
              <button className="mt-4 h-9 w-full rounded-full bg-[#ff4f86] text-sm font-semibold text-white">
                Filter
              </button>
            </div>
          </div>
        </aside>

        <div>
          {filteredItems.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item, index) => (
                <ShoppingProductCard key={item.item_id} item={item} index={index} />
              ))}
            </div>
          ) : (
            <div className="rounded-[22px] bg-[#f1dfe6] px-6 py-12 text-center text-[#8f2748]">
              No shopping products found for this selection.
            </div>
          )}

          <div className="mt-7 flex items-center justify-center gap-4 text-[#d19cb0]">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#d19cb0] transition hover:bg-[#f2dbe4]/80 hover:text-[#b96e88]"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-7 w-7" strokeWidth={2} />
            </button>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2dbe4] text-[#b96e88]">1</span>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#ff4f86] transition hover:bg-[#f2dbe4]/80"
              aria-label="Next page"
            >
              <ChevronRight className="h-7 w-7" strokeWidth={2} />
            </button>
          </div>
        </div>
      </section>

      <div className="hidden md:block">
        <BasketButton floating />
      </div>
    </main>
  );
}
