"use client";

import Link from "next/link";

export default function Error({ reset }) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-88px)] max-w-5xl items-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full rounded-2xl border border-surface/70 bg-surface/90 p-8 text-center shadow-[0_28px_80px_rgba(16,24,40,0.08)] sm:p-12">
        {/* Warning triangle icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface-muted">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            className="h-10 w-10"
            aria-hidden="true"
          >
            <path
              d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
              stroke="#ff4f86"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="12"
              y1="9"
              x2="12"
              y2="13"
              stroke="#ff4f86"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="12"
              y1="17"
              x2="12.01"
              y2="17"
              stroke="#ff4f86"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-text">
          Oops! Something went wrong.
        </h1>

        <p className="mx-auto mt-3 max-w-md text-base text-muted">
          Something unexpected happened. Please try again.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            onClick={reset}
            className="inline-flex min-w-44 items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_18px_40px_rgba(255,79,134,0.22)] transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex min-w-44 items-center justify-center rounded-2xl border border-border bg-surface px-6 py-3 text-sm font-semibold text-text transition hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
