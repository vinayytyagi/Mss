export const dynamic = "force-dynamic";

import { Poppins, Playfair_Display } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SiteFooterMaroon from "@/components/SiteFooterMaroon";
import { fetchJourneySteps } from "@/lib/api";
import AppToaster from "@/components/ui/toaster";
import { getAuthUserServer } from "@/lib/authCookiesServer";
import { MessageCircle } from "lucide-react";

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

export const metadata = {
  title: "MyShaadiStore",
  description: "Wedding planning journey powered by admin-managed steps",
};

export default async function RootLayout({ children }) {
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
      <body
        className={`${poppins.variable} ${playfair.variable} font-sans antialiased`}
      >
        <div className="flex min-h-screen flex-col overflow-x-hidden bg-[radial-gradient(circle_at_top,#fff7fa_0%,#f7f7fb_35%,#f4f4f8_100%)]">
          <SiteHeader steps={steps} initialUser={initialUser} />
          <AppToaster />
          {children}
          <SiteFooter steps={steps} />
          <SiteFooterMaroon steps={steps} />
          <a
            href="https://wa.me/919568559915?text=Hi%20MyShaadiStore"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat on WhatsApp"
            className="fixed bottom-5 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_14px_28px_rgba(37,211,102,0.35)] transition hover:scale-105 sm:bottom-6 sm:right-6"
          >
            <MessageCircle className="h-7 w-7 stroke-[2.2] text-white" aria-hidden="true" />
          </a>
        </div>
      </body>
    </html>
  );
}
