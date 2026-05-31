import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative flex min-h-[calc(100vh-88px)] flex-col items-center justify-center overflow-hidden px-6 py-20">
      {/* Ambient blobs — purely decorative */}
      <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/8 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-primary/6 blur-3xl" />

      {/* Illustration */}
      <div className="relative mb-10">
        {/* Outer decorative ring */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/20 scale-110" />
        <div className="flex h-44 w-44 items-center justify-center rounded-full bg-primary/8">
          <svg
            viewBox="0 0 120 120"
            fill="none"
            className="h-24 w-24"
            aria-hidden="true"
          >
            {/* Wedding arch */}
            <path
              d="M20 95 Q20 40 60 35 Q100 40 100 95"
              stroke="#ff4f86"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Arch base lines */}
            <line x1="14" y1="95" x2="34" y2="95" stroke="#ff4f86" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="86" y1="95" x2="106" y2="95" stroke="#ff4f86" strokeWidth="3.5" strokeLinecap="round" />
            {/* Question mark inside arch */}
            <text
              x="60"
              y="80"
              textAnchor="middle"
              fontSize="32"
              fontWeight="800"
              fill="#ff4f86"
              fontFamily="serif"
            >
              ?
            </text>
            {/* Small hearts */}
            <path
              d="M52 24 C52 21 48 19 48 22 C48 19 44 21 44 24 C44 27 48 30 48 30 C48 30 52 27 52 24Z"
              fill="#ff4f86"
              opacity="0.6"
            />
            <path
              d="M79 28 C79 26.3 76.5 25 76.5 27 C76.5 25 74 26.3 74 28 C74 30 76.5 32 76.5 32 C76.5 32 79 30 79 28Z"
              fill="#ff4f86"
              opacity="0.4"
            />
          </svg>
        </div>
      </div>

      {/* Text content */}
      <div className="max-w-lg text-center">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Error 404
        </p>
        <h1 className="text-4xl font-bold leading-tight text-text sm:text-5xl" style={{ fontFamily: "var(--font-playfair), serif" }}>
          Lost before the vows
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-base leading-relaxed text-muted">
          This page seems to have run off before the ceremony. Let&apos;s get
          you back to planning your perfect wedding day.
        </p>
      </div>

      {/* CTAs */}
      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex h-12 min-w-48 items-center justify-center rounded-2xl bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-[0_16px_36px_rgba(255,79,134,0.28)] transition hover:bg-primary/90 hover:shadow-[0_20px_44px_rgba(255,79,134,0.36)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Back to Home
        </Link>
        <Link
          href="/shopping"
          className="inline-flex h-12 min-w-48 items-center justify-center rounded-2xl border border-border bg-surface px-8 text-sm font-semibold text-text transition hover:border-primary/40 hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Browse Shopping
        </Link>
      </div>

      {/* Decorative footer line */}
      <div className="mt-14 flex items-center gap-3 text-xs text-subtle">
        <div className="h-px w-12 bg-border" />
        <span>MyShaadiStore</span>
        <div className="h-px w-12 bg-border" />
      </div>
    </main>
  );
}
