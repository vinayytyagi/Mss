"use client";

/**
 * Customer-storefront pagination — softer, more spacious than the
 * admin/vendor variant. Active page uses brand primary.
 *
 *   <Pagination
 *     page={page}
 *     pageSize={24}
 *     total={total}
 *     onPageChange={(p) => setPage(p)}
 *   />
 *
 * Pure controlled component. Scrolls window to top on page change so the
 * grid is visible after the click.
 */

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

function buildPages(current, totalPages, siblings = 1) {
  if (totalPages <= 1) return [1];
  const first = 1;
  const last = totalPages;
  const left = Math.max(current - siblings, first + 1);
  const right = Math.min(current + siblings, last - 1);
  const tokens = [first];
  if (left > first + 1) tokens.push("…");
  for (let p = left; p <= right; p++) tokens.push(p);
  if (right < last - 1) tokens.push("…");
  if (last > first) tokens.push(last);
  return tokens;
}

export default function Pagination({
  page = 1,
  pageSize = 24,
  total = 0,
  onPageChange,
  scrollOnChange = true,
  className = "",
}) {
  const totalPages = Math.max(1, Math.ceil((Number(total) || 0) / (Number(pageSize) || 1)));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const tokens = useMemo(() => buildPages(currentPage, totalPages), [currentPage, totalPages]);
  const [goTo, setGoTo] = useState("");

  function go(n) {
    const next = Math.min(Math.max(1, Number(n) || 1), totalPages);
    if (next !== currentPage) {
      onPageChange?.(next);
      if (scrollOnChange && typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }

  function handleGoToSubmit(e) {
    e.preventDefault();
    if (!goTo.trim()) return;
    go(goTo);
    setGoTo("");
  }

  if (total === 0) return null;
  if (totalPages <= 1) {
    return (
      <p className={`mt-6 text-center text-sm text-muted ${className}`}>
        Showing all <span className="font-semibold text-text">{total}</span> result
        {total === 1 ? "" : "s"}
      </p>
    );
  }

  const startRow = (currentPage - 1) * pageSize + 1;
  const endRow = Math.min(total, currentPage * pageSize);

  return (
    <nav
      className={`mt-8 flex flex-col items-center gap-3 ${className}`}
      aria-label="Page navigation"
    >
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <PageButton
          onClick={() => go(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">Prev</span>
        </PageButton>

        {tokens.map((tok, idx) =>
          tok === "…" ? (
            <span
              key={`gap-${idx}`}
              className="inline-flex h-9 w-9 items-center justify-center text-muted"
            >
              <MoreHorizontal className="size-4" />
            </span>
          ) : (
            <PageButton
              key={tok}
              active={tok === currentPage}
              onClick={() => go(tok)}
              aria-current={tok === currentPage ? "page" : undefined}
              aria-label={`Page ${tok}`}
            >
              {tok}
            </PageButton>
          )
        )}

        <PageButton
          onClick={() => go(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="size-4" />
        </PageButton>

        {totalPages > 7 ? (
          <form onSubmit={handleGoToSubmit} className="ml-3 flex items-center gap-1.5">
            <span className="text-xs text-muted">Go to</span>
            <input
              type="text"
              inputMode="numeric"
              value={goTo}
              onChange={(e) => setGoTo(e.target.value.replace(/[^\d]/g, ""))}
              placeholder={String(currentPage)}
              className="h-9 w-14 rounded-full border border-border bg-surface px-2 text-center text-sm tabular-nums focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              aria-label="Jump to page number"
            />
          </form>
        ) : null}
      </div>

      <p className="text-xs text-muted">
        Showing <span className="font-semibold text-text">{startRow}–{endRow}</span> of{" "}
        <span className="font-semibold text-text">{Number(total).toLocaleString("en-IN")}</span>{" "}
        result{total === 1 ? "" : "s"}
      </p>
    </nav>
  );
}

function PageButton({ children, active, disabled, onClick, ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      {...rest}
      className={[
        "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-full border px-3 text-sm font-medium transition-all",
        "focus:outline-none focus:ring-2 focus:ring-primary/30",
        disabled
          ? "cursor-not-allowed border-border text-muted opacity-50"
          : active
            ? "border-primary bg-primary text-primary-foreground shadow-[0_8px_18px_rgba(255,79,134,0.35)]"
            : "border-border bg-surface text-text hover:border-primary/40 hover:bg-primary-soft hover:text-primary-hover",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
