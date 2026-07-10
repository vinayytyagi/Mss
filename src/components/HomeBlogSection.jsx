import Link from "next/link";
import { ArrowRight } from "lucide-react";
import BlogCard from "@/components/blog/BlogCard";

const serif = "font-[family-name:var(--font-playfair),ui-serif,Georgia,serif]";

/**
 * Homepage "From our blog" strip — admin-curated posts
 * (show_on_homepage = true), newest first, max 6. Hidden when empty.
 */
export default function HomeBlogSection({ blogs }) {
  if (!Array.isArray(blogs) || blogs.length === 0) return null;

  return (
    <section className="bg-surface-muted/30 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground">
              From our blog
            </span>
            <h2 className={`${serif} mt-4 text-2xl font-bold text-text-strong sm:text-4xl`}>
              Wedding ideas & inspiration
            </h2>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-2 hover:underline"
          >
            View all articles
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {blogs.slice(0, 6).map((blog) => (
            <BlogCard key={blog.id} blog={blog} />
          ))}
        </div>
      </div>
    </section>
  );
}
