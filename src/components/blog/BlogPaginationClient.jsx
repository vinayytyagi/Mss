"use client";

import { useRouter } from "next/navigation";
import Pagination from "@/components/Pagination";

/** Thin wrapper turning the controlled Pagination into URL navigation. */
export default function BlogPaginationClient({ page, pageSize, total, category = "" }) {
  const router = useRouter();

  function onPageChange(next) {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (next > 1) params.set("page", String(next));
    const qs = params.toString();
    router.push(`/blog${qs ? `?${qs}` : ""}`);
  }

  return <Pagination page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} />;
}
