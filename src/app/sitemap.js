import { fetchJourneySteps } from "@/lib/api";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://myshaadistore.com";

// Static public-facing routes
const staticRoutes = [
  { url: `${BASE_URL}/`,              changeFrequency: "weekly",  priority: 1.0 },
  { url: `${BASE_URL}/shopping`,      changeFrequency: "daily",   priority: 0.9 },
  { url: `${BASE_URL}/how-it-works`,  changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE_URL}/about-us`,      changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE_URL}/join-as-vendor`,changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE_URL}/careers`,       changeFrequency: "monthly", priority: 0.6 },
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

  return [
    ...staticRoutes.map((r) => ({ ...r, lastModified })),
    ...journeyRoutes,
  ];
}
