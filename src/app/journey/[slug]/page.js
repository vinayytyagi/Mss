import JourneySlugPageServer from "@/components/server/JourneySlugPageServer";
import { fetchJourneyStep } from "@/lib/api";

export async function generateMetadata({ params }) {
  const { slug } = await params;

  try {
    const step = await fetchJourneyStep(slug);
    return {
      title: step?.title ? `${step.title} | MyShaadiStore` : "Wedding Journey | MyShaadiStore",
      description: step?.subtitle || `Explore ${step?.title || "your wedding"} options.`,
    };
  } catch {
    return {
      title: "Wedding Journey | MyShaadiStore",
      description: "Explore wedding planning journey step by step.",
    };
  }
}

export default async function JourneySlugPage({ params, searchParams }) {
  return (
    <JourneySlugPageServer
      params={params}
      searchParams={searchParams}
    />
  );
}
