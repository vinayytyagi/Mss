import JourneySlugPageServer from "@/components/server/JourneySlugPageServer";
import JsonLd from "@/components/JsonLd";
import { fetchJourneyStep } from "@/lib/api";
import { webPageSchema, breadcrumbSchema } from "@/lib/jsonld";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://myshaadistore.com";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const step = await fetchJourneyStep(slug);
    const title = step?.title ?? "Wedding Journey";
    const description =
      step?.subtitle ||
      `Explore ${step?.title || "your wedding"} vendors and options on MyShaadiStore.`;

    return {
      title,
      description,
      keywords: [step?.title, "wedding planning", "wedding vendors India", `${step?.title} wedding`].filter(Boolean),
      alternates: { canonical: `${SITE_URL}/journey/${slug}` },
      openGraph: {
        title,
        description,
        url: `${SITE_URL}/journey/${slug}`,
        type: "website",
      },
    };
  } catch {
    return {
      title: "Wedding Journey",
      description: "Explore wedding planning journey step by step.",
      alternates: { canonical: `${SITE_URL}/journey/${slug}` },
    };
  }
}

export default async function JourneySlugPage({ params, searchParams }) {
  const { slug } = await params;

  // Fetch for JSON-LD — deduplicated by Next.js fetch cache
  let schemas = null;
  try {
    const step = await fetchJourneyStep(slug);
    if (step) {
      const pageUrl = `${SITE_URL}/journey/${slug}`;
      schemas = [
        webPageSchema({
          title: `${step.title} | MyShaadiStore`,
          description: step.subtitle || `Explore ${step.title} options for your wedding.`,
          url: pageUrl,
        }),
        breadcrumbSchema([
          { name: "Home", url: `${SITE_URL}/` },
          { name: "Journey", url: `${SITE_URL}/` },
          { name: step.title, url: pageUrl },
        ]),
      ];
    }
  } catch { /* schema is non-critical */ }

  return (
    <>
      {schemas && <JsonLd data={schemas} />}
      <JourneySlugPageServer params={params} searchParams={searchParams} />
    </>
  );
}
