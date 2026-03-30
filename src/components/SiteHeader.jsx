"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearAuthCookies, useAuthUser } from "@/lib/authCookies";
import BasketButton from "@/components/BasketButton";
import { clearAllCarts } from "@/lib/cartStore";
import LogoutConfirmModal from "@/components/LogoutConfirmModal";
import { User, Package, Truck, LogOut, Menu, X } from "lucide-react";
import { toast } from "sonner";

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M12 20.25s-6.75-4.35-9-8.25C1.1 8.8 2.9 5.25 6.75 5.25c2.05 0 3.24 1.1 4.02 2.2.5.7 1.46.7 1.96 0 .78-1.1 1.97-2.2 4.02-2.2 3.85 0 5.65 3.55 3.75 6.75-2.25 3.9-9 8.25-9 8.25Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
    "relative pb-0.5 text-slate-600 transition-colors duration-200 hover:text-slate-900 after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[1.5px] after:w-full after:origin-left after:scale-x-0 after:bg-[#ff4f86] after:transition-transform after:duration-200 hover:after:scale-x-100";
  const activeNavLinkClass =
    "relative pb-0.5 text-slate-800 transition-colors duration-200 after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-full after:origin-left after:scale-x-100 after:bg-[#ff4f86] after:transition-transform after:duration-200 hover:text-slate-900 hover:after:scale-x-100";

  function handleLogout() {
    setShowLogoutModal(false);
    setLogoutModalPathname(null);
    clearAuthCookies();
    clearAllCarts();
    toast.success("Logged out successfully.");
    router.replace("/");
    router.refresh();
  }

  if (pathname === "/login" || pathname === "/signup") {
    return null;
  }

  const logoutModalOpen = showLogoutModal && logoutModalPathname === pathname;

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/70 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-20">
        <Link href="/" className="flex cursor-pointer items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff4f86] text-white">
            <HeartIcon />
          </span>
          <span className="text-2xl font-semibold tracking-tight text-slate-700">MyShaadiStore</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 lg:flex">
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

            <div className="pointer-events-none absolute left-1/2 top-full w-[360px] -translate-x-1/2 rounded-3xl border border-slate-100 bg-white p-4 opacity-0 shadow-[0_25px_80px_rgba(16,24,40,0.12)] transition duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
              <p className="mb-3 text-xs font-medium text-slate-400">
                Journey Steps
              </p>
              <div className="grid gap-2">
                {steps.map((step, index) => (
                  <Link
                    key={step.step_id}
                    href={`/journey/${step.slug}`}
                    className={`flex cursor-pointer items-center justify-between rounded-2xl px-4 py-3 transition ${
                      pathname === `/journey/${step.slug}`
                        ? "bg-[#fff1f6] text-[#ff4f86]"
                        : "hover:bg-pink-100"
                    }`}
                  >
                    <span
                      className={`text-sm font-semibold ${
                        pathname === `/journey/${step.slug}` ? "text-[#ff4f86]" : "text-slate-700"
                      }`}
                    >
                      {step.title}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        pathname === `/journey/${step.slug}` ? "text-[#ff77a1]" : "text-slate-400"
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
            href={shoppingStep ? `/journey/${shoppingStep.slug}` : "/shopping"}
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
            href="/orders/track"
            className={pathname === "/orders/track" ? activeNavLinkClass : navLinkClass}
          >
            Track Order
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <BasketButton />
          </div>
          {user ? (
            <div className="group relative">
              <button className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-[#ff4f86] hover:text-[#ff4f86]">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-linear-to-br from-[#ff4f86] to-[#ff8fb1] text-xs font-semibold text-white">
                  {(user.name || "U").charAt(0).toUpperCase()}
                </span>
                {user.name ? user.name.split(" ")[0] : `+91 ${normalizePhone(user.phone) || ""}`}
                <ChevronDown />
              </button>
              <div className="pointer-events-none absolute right-0 top-full w-56 rounded-2xl border border-slate-100 bg-white p-2 opacity-0 shadow-[0_25px_80px_rgba(16,24,40,0.12)] transition duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
                <Link href="/profile" className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${pathname === '/profile' ? 'bg-[#fff1f6] text-[#ff4f86]' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <User className="h-4 w-4" />
                  My Profile
                </Link>
                <Link href="/orders" className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${pathname === '/orders' ? 'bg-[#fff1f6] text-[#ff4f86]' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <Package className="h-4 w-4" />
                  My Orders
                </Link>
                <Link href="/orders/track" className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${pathname === '/orders/track' ? 'bg-[#fff1f6] text-[#ff4f86]' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <Truck className="h-4 w-4" />
                  Track Order
                </Link>
                <div className="my-1 border-t border-slate-100" />
                <button
                  onClick={() => {
                    setLogoutModalPathname(pathname);
                    setShowLogoutModal(true);
                  }}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-50"
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
                className="cursor-pointer rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="signup-header-cta cursor-pointer rounded-2xl bg-[#ff4f86] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(255,79,134,0.28)] transition hover:bg-[#ff3d79] hover:text-white"
              >
                Sign up
              </Link>
            </>
          )}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 lg:hidden"
            aria-label="Open navigation menu"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-60 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/45"
            aria-label="Close menu backdrop"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-[88%] max-w-sm bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-lg font-semibold text-slate-800">Menu</span>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700"
                aria-label="Close navigation menu"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-1 border-t border-slate-100 pt-3 text-[15px] font-medium text-slate-700">
              <Link href="/" className="block rounded-lg px-3 py-2 hover:bg-slate-50" onClick={() => setIsMobileMenuOpen(false)}>
                Home
              </Link>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-slate-50"
                onClick={() => setIsMobileJourneyOpen((value) => !value)}
              >
                Journey
                <ChevronDown />
              </button>
              {isMobileJourneyOpen ? (
                <div className="mx-2 mb-2 space-y-1 rounded-xl bg-slate-50 p-2">
                  {steps.map((step) => (
                    <Link
                      key={step.step_id}
                      href={`/journey/${step.slug}`}
                      className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-white"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {step.title}
                    </Link>
                  ))}
                </div>
              ) : null}
              <Link
                href={shoppingStep ? `/journey/${shoppingStep.slug}` : "/shopping"}
                className="block rounded-lg px-3 py-2 hover:bg-slate-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Shopping
              </Link>
              <Link href="/how-it-works" className="block rounded-lg px-3 py-2 hover:bg-slate-50" onClick={() => setIsMobileMenuOpen(false)}>
                How it works
              </Link>
              <Link href="/orders/track" className="block rounded-lg px-3 py-2 hover:bg-slate-50" onClick={() => setIsMobileMenuOpen(false)}>
                Track Order
              </Link>
              <div className="border-t border-slate-100 pt-3">
                <BasketButton />
              </div>
            </div>
          </div>
        </div>
      ) : null}
      </header>
      <div className="h-[88px] sm:h-[92px]" aria-hidden="true" />
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
