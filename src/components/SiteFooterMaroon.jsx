"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { buildWhatsAppUrl, WA_DEFAULT_MESSAGE } from "@/lib/whatsapp";
import { CookieSettingsButton } from "@/components/CookieConsent";

function SocialButton({ href, label, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-foreground/15 text-primary-foreground transition hover:bg-primary-foreground/25"
    >
      {children}
    </a>
  );
}

function MaroonNavLink({ href, children }) {
  return (
    <Link
      href={href}
      className="block text-sm font-normal text-primary-foreground/90 transition hover:text-primary-foreground hover:underline decoration-primary-foreground/40 underline-offset-4"
    >
      {children}
    </Link>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
      <path d="M12 7.2A4.8 4.8 0 1 0 16.8 12 4.81 4.81 0 0 0 12 7.2Zm0 7.93A3.13 3.13 0 1 1 15.13 12 3.13 3.13 0 0 1 12 15.13Zm6.14-8.14a1.12 1.12 0 1 1-1.12-1.12 1.12 1.12 0 0 1 1.12 1.12ZM20.4 7.2a4.24 4.24 0 0 0-1.19-3A4.24 4.24 0 0 0 16.2 3h-8.4a4.24 4.24 0 0 0-3 1.19 4.24 4.24 0 0 0-1.19 3v8.4a4.24 4.24 0 0 0 1.19 3 4.24 4.24 0 0 0 3 1.19h8.4a4.24 4.24 0 0 0 3-1.19 4.24 4.24 0 0 0 1.19-3V7.2Zm-1.68 8.52a2.58 2.58 0 0 1-.73 1.83 2.58 2.58 0 0 1-1.83.73H7.84a2.58 2.58 0 0 1-1.83-.73 2.58 2.58 0 0 1-.73-1.83V7.84a2.58 2.58 0 0 1 .73-1.83 2.58 2.58 0 0 1 1.83-.73h8.32a2.58 2.58 0 0 1 1.83.73 2.58 2.58 0 0 1 .73 1.83v8.32Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
      <path d="M13.5 22v-8.21h2.75l.52-3.39H13.5V8.58c0-.93.26-1.56 1.59-1.56h1.7V3.89A22.19 22.19 0 0 0 14.23 3.5c-2.44 0-4.11 1.49-4.11 4.23v2.67H7.5v3.39h2.62V22h3.38Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
      <path d="M15.713 3h2.98l-6.51 7.43L20 21h-5.98l-4.68-6.12L5.5 21h-3l6.96-7.95L3 3h6.12l4.24 5.57L15.713 3Zm-1.05 16.22h1.65L7.86 4.72H6.1l8.563 14.5Z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1 31.5 31.5 0 0 0 .5-5.8 31.5 31.5 0 0 0-.5-5.8ZM9.75 15.02V8.98L15.5 12l-5.75 3.02Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
      <path d="M4.98 3.5C4.98 4.88 3.86 6 2.48 6S0 4.88 0 3.5 1.12 1 2.48 1s2.5 1.12 2.5 2.5ZM.5 8.5h4V23H.5V8.5ZM8 8.5h3.8v2h.05c.53-1 1.82-2.05 3.75-2.05 4 0 4.7 2.63 4.7 6.05V23H16v-7.2c0-1.72-.03-3.93-2.4-3.93-2.4 0-2.77 1.88-2.77 3.82V23H8V8.5Z" />
    </svg>
  );
}

