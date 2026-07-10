import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import { webPageSchema, breadcrumbSchema, articleSchema } from "@/lib/jsonld";
import { fetchBlog } from "@/lib/api";
import BlogContent from "@/components/blog/BlogContent";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://myshaadistore.com";
const serif = "font-[family-name:var(--font-playfair),ui-serif,Georgia,serif]";

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  // fetchBlog maps only a 404 to null; other failures propagate so an API
  // outage surfaces as a 5xx rather than a misleading "not found".
  const blog = await fetchBlog(slug);
  if (!blog) return { title: "Blog" };

  const title = blog.seo_title || blog.title;
  const description = blog.seo_description || blog.excerpt;
  const image = blog.og_image || blog.cover_image;
  return {
    title: `${title} | MyShaadiStore Blog`,
    description,
    alternates: { canonical: `${SITE_URL}/blog/${blog.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/blog/${blog.slug}`,
      type: "article",
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}

export default async function BlogDetailPage({ params }) {
  const { slug } = await params;
  // Only a genuine 404 (fetchBlog → null) becomes notFound(); other failures
  // propagate to the error boundary so live posts don't 404 during an outage.
  const blog = await fetchBlog(slug);
  if (!blog) notFound();

  const pageUrl = `${SITE_URL}/blog/${blog.slug}`;

  return (
    <>
      <JsonLd
        data={[
          webPageSchema({
            title: `${blog.seo_title || blog.title} | MyShaadiStore Blog`,
            description: blog.seo_description || blog.excerpt,
            url: pageUrl,
          }),
          breadcrumbSchema([
            { name: "Home", url: `${SITE_URL}/` },
            { name: "Blog", url: `${SITE_URL}/blog` },
            { name: blog.title, url: pageUrl },
          ]),
          articleSchema({
            title: blog.title,
            description: blog.seo_description || blog.excerpt,
            url: pageUrl,
            image: blog.og_image || blog.cover_image,
            datePublished: blog.published_at,
            dateModified: blog.updated_at,
            author: blog.author,
          }),
        ]}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-primary-soft">
        <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary transition hover:text-primary sm:text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            All articles
          </Link>

          {blog.category ? (
            <div className="mt-5">
              <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground">
                {blog.category}
              </span>
            </div>
          ) : null}

          <h1 className={`${serif} mt-4 text-3xl font-bold leading-tight text-text-strong sm:text-5xl`}>
            {blog.title}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-muted">
            {blog.author ? (
              <>
                <span className="font-semibold text-text">{blog.author}</span>
                <span aria-hidden>·</span>
              </>
            ) : null}
            <span>{formatDate(blog.published_at)}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {blog.reading_time} min read
            </span>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {blog.cover_image ? (
          <div className="mb-10 overflow-hidden rounded-2xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={blog.cover_image} alt={blog.title} className="w-full object-cover" />
          </div>
        ) : null}

        <article>
          <BlogContent html={blog.content_html} />
        </article>

        {blog.tags?.length ? (
          <div className="mt-10 flex flex-wrap gap-2 border-t border-border pt-6">
            {blog.tags.map((t) => (
              <span key={t} className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-secondary">
                #{t}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-10">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-2 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to all articles
          </Link>
        </div>
      </main>
    </>
  );
}
