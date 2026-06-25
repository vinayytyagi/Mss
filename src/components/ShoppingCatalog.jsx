import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ChevronsDown, LayoutGrid, SlidersHorizontal } from "lucide-react";
import BasketButton from "@/components/BasketButton";
import ShoppingItemsGrid from "@/components/ShoppingItemsGrid";
import ShoppingSidebar from "@/components/ShoppingSidebar";
import { isProductItem, matchesAttribute } from "@/lib/shopUi";
import { categoryIconPath } from "@/lib/categoryIcon";
import ShoppingSearchBar from "@/components/ShoppingSearchBar";
import SubcategoryStrip from "@/components/shopping/SubcategoryStrip";

function matchesPrice(item, minPrice, maxPrice) {
  const price = Number(item?.final_price ?? item?.price ?? 0);
  if (minPrice != null && price < minPrice) return false;
  if (maxPrice != null && price > maxPrice) return false;
  return true;
}

// "Shop for" facet — item.audience is "bride" | "groom" | "both". An unset or
// "both" audience matches either gender so unisex items always show.
function matchesAudience(item, selectedAudience) {
  if (!selectedAudience) return true;
  const a = String(item?.audience || "").toLowerCase();
  return a === "" || a === "both" || a === selectedAudience;
}

/** Client-side multi-sub filter. When more than one subcategory is picked
 *  the server returns everything under the top category and we narrow
 *  here — same pattern as fabric/price.
 *
 *  An item's `category_id` may be the picked sub OR one of its descendants
 *  (sub-subcategory, sub-sub-sub, …). To match correctly we walk up the
 *  parent chain via `parentByCategoryId` and return true if ANY ancestor
 *  (or the category itself) is in the selected set. */
function itemBelongsToAny(item, selectedSubcategoryIds, parentByCategoryId) {
  if (!selectedSubcategoryIds?.length) return true;
  const targetSet = new Set(selectedSubcategoryIds.map(String));
  let cid = String(item?.category_id || item?.subcategory_id || "");
  const seen = new Set();
  while (cid && !seen.has(cid)) {
    seen.add(cid);
    if (targetSet.has(cid)) return true;
    cid = String(parentByCategoryId.get(cid) || "");
  }
  return false;
}

/** Build a `/shopping?…` URL. `subcategoryIds` is a list — emitted as a
 *  comma-separated value so multi-select survives a round-trip. */
