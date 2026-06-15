"use client";

import { useEffect, useMemo, useState } from "react";
import { Star, Trash2, Edit3, MessageSquare } from "lucide-react";
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

function Stars({ value = 0, sizeClass = "h-4 w-4" }) {
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

export default function ProductReviews({ itemId, onSummary }) {
  const user = useAuthUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("newest");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const myReview = data?.myReview || null;
  const summary = data?.summary || { avgRating: 0, count: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };

  const [draftRating, setDraftRating] = useState(0);
  const [draftComment, setDraftComment] = useState("");
  // Tri-state reviews toggle (shared contract):
  //   "enabled"  — show ratings+reviews AND allow new submissions
  //   "readonly" — show existing ratings+reviews, hide the write form
  //   "disabled" — hide the entire ratings & reviews section
  const { config } = useSiteConfig();
  const reviewsMode = config.reviews_mode;
  const reviewsEnabled = reviewsMode === "enabled";

  // Submission is only allowed in "enabled" mode (and to a logged-in user).
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

  // Lift the live approved-review summary up to the PDP so the headline
  // "{count} reviews" matches the list below (the stored item.review_count
  // can be stale). Only fire once we actually have a summary loaded.
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

  // "disabled" hides the entire ratings & reviews section everywhere.
  if (reviewsMode === "disabled") return null;

  return (
    <section className="mt-12 rounded-3xl border border-border bg-surface/80 p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] backdrop-blur sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="h-9 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
            <h2 className="text-2xl font-bold tracking-tight text-text-strong">Ratings &amp; Reviews</h2>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <p className="text-3xl font-bold text-text-strong">{summary.avgRating || 0}</p>
              <div className="flex flex-col">
                <Stars value={Math.round((Number(summary.avgRating) || 0) * 2) / 2} sizeClass="h-5 w-5" />
                <p className="mt-1 text-sm text-muted">{count} review{count === 1 ? "" : "s"}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            {[5, 4, 3, 2, 1].map((r) => {
              const c = Number(breakdown?.[r]) || 0;
              const width = pct(c, count);
              return (
                <div key={r} className="flex items-center gap-3">
                  <span className="w-10 text-sm font-semibold text-text">{r}★</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
                    <div className="h-full rounded-full bg-warning" style={{ width: `${width}%` }} />
                  </div>
                  <span className="w-10 text-right text-sm font-semibold text-muted">{c}</span>
                </div>
              );
            })}
          </div>
        </div>

        {reviewsEnabled ? (
        <div className="w-full lg:max-w-md">
          <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
            {myReview?.status === "Pending" ? (
              <div className="mb-4 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-xs font-semibold text-warning-strong">
                Your review was submitted and is awaiting admin approval.
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              <p className="text-base font-bold text-text-strong">
                {user ? (myReview ? "Edit your review" : "Write a review") : "Login to write a review"}
              </p>
              {canWrite && myReview ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-2xl border border-border-strong px-3 py-2 text-sm font-semibold text-muted transition hover:border-danger/30 hover:bg-danger/10 hover:text-danger disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Delete
                </button>
              ) : null}
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-text">Your rating</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((r) => {
                    const active = r <= clampRating(draftRating);
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setDraftRating(r)}
                        disabled={!canWrite || saving}
                        className="cursor-pointer rounded-md p-1 disabled:cursor-not-allowed disabled:opacity-50"
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

              <div>
                <label className="text-sm font-semibold text-text">Your comment</label>
                <textarea
                  value={draftComment}
                  onChange={(e) => setDraftComment(e.target.value)}
                  disabled={!canWrite || saving}
                  rows={4}
                  placeholder="Share details about quality, service, fit, delivery…"
                  className="mt-2 w-full rounded-2xl border border-border-strong bg-surface px-4 py-3 text-sm text-text outline-none focus:border-primary disabled:bg-surface-muted"
                />
                <p className="mt-2 text-xs text-muted">Minimum 10 characters. Max 500.</p>
              </div>

              <button
                type="submit"
                disabled={!canWrite || saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_14px_30px_rgba(255,79,134,0.25)] transition hover:bg-primary-hover disabled:opacity-60"
              >
                {myReview ? <Edit3 className="h-4 w-4" aria-hidden="true" /> : <MessageSquare className="h-4 w-4" aria-hidden="true" />}
                {saving ? "Saving…" : myReview ? "Update review" : "Submit review"}
              </button>
            </form>
          </div>
        </div>
        ) : null}
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm font-semibold text-text">
          {loading ? "Loading reviews…" : count ? `Showing ${reviews.length} of ${count}` : "No reviews yet"}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-muted">Sort</label>
          <Dropdown
            value={sort}
            onChange={(next) => {
              setPage(1);
              setSort(next);
            }}
            options={REVIEW_SORT_OPTIONS}
            placeholder="Sort"
            ariaLabel="Sort reviews"
            className="w-44"
          />
        </div>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
          {error}
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        {!loading && reviews.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface-muted/70 px-6 py-10 text-center text-muted">
            Be the first to review this product.
          </div>
        ) : null}

        {reviews.map((r) => (
          <article key={r.review_id} className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-text-strong">{r.user?.name || "Customer"}</p>
                <p className="mt-0.5 text-xs font-semibold text-subtle">{formatDate(r.created_at)}</p>
              </div>
              <Stars value={r.rating} />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-text whitespace-pre-wrap">{r.comment}</p>
          </article>
        ))}
      </div>

      {count > 0 ? (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={loading || page <= 1}
            className="h-10 rounded-2xl border border-border-strong bg-surface px-4 text-sm font-semibold text-text transition hover:bg-surface-muted disabled:opacity-50"
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
            className="h-10 rounded-2xl border border-border-strong bg-surface px-4 text-sm font-semibold text-text transition hover:bg-surface-muted disabled:opacity-50"
          >
            Next
          </button>
        </div>
      ) : null}
    </section>
  );
}

