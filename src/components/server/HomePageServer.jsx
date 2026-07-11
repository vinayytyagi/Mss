import HeroSection from "@/components/HeroSection";
import WeddingJourney from "@/components/WeddingJourney";
import HomeNeedToShop from "@/components/HomeNeedToShop";
import HomeWeddingOverwhelming from "@/components/HomeWeddingOverwhelming";
import HomeWeddingShowcase from "@/components/HomeWeddingShowcase";
import HomeBlogSection from "@/components/HomeBlogSection";
import HomeFaqSection from "@/components/HomeFaqSection";
import JsonLd from "@/components/JsonLd";
import { faqSchema } from "@/lib/jsonld";
import { fetchHeroSlideshow, fetchHomepageBlogs, fetchHomepageFaqs } from "@/lib/api";

export default async function HomePageServer() {
  let heroSlideshow = null;
  let homeBlogs = [];
  let faqs = { enabled: true, eyebrow: "Questions", heading: "Frequently asked questions", items: [] };

  try {
    heroSlideshow = await fetchHeroSlideshow();
  } catch {
    heroSlideshow = null;
  }
  try {
    const data = await fetchHomepageBlogs();
    homeBlogs = Array.isArray(data?.blogs) ? data.blogs : [];
  } catch {
    homeBlogs = [];
  }
  try {
    const data = await fetchHomepageFaqs();
    faqs = {
      enabled: data?.enabled !== false,
      eyebrow: data?.eyebrow || "Questions",
      heading: data?.heading || "Frequently asked questions",
      items: Array.isArray(data?.items) ? data.items : [],
    };
  } catch {
    faqs = { enabled: false, eyebrow: "Questions", heading: "Frequently asked questions", items: [] };
  }

  // Only emit FAQ structured data when the section is actually shown.
  const showFaqs = faqs.enabled && faqs.items.length > 0;

  return (
    <>
      {showFaqs ? (
        <JsonLd data={faqSchema(faqs.items.map((it) => ({ question: it.q, answer: it.a })))} />
      ) : null}
      <main>
        <HeroSection heroSlideshow={heroSlideshow} />
        <WeddingJourney />
        <HomeNeedToShop />
        <HomeWeddingOverwhelming />
        <HomeWeddingShowcase />
        <HomeBlogSection blogs={homeBlogs} />
        <HomeFaqSection
          enabled={faqs.enabled}
          eyebrow={faqs.eyebrow}
          heading={faqs.heading}
          items={faqs.items}
        />
      </main>
    </>
  );
}
