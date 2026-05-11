import HeroSection from "@/components/HeroSection";
import WeddingJourney from "@/components/WeddingJourney";
import HomeNeedToShop from "@/components/HomeNeedToShop";
import HomeWeddingOverwhelming from "@/components/HomeWeddingOverwhelming";
import HomeWeddingShowcase from "@/components/HomeWeddingShowcase";
import { fetchHeroSlideshow } from "@/lib/api";

export default async function HomePageServer() {
  let heroSlideshow = null;
  try {
    heroSlideshow = await fetchHeroSlideshow();
  } catch {
    heroSlideshow = null;
  }

  return (
    <main>
      <HeroSection heroSlideshow={heroSlideshow} />
      <WeddingJourney />
      <HomeNeedToShop />
      <HomeWeddingOverwhelming />
      <HomeWeddingShowcase />
    </main>
  );
}
