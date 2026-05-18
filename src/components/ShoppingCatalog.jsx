import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ChevronsDown } from "lucide-react";
import BasketButton from "@/components/BasketButton";
import ShoppingItemsGrid from "@/components/ShoppingItemsGrid";
import ShoppingSidebar from "@/components/ShoppingSidebar";
import { isProductItem } from "@/lib/shopUi";
import ShoppingSearchBar from "@/components/ShoppingSearchBar";

function itemFabric(item) {
  const f = item?.attributes?.fabric || item?.attributes?.material;
  if (typeof f === "string") return f.trim();
  if (Array.isArray(f)) return f.map((v) => String(v).trim()).filter(Boolean);
  return null;
}

function matchesFabric(item, selectedFabrics) {
  if (!selectedFabrics?.length) return true;
  const f = itemFabric(item);
  if (!f) return false;
  if (Array.isArray(f)) {
    return selectedFabrics.some((sf) => f.some((iv) => iv.toLowerCase() === sf.toLowerCase()));
  }
  return selectedFabrics.some((sf) => sf.toLowerCase() === f.toLowerCase());
}

function matchesPrice(item, minPrice, maxPrice) {
  const price = Number(item?.final_price ?? item?.price ?? 0);
  if (minPrice != null && price < minPrice) return false;
  if (maxPrice != null && price > maxPrice) return false;
  return true;
}

function buildQuery(categoryId, subcategoryId, subSubcategoryId, search) {
  const qs = new URLSearchParams();
  if (categoryId) qs.set("category", categoryId);
  if (subcategoryId) qs.set("subcategory", subcategoryId);
  if (subSubcategoryId) qs.set("subSubcategory", subSubcategoryId);
  if (search && String(search).trim()) qs.set("search", String(search).trim());
  const query = qs.toString();
  return query ? `?${query}` : "";
}

