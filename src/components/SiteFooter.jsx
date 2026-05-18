"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  Heart,
  ShoppingBag,
  Compass,
  HelpCircle,
  Truck,
  User,
  Package,
  MessageCircle,
  Phone,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

const WHATSAPP_HREF = "https://wa.me/919568559915?text=Hi%20MyShaadiStore";
const PHONE_DISPLAY = "+91 95685 59915";
const PHONE_HREF = "tel:+919568559915";

function FooterLink({ href, children, external }) {
  const className =
    "group inline-flex items-center gap-1 text-sm font-medium text-muted transition hover:text-primary";
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
        <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-70" />
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export default function SiteFooter({ steps = [] }) {
  const pathname = usePathname();
  const shoppingStep = useMemo(() => steps.find((s) => s.slug === "shopping"), [steps]);
  const shoppingHref = shoppingStep ? `/journey/${shoppingStep.slug}` : "/shopping";
  const journeyStartHref = steps[0] ? `/journey/${steps[0].slug}` : "/";

  if (pathname === "/login" || pathname === "/signup") {
    return null;
  }

  const journeyLinks = steps.slice(0, 8);

  return (
    <footer className="relative mt-auto border-t border-border bg-[linear-gradient(165deg,#ffffff_0%,#fdf8fb_42%,#f6eef4_100%)]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent"
        aria-hidden
      />
      <div className="pointer-events-none absolute -top-24 right-0 h-48 w-48 rounded-full bg-primary/10 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-primary-accent-2/10 blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-14 sm:px-6 sm:pb-16 lg:px-8 lg:pb-14 lg:pt-16">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_14px_30px_rgba(255,79,134,0.35)]">
                <Heart className="h-5 w-5 fill-current" strokeWidth={0} aria-hidden />
              </span>
              <span className="text-xl font-semibold tracking-tight text-text-strong">MyShaadiStore</span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
              Plan your wedding journey with curated steps, thoughtful shopping, and human support when you need
              it—minimal fuss, maximum celebration.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={journeyStartHref}
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_12px_28px_rgba(255,79,134,0.28)] transition hover:bg-primary-hover"
              >
                <Sparkles className="h-4 w-4" />
                Start your journey
              </Link>
              <FooterLink href={shoppingHref}>
                <span className="inline-flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  Browse shopping
                </span>
              </FooterLink>
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-3">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
                <Compass className="h-4 w-4 text-primary" />
                Explore
              </p>
              <ul className="mt-4 space-y-3">
                <li>
                  <FooterLink href="/">Home</FooterLink>
                </li>
                <li>
                  <FooterLink href="/about-us">About us</FooterLink>
                </li>
                <li>
                  <FooterLink href="/how-it-works">
                    <span className="inline-flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-subtle" />
                      How it works
                    </span>
                  </FooterLink>
                </li>
                <li>
                  <FooterLink href={shoppingHref}>
                    <span className="inline-flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-subtle" />
                      Shopping
                    </span>
                  </FooterLink>
                </li>
                <li>
                  <FooterLink href="/cart">
                    <span className="inline-flex items-center gap-2">Cart &amp; checkout</span>
                  </FooterLink>
                </li>
              </ul>
            </div>

            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
                <Truck className="h-4 w-4 text-primary" />
                Orders &amp; account
              </p>
              <ul className="mt-4 space-y-3">
                <li>
                  <FooterLink href="/orders/track-order">
                    <span className="inline-flex items-center gap-2">
                      <Truck className="h-4 w-4 text-subtle" />
                      Track order
                    </span>
                  </FooterLink>
                </li>
                <li>
                  <FooterLink href="/orders">
                    <span className="inline-flex items-center gap-2">
                      <Package className="h-4 w-4 text-subtle" />
                      My orders
                    </span>
                  </FooterLink>
                </li>
                <li>
                  <FooterLink href="/profile">
                    <span className="inline-flex items-center gap-2">
                      <User className="h-4 w-4 text-subtle" />
                      Profile &amp; addresses
                    </span>
                  </FooterLink>
                </li>
              </ul>
            </div>

            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
                Journey
              </p>
              {journeyLinks.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {journeyLinks.map((step, index) => (
                    <li key={step.step_id}>
                      <Link
                        href={`/journey/${step.slug}`}
                        className={`inline-flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                          pathname === `/journey/${step.slug}`
                            ? "border-primary-soft bg-surface/80 text-primary shadow-[0_8px_22px_rgba(255,79,134,0.12)]"
                            : "border-transparent text-muted hover:border-border hover:bg-surface/60 hover:text-primary"
                        }`}
                      >
                        <span className="line-clamp-1">{step.title}</span>
                        <span className="shrink-0 text-[11px] font-semibold text-subtle">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-muted">Journey steps will appear here once configured.</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-6 rounded-3xl border border-surface/80 bg-surface/70 p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="text-sm font-semibold text-text-strong">We are a message away</p>
            <p className="mt-1 text-sm text-muted">
              WhatsApp us for quick help with orders, quotations, or your wedding checklist.
            </p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <a
                href={PHONE_HREF}
                className="inline-flex items-center gap-2 font-medium text-text transition hover:text-primary"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Phone className="h-4 w-4" />
                </span>
                {PHONE_DISPLAY}
              </a>
              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-medium text-[#128C7E] transition hover:text-[#0d6f63]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8fff4] text-[#128C7E]">
                  <MessageCircle className="h-4 w-4" />
                </span>
                Chat on WhatsApp
              </a>
            </div>
          </div>
          <div className="shrink-0 text-xs leading-relaxed text-subtle sm:text-right">
            <p>We reply as soon as we can during business hours.</p>
            <p className="mt-1">Thank you for choosing MyShaadiStore.</p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border/80 pt-8 text-center text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p>
            © {new Date().getFullYear()} MyShaadiStore. All rights reserved.
          </p>
          <p className="flex items-center justify-center gap-1.5 sm:justify-end">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Heart className="h-3 w-3 fill-current" strokeWidth={0} />
            </span>
            Crafted for couples who like it simple, clear, and beautiful.
          </p>
        </div>
      </div>
    </footer>
  );
}
