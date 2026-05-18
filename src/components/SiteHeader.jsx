"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearAuthCookies, useAuthUser } from "@/lib/authCookies";
import BasketButton from "@/components/BasketButton";
import { useWishlistState } from "@/lib/wishlistStore";
import LogoutConfirmModal from "@/components/LogoutConfirmModal";
import { User, Package, Truck, LogOut, Menu, X, ShoppingBag, Heart, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { getAuthToken } from "@/lib/authCookies";
import { restartMyJourney } from "@/lib/api/userApi";

function FavouritesHeaderButton({ className = "" }) {
  const state = useWishlistState();
  const count = state.journey.length + state.shopping.length;
  return (
    <Link
      href="/favourites"
      aria-label="Open favourites"
      className={`relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border-strong text-text transition hover:bg-surface-muted ${className}`}
    >
      <Heart className="h-5 w-5" strokeWidth={2} />
      {count > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
          {count}
        </span>
      ) : null}
    </Link>
  );
}

function ChevronDown() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "").slice(-10);
}

export default function SiteHeader({ steps = [], initialUser = null }) {
  const router = useRouter();
  const pathname = usePathname();
  const shoppingStep = useMemo(() => steps.find((step) => step.slug === "shopping"), [steps]);
  const user = useAuthUser(initialUser);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutModalPathname, setLogoutModalPathname] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileJourneyOpen, setIsMobileJourneyOpen] = useState(false);
  const isJourneyActive = pathname?.startsWith("/journey/");
  const isShoppingActive =
    pathname?.startsWith("/shopping") || (shoppingStep && pathname === `/journey/${shoppingStep.slug}`);
  // Underline using `after` so it renders consistently (hover + active).
  const navLinkClass =
    "relative pb-0.5 text-muted transition-colors duration-200 hover:text-text-strong after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[1.5px] after:w-full after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-200 hover:after:scale-x-100";
  const activeNavLinkClass =
    "relative pb-0.5 text-text-strong transition-colors duration-200 after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-full after:origin-left after:scale-x-100 after:bg-primary after:transition-transform after:duration-200 hover:text-text-strong hover:after:scale-x-100";

  function handleLogout() {
    setShowLogoutModal(false);
    setLogoutModalPathname(null);
    clearAuthCookies();
    // Intentionally NOT clearing carts or wishlist — the basket is the
    // customer's working draft on this device. If they log back in (even
    // as a different user) they should still see the items they were
    // about to buy, otherwise an accidental logout means the whole
    // session's work disappears.
    toast.success("Logged out successfully.");
    router.replace("/");
    router.refresh();
  }

  if (pathname === "/login" || pathname.startsWith("/signup")) {
    return null;
  }

  const logoutModalOpen = showLogoutModal && logoutModalPathname === pathname;

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-surface/70 bg-surface/95 backdrop-blur">
      <div className="mx-auto flex w-full items-center justify-between gap-3 px-3 py-3 sm:px-6 lg:px-20">
        <Link href="/" className="flex cursor-pointer items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center">
            <Image
              src="/Circular_logo.png"
              alt="MyShaadiStore logo"
              width={128}
              height={128}
              // sizes="40px"
              quality={100}
              className="h-10 w-10 object-contain"
            />
          </span>
          <span className="text-lg font-semibold text-secondary sm:text-xl lg:text-2xl font-[serif]">MyShaadi<span className="text-[#d4720a]">Store</span></span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-semibold text-muted lg:flex">
          <Link href="/" className={pathname === "/" ? activeNavLinkClass : navLinkClass}>
            Home
          </Link>

          <div className="group relative">
            <button
              className={`flex cursor-pointer items-center gap-1 ${
                isJourneyActive ? activeNavLinkClass : navLinkClass
              }`}
            >
              Journey
              <ChevronDown />
            </button>

            <div className="pointer-events-none absolute left-1/2 top-full w-90 -translate-x-1/2 rounded-3xl border border-border bg-surface p-4 opacity-0 shadow-[0_25px_80px_rgba(16,24,40,0.12)] transition duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
              <p className="mb-3 text-xs font-medium text-subtle">
                Journey Steps
              </p>
              <div className="grid gap-2">
                {steps.map((step, index) => (
                  <Link
                    key={step.step_id}
                    href={`/journey/${step.slug}`}
                    className={`flex cursor-pointer items-center justify-between rounded-2xl px-4 py-3 transition ${
                      pathname === `/journey/${step.slug}`
                        ? "bg-primary-soft text-primary"
                        : "hover:bg-primary-soft"
                    }`}
                  >
                    <span
                      className={`text-sm font-semibold ${
                        pathname === `/journey/${step.slug}` ? "text-primary" : "text-text"
                      }`}
                    >
                      {step.title}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        pathname === `/journey/${step.slug}` ? "text-primary-accent" : "text-subtle"
                      }`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <Link
            href="/shopping"
            className={isShoppingActive ? activeNavLinkClass : navLinkClass}
          >
            Shopping
          </Link>
          <Link
            href="/how-it-works"
            className={pathname === "/how-it-works" ? activeNavLinkClass : navLinkClass}
          >
            How it works
          </Link>
          <Link
            href="/orders/track-order"
            className={pathname === "/orders/track-order" ? activeNavLinkClass : navLinkClass}
          >
            Track Order
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden lg:block">
            <FavouritesHeaderButton />
          </div>
          <div className="hidden lg:block">
            <BasketButton />
          </div>
          <div className="hidden lg:block">
          {user ? (
            <div className="group relative">
              <button className="flex cursor-pointer items-center gap-2 rounded-full border border-border-strong px-5 py-2.5 text-sm font-medium text-text transition hover:border-primary hover:text-primary">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary-accent text-xs font-semibold text-primary-foreground">
                  {(user.name || "U").charAt(0).toUpperCase()}
                </span>
                {user.name ? user.name.split(" ")[0] : `+91 ${normalizePhone(user.phone) || ""}`}
                <ChevronDown />
              </button>
              <div className="pointer-events-none absolute right-0 top-full w-56 rounded-2xl border border-border bg-surface p-2 opacity-0 shadow-[0_25px_80px_rgba(16,24,40,0.12)] transition duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
                <Link href="/profile" className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${pathname === '/profile' ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-surface-muted'}`}>
                  <User className="h-4 w-4" />
                  My Profile
                </Link>
                <Link href="/orders" className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${pathname === '/orders' ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-surface-muted'}`}>
                  <Package className="h-4 w-4" />
                  My Orders
                </Link>
                <Link href="/orders/track-order" className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${pathname === '/orders/track-order' ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-surface-muted'}`}>
                  <Truck className="h-4 w-4" />
                  Track Order
                </Link>
                <button
                  onClick={async () => {
                    const ok = window.confirm(
                      "Restart your wedding journey?\n\nWe'll wipe your engagement / date / venue / guests / budget answers and walk you through the wizard again. Your account, orders and saved addresses stay.",
                    );
                    if (!ok) return;
                    const token = getAuthToken();
                    if (!token) {
                      router.push("/login");
                      return;
                    }
                    try {
                      await restartMyJourney(token);
                      toast.success("Journey reset — let's set it up again.");
                      router.push("/signup/engaged");
                    } catch (e) {
                      toast.error(e?.message || "Couldn't reset your journey.");
                    }
                  }}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-muted transition hover:bg-surface-muted hover:text-text"
                >
                  <RefreshCw className="h-4 w-4" />
                  Restart my journey
                </button>
                <div className="my-1 border-t border-border" />
                <button
                  onClick={() => {
                    setLogoutModalPathname(pathname);
                    setShowLogoutModal(true);
                  }}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-danger transition hover:bg-danger/10"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="cursor-pointer rounded-full border border-border-strong px-5 py-2.5 text-sm font-semibold text-text transition hover:border-border-strong hover:bg-surface-muted"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="signup-header-cta cursor-pointer rounded-2xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_18px_40px_rgba(255,79,134,0.28)] transition hover:bg-primary-hover hover:text-primary-foreground"
              >
                Sign up
              </Link>
            </>
          )}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <FavouritesHeaderButton />
            <Link
              href="/cart"
              aria-label="Open cart"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border-strong text-text transition hover:bg-surface-muted"
            >
              <ShoppingBag className="h-5 w-5" />
            </Link>
            <Link
              href={user ? "/profile" : "/login"}
              aria-label={user ? "Open profile" : "Open login"}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border-strong text-text transition hover:bg-surface-muted"
            >
              <User className="h-5 w-5" />
            </Link>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border-strong text-text lg:hidden"
            aria-label="Open navigation menu"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-1000 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-text-strong/45"
            aria-label="Close menu backdrop"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-[88%] max-w-sm bg-surface/95 backdrop-blur p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-lg font-semibold text-text-strong">Menu</span>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border-strong text-text"
                aria-label="Close navigation menu"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-1 border-t border-border pt-3 text-[15px] font-medium text-text">
              <Link href="/" className="block rounded-lg px-3 py-2 hover:bg-surface-muted" onClick={() => setIsMobileMenuOpen(false)}>
                Home
              </Link>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-surface-muted"
                onClick={() => setIsMobileJourneyOpen((value) => !value)}
              >
                Journey
                <ChevronDown />
              </button>
              {isMobileJourneyOpen ? (
                <div className="mx-2 mb-2 space-y-1 rounded-xl bg-surface-muted p-2">
                  {steps.map((step) => (
                    <Link
                      key={step.step_id}
                      href={`/journey/${step.slug}`}
                      className="block rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {step.title}
                    </Link>
                  ))}
                </div>
              ) : null}
              <Link
                href="/shopping"
                className="block rounded-lg px-3 py-2 hover:bg-surface-muted"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Shopping
              </Link>
              <Link href="/how-it-works" className="block rounded-lg px-3 py-2 hover:bg-surface-muted" onClick={() => setIsMobileMenuOpen(false)}>
                How it works
              </Link>
              <Link href="/orders/track-order" className="block rounded-lg px-3 py-2 hover:bg-surface-muted" onClick={() => setIsMobileMenuOpen(false)}>
                Track Order
              </Link>
              {user ? (
                <button
                  type="button"
                  className="block w-full rounded-lg px-3 py-2 text-left text-danger hover:bg-danger/10"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setLogoutModalPathname(pathname);
                    setShowLogoutModal(true);
                  }}
                >
                  Logout
                </button>
              ) : (
                <div className="space-y-2 border-t border-border pt-3">
                  <Link
                    href="/login"
                    className="flex w-full items-center justify-center rounded-xl border border-border-strong bg-surface px-4 py-2.5 text-sm font-semibold text-text transition hover:bg-surface-muted"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_18px_40px_rgba(255,79,134,0.28)] transition hover:bg-primary-hover"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                </div>
              )}
              <div className="border-t border-border pt-3">
                <BasketButton />
              </div>
            </div>
          </div>
        </div>
      ) : null}
      </header>
      <div className="h-22 sm:h-23" aria-hidden="true" />
      <LogoutConfirmModal
        open={logoutModalOpen}
        onClose={() => {
          setShowLogoutModal(false);
          setLogoutModalPathname(null);
        }}
        onConfirm={handleLogout}
      />
    </>
  );
}
