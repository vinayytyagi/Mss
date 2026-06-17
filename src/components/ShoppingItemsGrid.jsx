"use client";

/**
 * Client wrapper for the Shopping catalog's item grid + pagination.
 *
 * ShoppingCatalog is a server component; pagination needs `useState`. This
 * tiny client child holds the page state, slices the items prop, and
 * renders v2 item cards wired to the SHOPPING cart (not the quotation cart).
 */

import { useEffect, useState } from "react";
import ItemCardV2 from "@/components/ItemCardV2";
import Pagination from "@/components/Pagination";

const SHOPPING_PAGE_SIZE = 24;

export default function ShoppingItemsGrid({ items = [] }) {
  const [page, setPage] = useState(1);

  // Reset to page 1 when the filtered set changes (parent server-renders
  // with new items on filter clicks).
  useEffect(() => {
    setPage(1);
  }, [items.length]);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / SHOPPING_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = items.slice(
    (currentPage - 1) * SHOPPING_PAGE_SIZE,
    currentPage * SHOPPING_PAGE_SIZE
  );

  if (total === 0) {
    return (
      <div className="rounded-[22px] bg-primary-soft px-6 py-12 text-center text-secondary">
        No shopping products found for this selection.
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {paged.map((item) => {
          // WL detection: customer API strips vendor_id whenever WL is on.
          const whiteLabelOn = !item.vendor_id;
          const vendorName = whiteLabelOn
            ? "MyShaadiStore"
            : item.vendor_business_name || item.vendor_name || "Vendor";
          return (
            <ItemCardV2
              key={item.item_id}
              item={item}
              vendorName={vendorName}
              whiteLabelOn={whiteLabelOn}
              step={null}
              cartKind="shopping"
            />
          );
        })}
      </div>
      <Pagination
        page={currentPage}
        pageSize={SHOPPING_PAGE_SIZE}
        total={total}
        onPageChange={setPage}
      />
    </>
  );
}
