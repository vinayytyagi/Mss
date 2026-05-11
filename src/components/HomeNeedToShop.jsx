import Image from "next/image";
import Link from "next/link";

const serif = "font-[family-name:var(--font-playfair),ui-serif,Georgia,serif]";

export default function HomeNeedToShop({ ctaHref = "/#wedding-showcase" }) {
  return (
    <section
      className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-20"
      style={{
        background:
          "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(120, 60, 140, 0.35) 0%, transparent 55%), linear-gradient(180deg, #0f0614 0%, #1a0d22 45%, #0d060f 100%)",
      }}
      aria-labelledby="need-to-shop-heading"
    >
      {/* Bokeh / sparkles */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute left-[8%] top-[18%] h-40 w-40 rounded-full bg-amber-400/15 blur-lg" />
        <div className="absolute right-[12%] top-[22%] h-48 w-48 rounded-full bg-yellow-200/10 blur-lg" />
        <div className="absolute bottom-[20%] left-[20%] h-32 w-56 rounded-full bg-rose-300/10 blur-lg" />
        <div className="absolute bottom-[28%] right-[18%] h-36 w-36 rounded-full bg-amber-200/12 blur-lg" />
        <div className="absolute left-[40%] top-[40%] h-2 w-2 rounded-full bg-white/90 shadow-[0_0_14px_4px_rgba(255,255,255,0.5)]" />
        <div className="absolute left-[62%] top-[28%] h-1.5 w-1.5 rounded-full bg-amber-100/90 shadow-[0_0_12px_3px_rgba(253,230,138,0.55)]" />
        <div className="absolute left-[25%] top-[55%] h-1 w-1 rounded-full bg-white/80 shadow-[0_0_10px_2px_rgba(255,255,255,0.45)]" />
        <div className="absolute right-[30%] top-[48%] h-1.5 w-1.5 rounded-full bg-white/70 shadow-[0_0_12px_3px_rgba(255,255,255,0.4)]" />
        <div className="absolute right-[42%] bottom-[35%] h-1 w-1 rounded-full bg-amber-200/80 shadow-[0_0_10px_2px_rgba(253,230,138,0.4)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <h2
          id="need-to-shop-heading"
          className={`${serif} text-balance text-2xl font-semibold leading-tight tracking-tight text-[#f5e6d3] sm:text-3xl md:text-4xl lg:text-[2.35rem]`}
        >
          Everything You Need for Your Wedding
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-pretty text-[15px] leading-relaxed text-white/85 sm:text-base">
          Discover the best outfits, jewelry, décor, and more — all in one place with MyShaadiStore.
        </p>

        <div className="relative mx-auto mt-10 max-w-5xl sm:mt-4">
          <div
            className="pointer-events-none absolute inset-[-8%] rounded-full opacity-70 blur-2xl"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.22) 0%, rgba(120, 53, 15, 0.08) 45%, transparent 70%)",
            }}
            aria-hidden
          />
          <div className="relative mx-auto w-full max-w-3xl">
            <Image
              src="/Need-to-shop.png"
              alt="Wedding shopping hub: bridal wear, jewelry, décor, gifts, honeymoon, groom attire, and photography around Your Wedding"
              width={1200}
              height={900}
              sizes="(min-width: 1024px) 48rem, 100vw"
              className="h-auto w-full rounded-2xl object-contain sm:rounded-3xl"
              priority
            />
          </div>
        </div>

        <div className="mt-10 flex justify-center sm:mt-12">
          <Link
            href={ctaHref}
            className="home-need-to-shop-cta inline-flex items-center gap-2 rounded-full bg-linear-to-r from-[#ff6ba8] via-[#ff4f86] to-[#e91e90] px-8 py-3.5 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(233,30,144,0.45)] transition hover:brightness-[1.06] sm:px-10 sm:py-4 sm:text-base lg:px-12 lg:text-lg"
          >
            Start Shopping Now
            <span className="text-lg font-light leading-none sm:text-xl" aria-hidden>
              ›
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
