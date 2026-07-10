import HeroSection from "@/components/HeroSection";
import WeddingJourney from "@/components/WeddingJourney";
import HomeNeedToShop from "@/components/HomeNeedToShop";
import HomeWeddingOverwhelming from "@/components/HomeWeddingOverwhelming";
import HomeWeddingShowcase from "@/components/HomeWeddingShowcase";
import HomeBlogSection from "@/components/HomeBlogSection";
import { fetchHeroSlideshow, fetchHomepageBlogs } from "@/lib/api";

export default async function HomePageServer() {
  let heroSlideshow = null;
  let homeBlogs = [];
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

  return (
    <main>
      <HeroSection heroSlideshow={heroSlideshow} />
      <WeddingJourney />
      <HomeNeedToShop />
      <HomeWeddingOverwhelming />
      <HomeWeddingShowcase />
      <HomeBlogSection blogs={homeBlogs} />
    </main>
  );
}
