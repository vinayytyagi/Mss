import CartHeaderStatsClient from "@/components/CartHeaderStatsClient";
import CartPageExperienceClient from "@/components/CartPageExperienceClient";
import { Suspense } from "react";

export default function CartPageServer() {
  return (
    <main className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-[#efe7eb] bg-[linear-gradient(135deg,#ffffff_0%,#f9f7f8_48%,#ffffff_100%)] px-5 py-6 shadow-[0_14px_34px_rgba(15,23,42,0.04)] sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex rounded-full bg-[#f7f2f5] px-3 py-1.5 text-[11px] font-medium text-[#8b4d66]">
              Cart
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-800 sm:text-3xl">
              Quotation and Shopping Carts
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
              Journey items and shopping products can be added to the quotation basket. Shopping
              products that you want to purchase immediately go into the shopping cart.
            </p>
          </div>

          <CartHeaderStatsClient />
        </div>
      </section>

      <Suspense fallback={null}>
        <CartPageExperienceClient />
      </Suspense>
    </main>
  );
}

