import FavouritesPage from "@/components/FavouritesPage";

export const metadata = {
  title: "Your Favourites",
  description: "Your saved wedding vendors, outfits, décor and shopping picks — all in one place. Revisit favourites anytime and request quotations directly.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <FavouritesPage />;
}
