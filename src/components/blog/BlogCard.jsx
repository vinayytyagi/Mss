import Link from "next/link";
import { Clock } from "lucide-react";

const serif = "font-[family-name:var(--font-playfair),ui-serif,Georgia,serif]";

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Blog card — used on /blog and the homepage "From our blog" strip.
 * `blog` is a PublicBlogCard from the blogs API.
 */
export default function BlogCard({ blog }) {
  return (
    <Link
      href={`/blog/${blog.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-16/10 overflow-hidden bg-primary-soft">
        {blog.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={blog.cover_image}
            alt={blog.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary-soft to-secondary/10">
            <span className={`${serif} px-4 text-center text-lg font-semibold text-secondary/70`}>
              MyShaadiStore
            </span>
          </div>
        )}
        {blog.category ? (
          <span className="absolute left-3 top-3 rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-foreground">
            {blog.category}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className={`${serif} line-clamp-2 text-lg font-bold leading-snug text-text-strong group-hover:text-primary`}>
          {blog.title}
        </h3>
        {blog.excerpt ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted">{blog.excerpt}</p>
        ) : null}
        <div className="mt-auto flex items-center gap-2 pt-2 text-xs text-muted">
          {blog.author ? (
            <>
              <span className="font-medium text-text">{blog.author}</span>
              <span aria-hidden>·</span>
            </>
          ) : null}
          <span>{formatDate(blog.published_at)}</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" aria-hidden />
            {blog.reading_time} min read
          </span>
        </div>
      </div>
    </Link>
  );
}
