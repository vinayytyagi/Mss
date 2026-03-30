import HeroSection from "@/components/HeroSection";
import WeddingJourney from "@/components/WeddingJourney";
import HomeWeddingShowcase from "@/components/HomeWeddingShowcase";
import { fetchHeroSlideshow, fetchJourneySteps } from "@/lib/api";

export default async function HomePageServer() {
  let heroSlideshow = null;
  try {
    heroSlideshow = await fetchHeroSlideshow();
  } catch {
    heroSlideshow = null;
  }

  let journeySteps = [];
  try {
    journeySteps = await fetchJourneySteps();
  } catch {
    journeySteps = [];
  }
  const journeyHref =
    journeySteps[0]?.slug != null ? `/journey/${journeySteps[0].slug}` : "/how-it-works";

  return (
    <main>
      <HeroSection heroSlideshow={heroSlideshow} />
      <WeddingJourney />
      <HomeWeddingShowcase journeyHref={journeyHref} />
    </main>
  );
}
