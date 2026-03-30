"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";

const MAROON = "#70012b";
const MAROON_SOFT = "#8b1a42";

function whatsappLink(message) {
  return `https://wa.me/919568559915?text=${encodeURIComponent(message)}`;
}

function SocialButton({ href, label, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-white transition hover:bg-white/20"
    >
      {children}
    </a>
  );
}

function MaroonNavLink({ href, children }) {
  return (
    <Link
      href={href}
      className="block text-sm font-normal text-white/90 transition hover:text-white hover:underline decoration-white/40 underline-offset-4"
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

export default function SiteFooterMaroon({ steps = [] }) {
  const pathname = usePathname();
  const shoppingHref = useMemo(() => {
    const shopping = steps.find((s) => s.slug === "shopping");
    return shopping ? `/journey/${shopping.slug}` : "/shopping";
  }, [steps]);
  const budgetHref = useMemo(() => {
    const budget = steps.find(
      (s) =>
        /budget/i.test(s.title || "") ||
        /budget/i.test(s.slug || "") ||
        /plan/i.test(s.slug || ""),
    );
    return budget ? `/journey/${budget.slug}` : steps[0] ? `/journey/${steps[0].slug}` : "/how-it-works";
  }, [steps]);

  if (pathname === "/login" || pathname === "/signup") {
    return null;
  }

  return (
    <footer className="border-t border-white/10 text-white" style={{ backgroundColor: MAROON }}>
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <div className="flex flex-col items-start gap-5">
              <div
                className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-white/25 shadow-[0_12px_40px_rgba(0,0,0,0.25)]"
                style={{ backgroundColor: MAROON_SOFT }}
              >
                <Image
                  src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=200&h=200&q=80"
                  alt="MyShaadiStore"
                  width={200}
                  height={200}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p
                  className="text-3xl font-medium tracking-tight text-white sm:text-4xl"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                >
                  MyShaadiStore
                </p>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/85">
                  Your dream wedding, all in one place. Premium planning for unforgettable celebrations.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 pt-1">
                <SocialButton href="https://instagram.com" label="Instagram">
                  <InstagramIcon />
                </SocialButton>
                <SocialButton href="https://facebook.com" label="Facebook">
                  <FacebookIcon />
                </SocialButton>
                <SocialButton href="https://x.com" label="X">
                  <XIcon />
                </SocialButton>
              </div>
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-3 lg:col-span-8">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-white">Company</h3>
              <ul className="mt-5 space-y-3">
                <li>
                  <MaroonNavLink href="/how-it-works">About</MaroonNavLink>
                </li>
                <li>
                  <a
                    href={whatsappLink("Hi MyShaadiStore — Careers inquiry")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm font-normal text-white/90 transition hover:text-white hover:underline decoration-white/40 underline-offset-4"
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href={whatsappLink("Hi MyShaadiStore — Press inquiry")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm font-normal text-white/90 transition hover:text-white hover:underline decoration-white/40 underline-offset-4"
                  >
                    Press
                  </a>
                </li>
                <li>
                  <a
                    href={whatsappLink("Hi MyShaadiStore")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm font-normal text-white/90 transition hover:text-white hover:underline decoration-white/40 underline-offset-4"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-white">Services</h3>
              <ul className="mt-5 space-y-3">
                <li>
                  <MaroonNavLink href={shoppingHref}>Vendors</MaroonNavLink>
                </li>
                <li>
                  <MaroonNavLink href={budgetHref}>Budget Planner</MaroonNavLink>
                </li>
                <li>
                  <MaroonNavLink href="/how-it-works">Honeymoon</MaroonNavLink>
                </li>
                <li>
                  <MaroonNavLink href={shoppingHref}>Collections</MaroonNavLink>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-white">Legal</h3>
              <ul className="mt-5 space-y-3">
                <li>
                  <MaroonNavLink href="/legal/privacy">Privacy Policy</MaroonNavLink>
                </li>
                <li>
                  <MaroonNavLink href="/legal/terms">Terms of Service</MaroonNavLink>
                </li>
                <li>
                  <MaroonNavLink href="/legal/refund">Refund Policy</MaroonNavLink>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-white/35 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 text-xs text-white/80 sm:flex-row sm:text-sm">
            <p>© {new Date().getFullYear()} MyShaadiStore.com. All rights reserved.</p>
            <p className="text-white/90">Made with love for love ❤</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
