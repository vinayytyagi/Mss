"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import CartItemsClient from "@/components/CartItemsClient";
import CartActionsClient from "@/components/CartActionsClient";
import { useAuthUser } from "@/lib/authCookies";

export default function CartPageExperienceClient() {
  const router = useRouter();
  const user = useAuthUser();
  // Auth check runs after mount to avoid an SSR-vs-hydration mismatch.
  // While we don't know yet, render a placeholder; if the cookie is
  // absent we redirect to /login with a redirect= back here so the
  // customer lands on the cart again post-login/signup.
  const [authChecked, setAuthChecked] = useState(false);
  useEffect(() => {
    setAuthChecked(true);
  }, []);
  useEffect(() => {
    if (!authChecked) return;
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent("/cart")}`);
    }
  }, [authChecked, user, router]);

  const [activeCart, setActiveCart] = useState("shopping");

  if (!authChecked || !user) {
    return (
      <div className="mt-12 flex items-center justify-center gap-3 text-muted">
        <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
        <span className="text-sm">Loading your basket…</span>
      </div>
    );
  }

  return (
    <section className="mt-6">
      <section className="grid gap-7 xl:grid-cols-[1.18fr_0.82fr]">
        <div className="xl:sticky xl:top-24 xl:self-start">
          <div className="mb-5 inline-flex rounded-2xl border border-border bg-surface-muted p-1.5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
            <button
              type="button"
              onClick={() => setActiveCart("quotation")}
              className={`h-10 rounded-xl px-5 text-sm font-semibold transition ${
                activeCart === "quotation"
                  ? "bg-surface text-primary shadow-[0_4px_12px_rgba(15,23,42,0.08)]"
                  : "text-muted hover:text-text"
              }`}
            >
              Quotation Cart
            </button>
            <button
              type="button"
              onClick={() => setActiveCart("shopping")}
              className={`h-10 rounded-xl px-5 text-sm font-semibold transition ${
                activeCart === "shopping"
                  ? "bg-surface text-primary shadow-[0_4px_12px_rgba(15,23,42,0.08)]"
                  : "text-muted hover:text-text"
              }`}
            >
              Shopping Cart
            </button>
          </div>
          <CartItemsClient activeCart={activeCart} />
        </div>
        <div className="xl:self-start">
          <CartActionsClient activeCart={activeCart} />
        </div>
      </section>
    </section>
  );
}
