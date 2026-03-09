import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "My Shaadi Store | Your Complete Shaadi Solution",
  description: "More than just a destination—My Shaadi Store is your all-in-one companion for the perfect Indian wedding. Discover bridal wear, trusted vendors, and dream venues.",
  keywords: "My Shaadi Store, Indian wedding, Shaadi, wedding planning, bridal wear, wedding venues, wedding vendors, Indian bridal, marriage destination, shaadi solutions",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
