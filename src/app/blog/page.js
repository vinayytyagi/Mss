import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { webPageSchema, breadcrumbSchema } from "@/lib/jsonld";
import { fetchBlogs } from "@/lib/api";
import BlogCard from "@/components/blog/BlogCard";
import BlogPaginationClient from "@/components/blog/BlogPaginationClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://myshaadistore.com";
const serif = "font-[family-name:var(--font-playfair),ui-serif,Georgia,serif]";
const PAGE_SIZE = 9;

export const metadata = {
  title: "Wedding Blog — Tips, Ideas & Inspiration",
  description:
    "Wedding planning tips, décor ideas, outfit guides and real inspiration from the MyShaadiStore team.",
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: "Wedding Blog | MyShaadiStore",
    description:
      "Wedding planning tips, décor ideas, outfit guides and real inspiration from the MyShaadiStore team.",
    url: `${SITE_URL}/blog`,
    type: "website",
  },
};

export default async function BlogListPage({ searchParams }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp?.page) || 1);
  const category = String(sp?.category || "");

  // fetchJson resolves to null on a 200-with-non-JSON body, so normalize the
  // shape defensively — a raw null/partial would crash the .map/.length below.
  const normalize = (res) => ({
    blogs: Array.isArray(res?.blogs) ? res.blogs : [],
    categories: Array.isArray(res?.categories) ? res.categories : [],
    total: Number(res?.total) || 0,
    page: Number(res?.page) || 1,
    pages: Number(res?.pages) || 1,
  });

  let data = normalize(null);
  try {
    data = normalize(await fetchBlogs({ page, category }));
    // Stale/hand-edited ?page beyond the end → show the last real page
    // instead of a misleading "No articles yet".
    if (data.total > 0 && page > data.pages) {
      data = normalize(await fetchBlogs({ page: data.pages, category }));
    }
  } catch {
    // API unreachable — render the empty state instead of crashing.
  }

  const chips = [{ label: "All", value: "" }, ...data.categories.map((c) => ({ label: c, value: c }))];

  return (
    <>
      <JsonLd
        data={[
          webPageSchema({
            title: "Wedding Blog | MyShaadiStore",
            description: metadata.description,
            url: `${SITE_URL}/blog`,
          }),
          breadcrumbSchema([
            { name: "Home", url: `${SITE_URL}/` },
            { name: "Blog", url: `${SITE_URL}/blog` },
          ]),
        ]}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-primary-soft">
        <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground">
            Our Blog
          </span>
          <h1 className={`${serif} mt-4 max-w-2xl text-3xl font-bold leading-tight text-text-strong sm:text-5xl`}>
            Wedding ideas, tips & inspiration
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            Planning guides, décor trends and real stories to help you celebrate beautifully.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {/* Category chips */}
        {data.categories.length ? (
          <div className="mb-8 flex flex-wrap gap-2">
            {chips.map((chip) => {
              const active = chip.value === category;
              return (
                <Link
                  key={chip.value || "all"}
                  href={chip.value ? `/blog?category=${encodeURIComponent(chip.value)}` : "/blog"}
                  className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-surface text-text hover:border-primary hover:text-primary"
                  }`}
                >
                  {chip.label}
                </Link>
              );
            })}
          </div>
        ) : null}

        {data.blogs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center">
            <p className={`${serif} text-xl font-semibold text-text-strong`}>No articles yet</p>
            <p className="mt-2 text-sm text-muted">We&apos;re writing our first stories — check back soon!</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.blogs.map((blog) => (
                <BlogCard key={blog.id} blog={blog} />
              ))}
            </div>
            {data.pages > 1 ? (
              <div className="mt-10">
                <BlogPaginationClient page={data.page} pageSize={PAGE_SIZE} total={data.total} category={category} />
              </div>
            ) : null}
          </>
        )}
      </main>
    </>
  );
}
