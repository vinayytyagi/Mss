import { fetchJourneySteps, fetchBlogs } from "@/lib/api";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://myshaadistore.com";

// Static public-facing routes
const staticRoutes = [
  { url: `${BASE_URL}/`,              changeFrequency: "weekly",  priority: 1.0 },
  { url: `${BASE_URL}/shopping`,      changeFrequency: "daily",   priority: 0.9 },
  { url: `${BASE_URL}/how-it-works`,  changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE_URL}/about-us`,      changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE_URL}/join-as-vendor`,changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE_URL}/careers`,       changeFrequency: "monthly", priority: 0.6 },
  { url: `${BASE_URL}/blog`,          changeFrequency: "weekly",  priority: 0.8 },
];

export default async function sitemap() {
  const lastModified = new Date();

  // Dynamic: one URL per journey step (e.g. /journey/venue, /journey/catering)
  let journeyRoutes = [];
  try {
    const steps = await fetchJourneySteps();
    if (Array.isArray(steps)) {
      journeyRoutes = steps
        .filter((s) => s?.slug)
        .map((s) => ({
          url: `${BASE_URL}/journey/${s.slug}`,
          lastModified,
          changeFrequency: "weekly",
          priority: 0.85,
        }));
    }
  } catch {
    // API unavailable during build — static routes still emitted
  }

  // Dynamic: one URL per live blog post. Request the API's max page size and
  // cap the page walk (ceiling: BLOG_LIMIT * BLOG_MAX_PAGES posts); a mid-loop
  // failure keeps the pages already collected instead of dropping everything.
  const BLOG_LIMIT = 24; // public /blogs route caps limit at 24
  const BLOG_MAX_PAGES = 10; // 240-post ceiling — raise if the blog outgrows it
  let blogRoutes = [];
  try {
    const data = await fetchBlogs({ page: 1, limit: BLOG_LIMIT });
    const totalPages = Number(data?.pages) || 1;
    const pages = Math.min(totalPages, BLOG_MAX_PAGES);
    if (totalPages > BLOG_MAX_PAGES) {
      console.warn(`sitemap: blog truncated to ${BLOG_LIMIT * BLOG_MAX_PAGES} posts; oldest omitted`);
    }
    let posts = Array.isArray(data?.blogs) ? [...data.blogs] : [];
    for (let p = 2; p <= pages; p += 1) {
      try {
        const next = await fetchBlogs({ page: p, limit: BLOG_LIMIT });
        if (Array.isArray(next?.blogs)) posts = posts.concat(next.blogs);
      } catch {
        break; // keep the pages already collected
      }
    }
    blogRoutes = posts
      .filter((b) => b?.slug)
      .map((b) => ({
        url: `${BASE_URL}/blog/${b.slug}`,
        lastModified: b.published_at ? new Date(b.published_at) : lastModified,
        changeFrequency: "monthly",
        priority: 0.6,
      }));
  } catch {
    // API unavailable — static routes still emitted
  }

  return [
    ...staticRoutes.map((r) => ({ ...r, lastModified })),
    ...journeyRoutes,
    ...blogRoutes,
  ];
}