function buildQuery({ categoryId, subcategoryIds = [], subSubcategoryId, search }) {
  const qs = new URLSearchParams();
  if (categoryId) qs.set("category", categoryId);
  if (Array.isArray(subcategoryIds) && subcategoryIds.length > 0) {
    qs.set("subcategory", subcategoryIds.join(","));
  }
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
  selectedSubcategoryIds = [],
  selectedSubSubcategoryId = "",
  search = "",
  minPrice = null,
  maxPrice = null,
  selectedAttributes = {},
  selectedAudience = "",
  facets = [],
}) {
  const productItems = items.filter(isProductItem);
  const topCategories = categories.filter((category) => !category.parent_category_id);
  // category_id → parent_category_id lookup so the multi-sub filter can
  // walk ancestors when an item lives in a sub-sub of a selected sub.
  const parentByCategoryId = new Map();
  for (const c of categories) {
    parentByCategoryId.set(c.category_id, c.parent_category_id || null);
  }
  const selectedCategory =
    topCategories.find((category) => category.category_id === selectedCategoryId) || null;
  const visibleSubcategories = selectedCategory
    ? categories.filter((category) => category.parent_category_id === selectedCategory.category_id)
    : [];
  // Multi-pick: any subcategory in the URL list that's still in the
  // currently visible subs is considered selected.
  const selectedSubcategories = visibleSubcategories.filter((sub) =>
    selectedSubcategoryIds.includes(sub.category_id),
  );
  const singleSelectedSub =
    selectedSubcategories.length === 1 ? selectedSubcategories[0] : null;
  const visibleSubSubcategories = singleSelectedSub
    ? categories.filter((category) => category.parent_category_id === singleSelectedSub.category_id)
    : [];
  const selectedSubSubcategory =
    visibleSubSubcategories.find((category) => category.category_id === selectedSubSubcategoryId) || null;
  const hasSubSubcategoryRow = visibleSubSubcategories.length > 0;

  // Apply sidebar facets on top of what the API returned. With multi-sub
  // we also narrow here. The sidebar still gets `productItems` (post-API)
  // so its facet lists reflect the active top-category scope.
  // Multi-sub narrowing always runs client-side. Even when the server
  // already filtered (one sub picked), walking the chain here is cheap
  // and keeps the rule in one place.
  // Active attribute facets — AND across facets, OR within a facet. An item
  // missing an active facet's attribute is excluded (same as the old fabric
  // rule). `selectedAttributes` is `{ attributeKey → string[] }`.
  const activeAttributeEntries = Object.entries(selectedAttributes).filter(
    ([, values]) => Array.isArray(values) && values.length > 0,
  );
  const filteredItems = productItems
    .filter((item) => itemBelongsToAny(item, selectedSubcategoryIds, parentByCategoryId))
    .filter((item) => matchesAudience(item, selectedAudience))
    .filter((item) =>
      activeAttributeEntries.every(([key, values]) => matchesAttribute(item, key, values)),
    )
    .filter((item) => matchesPrice(item, minPrice, maxPrice));

  // Render every top category — the strip itself scrolls horizontally
  // once more than ~6 cards no longer fit on a typical desktop.
  const showcaseCategories = topCategories;
  // Only ever surface ACTUAL subcategories of the selected category — never
  // fall back to top categories (that made the sidebar show bogus "subcategory"
  // filters for categories that have none). Empty → the sidebar hides the section.
  const filterSubcategories = visibleSubcategories;

  /** Toggle a subcategory in/out of the URL list. */
  function buildToggleSubHref(subId) {
    const next = selectedSubcategoryIds.includes(subId)
      ? selectedSubcategoryIds.filter((id) => id !== subId)
      : [...selectedSubcategoryIds, subId];
    return `/shopping${buildQuery({
      categoryId: selectedCategory?.category_id || "",
      subcategoryIds: next,
      subSubcategoryId: "", // changing sub picks clears the deeper filter
      search,
    })}`;
  }

  return (
    <main className="mx-auto w-full px-4 pb-8 pt-5 sm:px-6 lg:px-8">
      <section className="relative rounded-[28px] bg-shop-bg p-5 sm:p-7">
        {/* Couple illustration is anchored to the SECTION (not the header)
            so it can extend down past the title and the search bar, with
            the feet visually overlapping the top of the brown strip — see
            the Figma reference. The image is placed before its siblings
            but positioned absolute; z-20 keeps it above the strip cards
            while still sitting in the same flow. */}
        <div className="pointer-events-none absolute right-2 top-2 z-20 hidden h-72 w-52 lg:block lg:right-4 lg:top-2 lg:h-90 lg:w-96">
          <Image
            src="/shopping_header.webp"
            alt="Bride and groom in traditional wedding attire"
            fill
            className="object-contain object-bottom-right"
            sizes="(max-width: 1024px) 220px, 300px"
            priority
          />
        </div>

        <div className="relative lg:min-h-55">
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
                subcategory={selectedSubcategoryIds.join(",")}
                placeholder="Find cosmetics, clothing, jewellery and more..."
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <h2 className="text-xl sm:text-2xl font-medium text-text-strong">Category</h2>
          {/* Brown card strip — matches the Figma reference. Inactive cards
              blend into the strip; the active one pops in deep brown. */}
          <div className="no-scrollbar mt-2 flex items-center gap-3 overflow-x-auto overflow-y-visible rounded-[30px] px-3 py-4">
            {/* w-max makes the pink strip grow to fit ALL cards (so the
                background spans the full scroll width on mobile instead of
                cutting off after a card or two); min-w-full keeps it full-width
                when there are only a few cards; shrink-0 stops the flex parent
                from collapsing it. */}
            <div className="bg-[#FFEAF0] w-max min-w-full shrink-0 flex items-center gap-5 rounded-xl">
            {/* "All" — clears the category filter (shows every shopping item). */}
            {(() => {
              const isActive = !selectedCategory;
              return (
                <Link
                  key="all-categories"
                  href={`/shopping${buildQuery({ search })}`}
                  className={`group relative flex w-48 shrink-0 cursor-pointer flex-col items-center justify-between rounded-4xl px-3 text-center transition-all duration-200 ease-out ${
                    isActive ? "z-20 -translate-y-2 scale-110 bg-[#780829] py-4 text-primary-foreground" : "py-3 text-text-strong"
                  }`}
                >
                  <div
                    className={`relative flex w-full shrink-0 items-center justify-center overflow-hidden rounded-lg ${
                      isActive ? "h-28 text-primary-foreground" : "h-20 text-secondary"
                    }`}
                  >
                    <LayoutGrid className={isActive ? "h-12 w-12" : "h-9 w-9"} strokeWidth={1.5} aria-hidden />
                  </div>
                  <div
                    className={`mt-2 flex items-center justify-center gap-1 text-center text-sm font-medium leading-tight sm:text-base ${
                      isActive ? "text-primary-foreground" : "text-text-strong"
                    }`}
                  >
                    <span>All</span>
                    {isActive ? (
                      <ChevronsDown className="h-4 w-4 shrink-0 text-primary-foreground" aria-hidden strokeWidth={2.25} />
                    ) : null}
                  </div>
                </Link>
              );
            })()}
            {showcaseCategories.map((category) => {
              const isActive = selectedCategory?.category_id === category.category_id;
              const categoryImage = category.image_url || "";
              const categoryHref = isActive
                ? `/shopping${buildQuery({ search })}`
                : `/shopping${buildQuery({ categoryId: category.category_id, search })}`;
              return (
                <Link
                  key={category.category_id}
                  href={categoryHref}
                  className={`group relative flex w-48 shrink-0 cursor-pointer flex-col items-center justify-between rounded-4xl px-3 text-center transition-all duration-200 ease-out ${
                    isActive
                      // Active card pops above the strip — scale + lift +
                      // shadow give the "bigger popup box" effect from the
                      // Figma reference. Strip has overflow-y-visible so
                      // the overflow renders cleanly.
                      ? "z-20 -translate-y-2 scale-110 bg-[#780829] py-4 text-primary-foreground"
                      : "py-3 text-text-strong"
                  }`}
                >
                  <div
                    className={`relative w-full shrink-0 overflow-hidden rounded-lg ${
                      isActive ? "h-28 text-primary-foreground" : "h-20 text-secondary"
                    }`}
                  >
                    {
                      <Image
                        src={categoryImage}
                        alt={category.name}
                        fill
                        className="object-contain object-center rounded-lg"
                        sizes="165px"
                        unoptimized
                      />
                    }
                  </div>
                  <div
                    className={`mt-2 flex items-center justify-center gap-1 text-center text-sm font-medium leading-tight sm:text-base ${
                      isActive ? "text-primary-foreground" : "text-text-strong"
                    }`}
                  >
                    <span>{category.name}</span>
                    {isActive ? (
                      <ChevronsDown
                        className="h-4 w-4 shrink-0 text-primary-foreground"
                        aria-hidden
                        strokeWidth={2.25}
                      />
                    ) : null}
                  </div>
                </Link>
              );
            })}
            </div>
          </div>
        </div>

        {/* Subcategory pill row — hidden entirely when the selected category
            has no subcategories. The scroll arrow is pinned to the far right
            (see SubcategoryStrip) and only shows when the row overflows. */}
        {visibleSubcategories.length > 0 ? (
          <SubcategoryStrip>
            <Link
              href={`/shopping${buildQuery({
                categoryId: selectedCategory?.category_id || "",
                subcategoryIds: [],
                search,
              })}`}
              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-4 py-2 text-sm font-medium ${
                selectedSubcategoryIds.length === 0
                  ? "bg-shop-chip-active text-primary-foreground"
                  : "bg-shop-chip text-secondary"
              }`}
            >
              All
            </Link>
            {visibleSubcategories.map((sub) => {
              const isSubActive = selectedSubcategoryIds.includes(sub.category_id);
              return (
                <Link
                  key={sub.category_id}
                  href={buildToggleSubHref(sub.category_id)}
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                    isSubActive
                      ? "bg-shop-chip-active text-text-strong"
                      : "bg-shop-chip text-secondary hover:bg-shop-chip/80"
                  }`}
                >
                  {sub.name}
                </Link>
              );
            })}
          </SubcategoryStrip>
        ) : null}

        {/* Sub-subcategory pill row — appears only when exactly one
            subcategory is picked AND it has its own children. */}
        {hasSubSubcategoryRow ? (
          <div className="no-scrollbar mt-3 flex items-center gap-3 overflow-x-auto rounded-full bg-transparent py-1">
            <Link
              href={`/shopping${buildQuery({
                categoryId: selectedCategory?.category_id || "",
                subcategoryIds: singleSelectedSub ? [singleSelectedSub.category_id] : [],
                subSubcategoryId: "",
                search,
              })}`}
              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium ${
                !selectedSubSubcategory
                  ? "bg-shop-chip-active text-text-strong"
                  : "bg-shop-chip text-secondary"
              }`}
            >
              All
            </Link>
            {visibleSubSubcategories.map((ss) => {
              const isActive = selectedSubSubcategory?.category_id === ss.category_id;
              const href = isActive
                ? `/shopping${buildQuery({
                    categoryId: selectedCategory?.category_id || "",
                    subcategoryIds: singleSelectedSub ? [singleSelectedSub.category_id] : [],
                    subSubcategoryId: "",
                    search,
                  })}`
                : `/shopping${buildQuery({
                    categoryId: selectedCategory?.category_id || "",
                    subcategoryIds: singleSelectedSub ? [singleSelectedSub.category_id] : [],
                    subSubcategoryId: ss.category_id,
                    search,
                  })}`;
              return (
                <Link
                  key={ss.category_id}
                  href={href}
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium ${
                    isActive
                      ? "bg-shop-chip-active text-text-strong"
                      : "bg-shop-chip text-secondary"
                  }`}
                >
                  {ss.name}
                </Link>
              );
            })}
          </div>
        ) : null}
      </section>

      <section className="mt-8 grid items-start gap-6 lg:grid-cols-[260px_1fr]">
        <ShoppingSidebar
          items={productItems}
          facets={facets}
          filterSubcategories={filterSubcategories}
          selectedCategoryId={selectedCategory?.category_id || ""}
          selectedSubcategoryIds={selectedSubcategoryIds}
          search={search}
          selectedAttributes={selectedAttributes}
          selectedAudience={selectedAudience}
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
