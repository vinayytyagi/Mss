import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-88px)] max-w-5xl items-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full rounded-4xl border border-white/70 bg-white/90 p-8 text-center shadow-[0_28px_80px_rgba(16,24,40,0.08)] sm:p-12">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#fff1f6] text-3xl font-black text-[#ff4f86]">
          404
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-800 sm:text-5xl">
          Page not found
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-500 sm:text-lg">
          The page you are looking for does not exist or may have been moved to another journey
          step.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-w-44 items-center justify-center rounded-2xl bg-[#ff4f86] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(255,79,134,0.22)] transition hover:bg-[#ff3d79]"
          >
            Go to Home
          </Link>
          <Link
            href="/how-it-works"
            className="inline-flex min-w-44 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            How it works
          </Link>
        </div>
      </div>
    </main>
  );
}
