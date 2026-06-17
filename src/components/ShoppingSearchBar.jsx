"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

function buildShoppingHref({ category, subcategory, search }) {
  const qs = new URLSearchParams();
  if (category) qs.set("category", category);
  if (subcategory) qs.set("subcategory", subcategory);
  if (search && String(search).trim()) qs.set("search", String(search).trim());
  const q = qs.toString();
  return `/shopping${q ? `?${q}` : ""}`;
}

export default function ShoppingSearchBar({
  initialValue = "",
  category = "",
  subcategory = "",
  placeholder = "Search products, services, vendors…",
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryValue = useMemo(() => (searchParams?.get("search") || "").trim(), [searchParams]);
  const [value, setValue] = useState(initialValue || queryValue);

  function submit(e) {
    e?.preventDefault?.();
    router.push(
      buildShoppingHref({
        category,
        subcategory,
        search: value,
      }),
    );
  }

  return (
    // Width + outer spacing are owned by the parent wrapper; this just fills it
    // and scales its padding/button down on mobile + tablet.
    <form onSubmit={submit} className="w-full">
      <div className="flex w-full items-center gap-2 rounded-2xl bg-surface px-3 py-2.5 shadow-[0_16px_36px_rgba(15,23,42,0.06)] ring-1 ring-border sm:gap-3 sm:px-5 sm:py-4">
        <Search className="h-5 w-5 shrink-0 text-subtle" aria-hidden="true" />
        <input
          value={value}
          onChange={(e) => {
            const next = e.target.value;
            setValue(next);
            if (next.trim() === "" && queryValue !== "") {
              router.replace(
                buildShoppingHref({
                  category,
                  subcategory,
                  search: "",
                }),
              );
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-text outline-none placeholder:text-subtle sm:text-[15px]"
          placeholder={placeholder}
          aria-label="Search shopping"
        />
        <button
          type="submit"
          className="h-9 shrink-0 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover sm:h-11 sm:rounded-2xl sm:px-5"
        >
          Search
        </button>
      </div>
    </form>
  );
}
