export const dynamic = "force-dynamic";

import { Poppins, Playfair_Display } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooterMaroon from "@/components/SiteFooterMaroon";
import { fetchJourneySteps } from "@/lib/api";
import AppToaster from "@/components/ui/toaster";
import ClientProgressBar from "@/components/ClientProgressBar";
import { getAuthUserServer } from "@/lib/authCookiesServer";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import ScrollToTop from "@/components/ScrollToTop";
import CookieConsent from "@/components/CookieConsent";
import JsonLd from "@/components/JsonLd";
import { organizationSchema, websiteSchema } from "@/lib/jsonld";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://myshaadistore.com";
const OG_IMAGE = `${SITE_URL}/Circular_logo.png`;

export const metadata = {
  title: {
    default: "MyShaadiStore",
    template: "%s | MyShaadiStore",
  },
  description: "Plan your perfect wedding with MyShaadiStore — curated vendors, guided journey, and seamless shopping.",
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: "/Circular_logo.png",
    shortcut: "/Circular_logo.png",
    apple: "/Circular_logo.png",
  },
  openGraph: {
    type: "website",
    siteName: "MyShaadiStore",
    title: "MyShaadiStore",
    description: "Plan your perfect wedding with MyShaadiStore — curated vendors, guided journey, and seamless shopping.",
    images: [{ url: OG_IMAGE, width: 512, height: 512, alt: "MyShaadiStore" }],
  },
  twitter: {
    card: "summary",
    title: "MyShaadiStore",
    description: "Plan your perfect wedding with MyShaadiStore — curated vendors, guided journey, and seamless shopping.",
    images: [OG_IMAGE],
  },
};

// Derive the API origin (e.g. https://mss-admin-flame.vercel.app) from the
// env var so local dev and production both preconnect to the right host.
function getApiOrigin() {
  const base = process.env.NEXT_PUBLIC_API_BASE;
  if (!base) return null;
  try { return new URL(base).origin; } catch { return null; }
}

export default async function RootLayout({ children }) {
  const apiOrigin = getApiOrigin();
  let steps = [];
  let initialUser = null;

  try {
    steps = await fetchJourneySteps();
  } catch {
    steps = [];
  }
  try {
    initialUser = await getAuthUserServer();
  } catch {
    initialUser = null;
  }

  return (
    <html lang="en">
      <head>
        {/* API server */}
        {apiOrigin && <link rel="preconnect" href={apiOrigin} />}
        {/* Oracle Cloud image CDN */}
        <link rel="preconnect" href="https://objectstorage.ap-mumbai-1.oraclecloud.com" />
        {/* Unsplash (fallback images) */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        {/* Razorpay checkout script */}
        <link rel="preconnect" href="https://checkout.razorpay.com" />
      </head>
      <body
        className={`${poppins.variable} ${playfair.variable} font-sans antialiased`}
      >
        <div className="flex min-h-screen flex-col overflow-x-clip bg-[radial-gradient(circle_at_top,var(--primary-soft)_0%,var(--background)_35%,var(--background)_100%)]">
          <SiteHeader steps={steps} initialUser={initialUser} />
          <JsonLd data={[organizationSchema(), websiteSchema()]} />
          <ScrollToTop />
          <ClientProgressBar />
          <AppToaster />
          {children}
          <SiteFooterMaroon steps={steps} />
          <CookieConsent />
          <a
            href={buildWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat on WhatsApp"
            className="fixed bottom-5 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-primary-foreground shadow-[0_14px_28px_rgba(37,211,102,0.35)] transition hover:scale-105 sm:bottom-6 sm:right-6"
          >
            <WhatsAppIcon className="h-7 w-7 text-primary-foreground" />
          </a>
        </div>
      </body>
    </html>
  );
}
