"use client";

import { useEffect, useMemo, useState } from "react";
import { Star, Trash2, Edit3, MessageSquare, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { deleteMyItemReview, fetchItemReviews, upsertMyItemReview } from "@/lib/api/reviewsApi";
import useSiteConfig from "@/lib/useSiteConfig";
import { useAuthUser } from "@/lib/authCookies";
import Dropdown from "@/components/ui/Dropdown";

const REVIEW_SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "highest", label: "Highest rating" },
  { value: "lowest", label: "Lowest rating" },
];

function clampRating(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(5, Math.round(x)));
}

function Stars({ value = 0, sizeClass = "h-3.5 w-3.5" }) {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${v} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= v;
        return (
          <Star
            key={i}
            className={`${sizeClass} ${filled ? "fill-warning text-warning" : "text-border-strong"}`}
            strokeWidth={filled ? 0 : 1.7}
          />
        );
      })}
    </span>
  );
}

function pct(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function formatDate(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

// Small green rating chip — Myntra/Flipkart style ("4.5 ★").
function RatingChip({ value }) {
  const v = Number(value) || 0;
  const tone = v >= 3 ? "bg-success/10 text-success" : v >= 2 ? "bg-warning/15 text-warning" : "bg-danger/10 text-danger";
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-bold ${tone}`}>
      {v.toFixed(1)}
      <Star className="h-3 w-3" fill="currentColor" strokeWidth={0} aria-hidden />
    </span>
  );
}

export default function ProductReviews({ itemId, onSummary }) {
  const user = useAuthUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("newest");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [writeOpen, setWriteOpen] = useState(false);

  const myReview = data?.myReview || null;
  const summary = data?.summary || { avgRating: 0, count: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };

  const [draftRating, setDraftRating] = useState(0);
  const [draftComment, setDraftComment] = useState("");
  // Tri-state reviews toggle: "enabled" (read+write) / "readonly" (read) / "disabled" (hidden).
  const { config } = useSiteConfig();
  const reviewsMode = config.reviews_mode;
  const reviewsEnabled = reviewsMode === "enabled";
  const canWrite = Boolean(user) && reviewsEnabled;

  const totalPages = useMemo(() => {
    const total = Number(data?.total) || 0;
    const limit = Number(data?.limit) || 10;
    return Math.max(1, Math.ceil(total / Math.max(1, limit)));
  }, [data]);

  async function load(next = {}) {
    setError("");
    setLoading(true);
    try {
      const res = await fetchItemReviews(itemId, { page: next.page ?? page, limit: 10, sort: next.sort ?? sort });
      setData(res);
    } catch (e) {
      setError(e?.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load({ page, sort });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId, page, sort]);

  useEffect(() => {
    if (myReview) {
      setDraftRating(clampRating(myReview.rating));
      setDraftComment(String(myReview.comment || ""));
    } else {
      setDraftRating(0);
      setDraftComment("");
    }
  }, [myReview?.review_id]);

  // Lift the live approved-review summary to the PDP headline.
  useEffect(() => {
    if (!onSummary || !data?.summary) return;
    onSummary({
      avgRating: Number(data.summary.avgRating) || 0,
      count: Number(data.summary.count) || 0,
    });
  }, [onSummary, data?.summary]);

  async function handleSave(e) {
    e?.preventDefault?.();
    if (!canWrite) {
      toast.error("Please login to write a review");
      return;
    }
    const rating = clampRating(draftRating);
    const comment = String(draftComment || "").trim();
    if (rating < 1 || rating > 5) {
      toast.error("Please select a rating (1–5)");
      return;
    }
    if (comment.length < 10) {
      toast.error("Please write at least 10 characters");
      return;
    }
    if (comment.length > 500) {
      toast.error("Please keep your review under 500 characters");
      return;
    }

    setSaving(true);
    try {
      await upsertMyItemReview(itemId, { rating, comment });
      toast.success(myReview ? "Review updated" : "Review submitted");
      setWriteOpen(false);
      await load({ page: 1 });
      setPage(1);
    } catch (e) {
      toast.error(e?.message || "Could not save review");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!canWrite) return;
    setSaving(true);
    try {
      await deleteMyItemReview(itemId);
      toast.success("Review deleted");
      setWriteOpen(false);
      await load({ page: 1 });
      setPage(1);
    } catch (e) {
      toast.error(e?.message || "Could not delete review");
    } finally {
      setSaving(false);
    }
  }

  const reviews = Array.isArray(data?.reviews) ? data.reviews : [];
  const breakdown = summary.breakdown || {};
  const count = Number(summary.count) || 0;
  const avg = Number(summary.avgRating) || 0;

  if (reviewsMode === "disabled") return null;

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="h-7 w-1.5 shrink-0 rounded-md bg-primary" aria-hidden />
        <h2 className="text-2xl font-bold tracking-tight text-text-strong">Ratings &amp; Reviews</h2>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* LEFT — summary snapshot + collapsible write form (sticky on desktop) */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-center gap-5 rounded-lg border border-border bg-surface p-4">
            <div className="flex shrink-0 flex-col items-center">
              <div className="flex items-baseline gap-0.5">
                <span className="text-4xl font-bold leading-none text-text-strong">{avg ? avg.toFixed(1) : "0.0"}</span>
                <span className="text-sm font-medium text-muted">/5</span>
              </div>
              <Stars value={Math.round(avg * 2) / 2} sizeClass="mt-1.5 h-4 w-4" />
              <p className="mt-1 text-xs text-muted">
                {count} review{count === 1 ? "" : "s"}
              </p>
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map((r) => {
                const c = Number(breakdown?.[r]) || 0;
                const width = pct(c, count);
                return (
                  <div key={r} className="flex items-center gap-2">
                    <span className="w-3 text-[11px] font-semibold text-muted">{r}</span>
                    <Star className="h-3 w-3 shrink-0 fill-warning text-warning" strokeWidth={0} aria-hidden />
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                      <div className="h-full rounded-full bg-warning" style={{ width: `${width}%` }} />
                    </div>
                    <span className="w-6 text-right text-[11px] font-semibold text-muted">{c}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {reviewsEnabled ? (
            <div className="mt-4">
              {myReview?.status === "Pending" ? (
                <p className="mb-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs font-semibold text-warning-strong">
                  Your review is awaiting admin approval.
                </p>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    toast.error("Please login to write a review");
                    return;
                  }
                  setWriteOpen((o) => !o);
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary bg-surface px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary-soft"
              >
                {myReview ? <Edit3 className="h-4 w-4" aria-hidden /> : <MessageSquare className="h-4 w-4" aria-hidden />}
                {user ? (myReview ? "Edit your review" : "Write a review") : "Login to write a review"}
                <ChevronDown className={`h-4 w-4 transition-transform ${writeOpen ? "rotate-180" : ""}`} aria-hidden />
              </button>

              {writeOpen && canWrite ? (
                <form onSubmit={handleSave} className="mt-3 space-y-3 rounded-lg border border-border bg-surface p-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-text">Your rating</label>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((r) => {
                        const active = r <= clampRating(draftRating);
                        return (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setDraftRating(r)}
                            disabled={saving}
                            className="cursor-pointer rounded-md p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={`Rate ${r} star`}
                          >
                            <Star
                              className={`h-6 w-6 ${active ? "fill-warning text-warning" : "text-border-strong"}`}
                              strokeWidth={active ? 0 : 1.7}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <textarea
                    value={draftComment}
                    onChange={(e) => setDraftComment(e.target.value)}
                    disabled={saving}
                    rows={3}
                    placeholder="Share details about quality, fit, delivery…"
                    className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary disabled:bg-surface-muted"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted">10–500 characters</span>
                    <div className="flex items-center gap-2">
                      {myReview ? (
                        <button
                          type="button"
                          onClick={handleDelete}
                          disabled={saving}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong px-3 py-2 text-sm font-semibold text-muted transition hover:border-danger/30 hover:bg-danger/10 hover:text-danger disabled:opacity-60"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                          Delete
                        </button>
                      ) : null}
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
                      >
                        {saving ? "Saving…" : myReview ? "Update" : "Submit"}
                      </button>
                    </div>
                  </div>
                </form>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* RIGHT — review list */}
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
            <p className="text-sm font-semibold text-text">
              {loading ? "Loading reviews…" : count ? `${count} review${count === 1 ? "" : "s"}` : "No reviews yet"}
            </p>
            {count > 0 ? (
              <Dropdown
                value={sort}
                onChange={(next) => {
                  setPage(1);
                  setSort(next);
                }}
                options={REVIEW_SORT_OPTIONS}
                placeholder="Sort"
                ariaLabel="Sort reviews"
                className="w-40"
              />
            ) : null}
          </div>

          {error ? (
            <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
              {error}
            </div>
          ) : null}

          {!loading && reviews.length === 0 && !error ? (
            <div className="mt-4 rounded-lg border border-border bg-surface-muted/60 px-6 py-10 text-center text-sm text-muted">
              Be the first to review this product.
            </div>
          ) : null}

          <ul>
            {reviews.map((r) => {
              const name = r.user?.name || "Customer";
              const initial = name.trim().charAt(0).toUpperCase() || "C";
              return (
                <li key={r.review_id} className="border-b border-border py-4 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                      {initial}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-text-strong">{name}</p>
                        <RatingChip value={r.rating} />
                      </div>
                      <p className="text-[11px] font-medium text-subtle">{formatDate(r.created_at)}</p>
                    </div>
                  </div>
                  {r.comment ? (
                    <p className="mt-2 whitespace-pre-wrap pl-12 text-sm leading-relaxed text-text">{r.comment}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>

          {count > 0 && totalPages > 1 ? (
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={loading || page <= 1}
                className="h-9 rounded-lg border border-border-strong bg-surface px-4 text-sm font-semibold text-text transition hover:bg-surface-muted disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-sm font-semibold text-muted">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={loading || page >= totalPages}
                className="h-9 rounded-lg border border-border-strong bg-surface px-4 text-sm font-semibold text-text transition hover:bg-surface-muted disabled:opacity-50"
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