export default function SiteFooterMaroon({ steps = [] }) {
  const pathname = usePathname();
  const journeyHref = useMemo(
    () => (slug, fallback) => {
      const step = steps.find((s) => s.slug === slug);
      return step ? `/journey/${step.slug}` : fallback;
    },
    [steps],
  );
  const venueHref = journeyHref("venue", "/journey/venue");
  const decorHref = journeyHref("decor", "/journey/decor");
  const photographyHref = journeyHref("photography", "/journey/photography");
  const shoppingHref = journeyHref("shopping", "/shopping");

  if (pathname === "/login" || pathname === "/signup" || pathname.startsWith("/signup/")) {
    return null;
  }

  return (
    <footer className="border-t border-primary-foreground/10 bg-secondary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <div className="flex flex-col items-start gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center">
                <Image
                  src="/Circular_logo.png"
                  alt="MyShaadiStore logo"
                  width={200}
                  height={200}
                  quality={100}
                  priority
                  className="h-20 w-20 object-contain"
                />
              </div>
              <div>
                <p
                  className="text-3xl font-medium tracking-tight text-primary-foreground sm:text-4xl"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                >
                  MyShaadiStore
                </p>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-primary-foreground/85">
                  Your dream wedding, all in one place. Premium planning for unforgettable celebrations.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 pt-1">
                <SocialButton
                  href="https://www.instagram.com/my_shaadi_store?igsh=OHJ2OWpxaGQ2Mg=="
                  label="Instagram — MyShaadiStore"
                >
                  <InstagramIcon />
                </SocialButton>
                <SocialButton href="https://www.facebook.com/share/1DkWNmR29G/" label="Facebook — MyShaadiStore">
                  <FacebookIcon />
                </SocialButton>
                <SocialButton href="https://x.com/myshaadistore" label="X (Twitter) — MyShaadiStore">
                  <XIcon />
                </SocialButton>
                <SocialButton
                  href="https://www.youtube.com/@myshaadistore?si=-TDI4QfPiF7f3dFU"
                  label="YouTube — MyShaadiStore"
                >
                  <YouTubeIcon />
                </SocialButton>
                <SocialButton
                  href="https://www.linkedin.com/company/myshaadistore/"
                  label="LinkedIn — MyShaadiStore"
                >
                  <LinkedInIcon />
                </SocialButton>
              </div>
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-3 lg:col-span-8">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground">Company</h3>
              <ul className="mt-5 space-y-3">
                <li>
                  <MaroonNavLink href="/about-us">About us</MaroonNavLink>
                </li>
                <li>
                  <MaroonNavLink href="/join-as-vendor">Join as vendor</MaroonNavLink>
                </li>
                <li>
                  <MaroonNavLink href="/careers">Careers</MaroonNavLink>
                </li>
                <li>
                  <a
                    href={buildWhatsAppUrl(WA_DEFAULT_MESSAGE)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm font-normal text-primary-foreground/90 transition hover:text-primary-foreground hover:underline decoration-primary-foreground/40 underline-offset-4"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground">Services</h3>
              <ul className="mt-5 space-y-3">
                <li>
                  <MaroonNavLink href={venueHref}>Wedding Venues</MaroonNavLink>
                </li>
                <li>
                  <MaroonNavLink href={decorHref}>Décor and Styling</MaroonNavLink>
                </li>
                <li>
                  <MaroonNavLink href={photographyHref}>Wedding Services</MaroonNavLink>
                </li>
                <li>
                  <MaroonNavLink href={shoppingHref}>Shopping</MaroonNavLink>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground">Legal</h3>
              <ul className="mt-5 space-y-3">
                <li>
                  <MaroonNavLink href="/legal/privacy-policy">Privacy Policy</MaroonNavLink>
                </li>
                <li>
                  <MaroonNavLink href="/legal/terms-of-service">Terms of Service</MaroonNavLink>
                </li>
                <li>
                  <MaroonNavLink href="/legal/refund-policy">Refund Policy</MaroonNavLink>
                </li>
                <li>
                  <MaroonNavLink href="/legal/cookie-policy">Cookie Policy</MaroonNavLink>
                </li>
                <li>
                  <CookieSettingsButton
                    showIcon={false}
                    className="text-sm font-normal text-primary-foreground/90 transition hover:text-primary-foreground hover:underline decoration-primary-foreground/40 underline-offset-4"
                  />
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-primary-foreground/35 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 text-xs text-primary-foreground/80 sm:flex-row sm:text-sm">
            <p>© {new Date().getFullYear()} MyShaadiStore.com. All rights reserved.</p>
            <p className="text-primary-foreground/90">Designed and developed by <a href="https://xenotixlabs.com/" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/90 font-bold hover:text-primary-foreground">Xenotix Labs</a></p>
          </div>
        </div>
      </div>
    </footer>
  );
}