export default function ShoppingCatalog({
  step,
  categories,
  items,
  selectedCategoryId = "",
  selectedSubcategoryId = "",
  selectedSubSubcategoryId = "",
  search = "",
  minPrice = null,
  maxPrice = null,
  selectedFabrics = [],
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
  const visibleSubSubcategories = selectedSubcategory
    ? categories.filter((category) => category.parent_category_id === selectedSubcategory.category_id)
    : [];
  const selectedSubSubcategory =
    visibleSubSubcategories.find((category) => category.category_id === selectedSubSubcategoryId) || null;
  const hasSubSubcategoryRow = visibleSubSubcategories.length > 0;

  // Apply sidebar facets on top of what the API returned (category/sub
  // filters happened server-side). The sidebar needs the unfiltered pool
  // to derive its facet list (fabrics, price range), so we hand it
  // `productItems` not `filteredItems`.
  const filteredItems = productItems
    .filter((item) => matchesFabric(item, selectedFabrics))
    .filter((item) => matchesPrice(item, minPrice, maxPrice));

  const showcaseCategories = topCategories.slice(0, 6);
  const filterSubcategories = visibleSubcategories.length
    ? visibleSubcategories
    : categories.filter((category) => !category.parent_category_id).slice(0, 6);

  return (
    <main className="mx-auto w-full px-4 pb-8 pt-5 sm:px-6 lg:px-8">
      <section className="rounded-[28px] bg-primary-soft p-5 sm:p-7">
        <div className="relative min-h-55">
          <h1 className="pt-8 text-center text-2xl font-medium leading-tight text-secondary sm:pt-12 sm:text-3xl">
            Shop Curated Essentials for
            <br />
            Your Dream Wedding
          </h1>
          <div className="mt-6 flex w-full justify-center">
            <div className="w-full max-w-2xl">
              <ShoppingSearchBar
                initialValue={search}
                category={selectedCategoryId}
                subcategory={selectedSubcategoryId}
                placeholder="Search bridal wear, decor, catering…"
              />
            </div>
          </div>
          <div className="pointer-events-none absolute right-2 top-0 hidden h-52.5 w-55 md:block lg:h-65 lg:w-75">
            <div className="h-full w-full rounded-b-[120px] rounded-t-3xl bg-primary-soft/40 p-2">
              <div className="relative h-full w-full">
                <Image
                  src="/shopping_header.webp"
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
          <h2 className="text-2xl sm:text-3xl font-medium text-text-strong">Category</h2>
          <div className="no-scrollbar mt-4 flex items-center gap-0.5 overflow-x-auto overflow-y-visible rounded-[30px] bg-primary-soft px-0.5 py-2">
            {showcaseCategories.map((category) => {
              const isActive = selectedCategory?.category_id === category.category_id;
              const categoryImage =
                category.image_url ||
                productItems.find((item) => item.category_id === category.category_id)?.images?.[0] ||
                productItems.find((item) => item.category_id === category.category_id)?.image ||
                "";
              const categoryHref = isActive
                ? `/shopping${buildQuery("", "", "", search)}`
                : `/shopping${buildQuery(category.category_id, "", "", search)}`;
              return (
                <Link
                  key={category.category_id}
                  href={categoryHref}
                  className={`flex min-w-41.25 flex-1 cursor-pointer flex-col items-center justify-between rounded-[22px] border px-3 py-4 transition-transform duration-200 ease-out ${
                    isActive
                      ? "z-10 scale-110 border-secondary bg-secondary text-primary-foreground shadow-md"
                      : "scale-100 border-transparent bg-primary-soft text-text"
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
                      <div className="h-full w-full rounded-md bg-surface/35" aria-hidden />
                    )}
                  </div>
                  <div className="mt-2 text-border-strong flex items-center justify-center gap-1 text-center text-lg font-normal leading-tight sm:text-xl">
                    {isActive ? <span className="text-border-strong">{category.name}</span> : <span className="text-text-strong">{category.name}</span>}
                    {isActive ? (
                      <ChevronsDown className="h-5 w-5 shrink-0 text-border-strong" aria-hidden strokeWidth={2.25} />
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="no-scrollbar mt-6 flex items-center gap-3 overflow-x-auto rounded-full bg-transparent py-1">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary" aria-hidden />
          <span className="h-7 w-px shrink-0 bg-primary-accent" aria-hidden />
          <Link
            href={
              selectedCategory
                ? `/shopping${buildQuery(selectedCategory.category_id, "", "", search)}`
                : `/shopping${buildQuery("", "", "", search)}`
            }
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-4 py-2 text-lg ${
              !selectedSubcategory ? "bg-[#f5de32] text-text-strong" : "text-secondary"
            }`}
          >
            All
          </Link>
          {visibleSubcategories.map((sub) => (
            (() => {
              const isSubActive = selectedSubcategory?.category_id === sub.category_id;
              // Switching subcategory always clears the deeper sub-sub filter.
              const href = isSubActive
                ? `/shopping${buildQuery(selectedCategory?.category_id || "", "", "", search)}`
                : `/shopping${buildQuery(selectedCategory?.category_id || "", sub.category_id, "", search)}`;
              return (
            <Link
              key={sub.category_id}
              href={href}
              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-4 py-2 text-lg ${
                isSubActive
                  ? "bg-[#f5de32] text-text-strong"
                  : "text-secondary"
              }`}
            >
              {sub.name}
            </Link>
              );
            })()
          ))}
          <button
            type="button"
            className="ml-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f5de32] text-secondary"
            aria-label="Scroll subcategories forward"
          >
            <ChevronRight className="h-6 w-6" strokeWidth={2.25} aria-hidden />
          </button>
        </div>

        {/* Sub-subcategory pill row — appears only when the picked subcategory has children. */}
        {hasSubSubcategoryRow ? (
          <div className="no-scrollbar mt-3 flex items-center gap-3 overflow-x-auto rounded-full bg-transparent py-1">
            <span className="flex h-3 w-3 shrink-0 items-center justify-center rounded-full bg-primary-accent" aria-hidden />
            <span className="h-5 w-px shrink-0 bg-primary-accent" aria-hidden />
            <Link
              href={`/shopping${buildQuery(selectedCategory?.category_id || "", selectedSubcategory?.category_id || "", "", search)}`}
              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm ${
                !selectedSubSubcategory ? "bg-[#f5de32] text-text-strong" : "text-secondary"
              }`}
            >
              All
            </Link>
            {visibleSubSubcategories.map((ss) => {
              const isActive = selectedSubSubcategory?.category_id === ss.category_id;
              const href = isActive
                ? `/shopping${buildQuery(selectedCategory?.category_id || "", selectedSubcategory?.category_id || "", "", search)}`
                : `/shopping${buildQuery(selectedCategory?.category_id || "", selectedSubcategory?.category_id || "", ss.category_id, search)}`;
              return (
                <Link
                  key={ss.category_id}
                  href={href}
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm ${
                    isActive ? "bg-[#f5de32] text-text-strong" : "text-secondary"
                  }`}
                >
                  {ss.name}
                </Link>
              );
            })}
          </div>
        ) : null}
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[260px_1fr]">
        <ShoppingSidebar
          items={productItems}
          filterSubcategories={filterSubcategories}
          selectedCategoryId={selectedCategory?.category_id || ""}
          selectedSubcategoryId={selectedSubcategory?.category_id || ""}
          search={search}
          selectedFabrics={selectedFabrics}
          minPrice={minPrice}
          maxPrice={maxPrice}
        />

        <div>
          <ShoppingItemsGrid items={filteredItems} />
        </div>
      </section>

      <div className="hidden md:block">
        <BasketButton floating />
      </div>
    </main>
  );
}
