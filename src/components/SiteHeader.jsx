"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearAuthCookies, useAuthUser } from "@/lib/authCookies";
import BasketButton from "@/components/BasketButton";
import { useWishlistState, clearWishlist } from "@/lib/wishlistStore";
import { useCartSummary, clearAllCarts, setEventDate } from "@/lib/cartStore";
import LogoutConfirmModal from "@/components/LogoutConfirmModal";
import { User, Package, Truck, LogOut, Menu, X, Heart, RefreshCw, Receipt, ShoppingCart, Home, ShoppingBag, HelpCircle, ChevronRight } from "lucide-react";
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

const QUOTE_COLOR = "#d4720a";

function CartHeaderButton() {
  const { quotationCount, shoppingCount } = useCartSummary();
  return (
    <>
      <Link
        href="/cart?tab=quotation"
        aria-label="Quote cart"
        title="Quote cart"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border-strong transition hover:bg-surface-muted"
        style={{ color: QUOTE_COLOR }}
      >
        <Receipt className="h-5 w-5" strokeWidth={2} />
        {quotationCount > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white" style={{ backgroundColor: QUOTE_COLOR }}>
            {quotationCount}
          </span>
        ) : null}
      </Link>
      <Link
        href="/cart?tab=shopping"
        aria-label="Shop cart"
        title="Shop cart"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border-strong text-primary transition hover:bg-surface-muted"
      >
        <ShoppingCart className="h-5 w-5" strokeWidth={2} />
        {shoppingCount > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
            {shoppingCount}
          </span>
        ) : null}
      </Link>
    </>
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
  const user = useAuthUser(initialUser);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutModalPathname, setLogoutModalPathname] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileJourneyOpen, setIsMobileJourneyOpen] = useState(false);
  const { quotationCount, shoppingCount } = useCartSummary();
  const isJourneyActive = pathname?.startsWith("/journey/");
  // Active ONLY for the dedicated /shopping pages — journey/shopping is the
  // journey step under "Journey", not the Shopping tab.
  const isShoppingActive = pathname?.startsWith("/shopping");
  // Underline using `after` so it renders consistently (hover + active).
  const navLinkClass =
    "relative pb-0.5 text-muted transition-colors duration-200 hover:text-text-strong after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[1.5px] after:w-full after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-200 hover:after:scale-x-100";
  const activeNavLinkClass =
    "relative pb-0.5 text-text-strong transition-colors duration-200 after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-full after:origin-left after:scale-x-100 after:bg-primary after:transition-transform after:duration-200 hover:text-text-strong hover:after:scale-x-100";

  function handleLogout() {
    setShowLogoutModal(false);
    setLogoutModalPathname(null);
    clearAuthCookies();
    // Clear the customer's local session data on logout so the next person on
    // this device (or the logged-out state) doesn't see the previous user's
    // basket and wishlist. These live in localStorage; the abandoned-cart
    // server mirror is keyed separately and is untouched.
    clearAllCarts();
    clearWishlist();
    setEventDate("");
    toast.success("Logged out successfully.");
    router.replace("/");
    router.refresh();
  }

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const prevOverflow = document.body.style.overflow;
    const prevTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouchAction;
    };
  }, [isMobileMenuOpen]);

  if (pathname === "/login" || pathname.startsWith("/signup")) {
    return null;
  }

  const logoutModalOpen = showLogoutModal && logoutModalPathname === pathname;

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-surface/70 bg-surface/95 backdrop-blur">
      <div className="mx-auto flex w-full items-center justify-between gap-2 px-2 py-3 sm:gap-3 sm:px-6 lg:px-20">
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
          <span className="hidden sm:block text-base font-semibold text-secondary sm:text-xl lg:text-2xl font-[serif]">MyShaadi<span className="text-[#d4720a]">Store</span></span>
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

            <div className="pointer-events-none absolute left-1/2 top-full w-90 -translate-x-1/2 rounded-xl border border-border bg-surface p-1.5 opacity-0 shadow-lg transition duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
              <p className="px-3 pb-1.5 pt-1 text-xs font-medium text-subtle">
                Journey Steps
              </p>
              <div className="scrollbar-soft grid max-h-[60vh] gap-0.5 overflow-y-auto pr-0.5">
                {steps.map((step, index) => {
                  const isActive = pathname === `/journey/${step.slug}`;
                  return (
                    <Link
                      key={step.step_id}
                      href={`/journey/${step.slug}`}
                      className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition ${
                        isActive
                          ? "bg-primary-soft text-primary font-medium"
                          : "text-text hover:bg-primary-soft"
                      }`}
                    >
                      <span className="truncate">{step.title}</span>
                      <span
                        className={`shrink-0 text-xs font-semibold ${
                          isActive ? "text-primary-accent" : "text-subtle"
                        }`}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </Link>
                  );
                })}
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
          <div className="hidden xl:block">
            <FavouritesHeaderButton />
          </div>
          <div className="hidden xl:block">
            <BasketButton />
          </div>
          <div className="hidden xl:block">
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

          <div className="flex items-center gap-1.5 sm:gap-2 xl:hidden">
            <FavouritesHeaderButton />
            <CartHeaderButton />
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border-strong text-text xl:hidden"
            aria-label="Open navigation menu"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
      </header>

      <div
        className={`fixed inset-0 z-1000 xl:hidden ${isMobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!isMobileMenuOpen}
      >
        {/* Backdrop */}
        <button
          type="button"
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ease-in-out ${isMobileMenuOpen ? "opacity-100" : "opacity-0"}`}
          aria-label="Close menu backdrop"
          tabIndex={isMobileMenuOpen ? 0 : -1}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Drawer panel */}
        <div className={`absolute right-0 top-0 flex h-dvh w-[88%] max-w-[320px] flex-col bg-surface shadow-[−24px_0_60px_rgba(15,23,42,0.18)] transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>

          {/* ── Top bar ── */}
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3.5">
            <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
              <Image src="/Circular_logo.png" alt="MyShaadiStore" width={32} height={32} quality={100} className="h-8 w-8 object-contain" />
              <span className="font-semibold text-secondary font-[serif] text-[15px]">MyShaadi<span className="text-[#d4720a]">Store</span></span>
            </Link>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border-strong text-text transition hover:bg-surface-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* ── Scrollable body ── */}
          <div className="flex-1 overflow-y-auto">

            {/* User card */}
            {user ? (
              <div className="m-4 rounded-2xl bg-linear-to-br from-primary/10 via-primary-soft to-primary/5 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary-accent text-base font-bold text-primary-foreground">
                    {(user.name || "U").charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text">{user.name || "Welcome back"}</p>
                    <p className="text-xs text-muted">+91 {normalizePhone(user.phone)}</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition ${pathname === "/profile" ? "bg-primary text-primary-foreground" : "bg-surface text-text hover:bg-surface-muted"}`}
                  >
                    <User className="h-3.5 w-3.5" /> Profile
                  </Link>
                  <Link
                    href="/orders"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition ${pathname === "/orders" ? "bg-primary text-primary-foreground" : "bg-surface text-text hover:bg-surface-muted"}`}
                  >
                    <Package className="h-3.5 w-3.5" /> Orders
                  </Link>
                </div>
              </div>
            ) : (
              <div className="m-4 flex gap-2">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex flex-1 items-center justify-center rounded-xl border border-border-strong bg-surface py-2.5 text-sm font-semibold text-text transition hover:bg-surface-muted"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex flex-1 items-center justify-center rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_20px_rgba(255,79,134,0.3)] transition hover:bg-primary-hover"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* ── Navigation ── */}
            <nav className="space-y-0.5 px-3 pb-2">
              {/* Home */}
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${pathname === "/" ? "bg-primary-soft text-primary" : "text-text hover:bg-surface-muted"}`}
              >
                <Home className={`h-4 w-4 shrink-0 ${pathname === "/" ? "text-primary" : "text-muted"}`} />
                Home
              </Link>

              {/* Journey accordion */}
              <div>
                <button
                  type="button"
                  onClick={() => setIsMobileJourneyOpen((v) => !v)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isJourneyActive ? "bg-primary-soft text-primary" : "text-text hover:bg-surface-muted"}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" className={`h-4 w-4 shrink-0 ${isJourneyActive ? "text-primary" : "text-muted"}`} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12h18M3 6h18M3 18h18" />
                  </svg>
                  <span className="flex-1 text-left">Journey</span>
                  <ChevronRight className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${isMobileJourneyOpen ? "rotate-90" : ""}`} />
                </button>
                {/* Smooth accordion */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isMobileJourneyOpen ? "max-h-120 opacity-100" : "max-h-0 opacity-0"}`}>
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-primary/20 pl-3 pb-1">
                    {steps.map((step) => (
                      <Link
                        key={step.step_id}
                        href={`/journey/${step.slug}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block rounded-lg px-2.5 py-2 text-sm transition ${pathname === `/journey/${step.slug}` ? "font-semibold text-primary" : "text-muted hover:text-text"}`}
                      >
                        {step.title}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Shopping */}
              <Link
                href="/shopping"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isShoppingActive ? "bg-primary-soft text-primary" : "text-text hover:bg-surface-muted"}`}
              >
                <ShoppingBag className={`h-4 w-4 shrink-0 ${isShoppingActive ? "text-primary" : "text-muted"}`} />
                Shopping
              </Link>

              {/* How it works */}
              <Link
                href="/how-it-works"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${pathname === "/how-it-works" ? "bg-primary-soft text-primary" : "text-text hover:bg-surface-muted"}`}
              >
                <HelpCircle className={`h-4 w-4 shrink-0 ${pathname === "/how-it-works" ? "text-primary" : "text-muted"}`} />
                How it works
              </Link>

              {/* Track Order */}
              <Link
                href="/orders/track-order"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${pathname === "/orders/track-order" ? "bg-primary-soft text-primary" : "text-text hover:bg-surface-muted"}`}
              >
                <Truck className={`h-4 w-4 shrink-0 ${pathname === "/orders/track-order" ? "text-primary" : "text-muted"}`} />
                Track Order
              </Link>
            </nav>

            {/* ── Cart section ── */}
            <div className="mx-4 mb-4 rounded-2xl border border-border bg-surface-muted/50 p-3.5">
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-subtle">Your Carts</p>
              <div className="flex gap-2">
                <Link
                  href="/cart?tab=quotation"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 transition hover:border-[#d4720a]/40 hover:bg-[#d4720a]/5"
                >
                  <Receipt className="h-4 w-4 shrink-0" style={{ color: QUOTE_COLOR }} strokeWidth={2} />
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted">Quote</p>
                    <p className="text-sm font-bold text-text" style={{ color: quotationCount > 0 ? QUOTE_COLOR : undefined }}>{quotationCount}</p>
                  </div>
                </Link>
                <Link
                  href="/cart?tab=shopping"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 transition hover:border-primary/40 hover:bg-primary/5"
                >
                  <ShoppingCart className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted">Shop</p>
                    <p className={`text-sm font-bold ${shoppingCount > 0 ? "text-primary" : "text-text"}`}>{shoppingCount}</p>
                  </div>
                </Link>
              </div>
            </div>

          </div>

          {/* ── Footer actions ── */}
          {user ? (
            <div className="shrink-0 border-t border-border px-4 py-3 space-y-1">
              <button
                type="button"
                onClick={async () => {
                  setIsMobileMenuOpen(false);
                  const ok = window.confirm("Restart your wedding journey?\n\nWe'll wipe your engagement / date / venue / guests / budget answers and walk you through the wizard again. Your account, orders and saved addresses stay.");
                  if (!ok) return;
                  const token = getAuthToken();
                  if (!token) { router.push("/login"); return; }
                  try {
                    await restartMyJourney(token);
                    toast.success("Journey reset — let's set it up again.");
                    router.push("/signup/engaged");
                  } catch (e) {
                    toast.error(e?.message || "Couldn't reset your journey.");
                  }
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-surface-muted hover:text-text"
              >
                <RefreshCw className="h-4 w-4 shrink-0" />
                Restart my journey
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setLogoutModalPathname(pathname);
                  setShowLogoutModal(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-danger transition hover:bg-danger/10"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Logout
              </button>
            </div>
          ) : null}

        </div>
      </div>
      <div className="h-22 sm:h-16" aria-hidden="true" />
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
