import Link from "next/link";
import CartPageExperienceClient from "@/components/CartPageExperienceClient";
import { Suspense } from "react";

export default function CartPageServer() {
  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-medium text-subtle">
        <Link href="/" className="transition hover:text-primary">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-muted">Cart</span>
      </nav>

      <div className="mt-3 flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-text-strong sm:text-3xl">
          Your Carts
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted">
          Send wedding-journey items for a tailored quotation, or check out shopping products
          instantly with secure Razorpay payment.
        </p>
      </div>

      <Suspense fallback={null}>
        <CartPageExperienceClient />
      </Suspense>
    </main>
  );
}
