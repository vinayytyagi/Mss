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
    <form onSubmit={submit} className="mt-6 flex w-full items-center justify-center">
      <div className="flex w-full max-w-2xl items-center gap-3 rounded-2xl bg-surface px-5 py-4 shadow-[0_16px_36px_rgba(15,23,42,0.06)] ring-1 ring-border">
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
          className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-text outline-none placeholder:text-subtle"
          placeholder={placeholder}
          aria-label="Search shopping"
        />
        <button
          type="submit"
          className="h-11 shrink-0 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
        >
          Search
        </button>
      </div>
    </form>
  );
}
