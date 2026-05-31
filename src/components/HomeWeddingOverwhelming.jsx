import Image from "next/image";

const serif = "font-[family-name:var(--font-playfair),ui-serif,Georgia,serif]";

export default function HomeWeddingOverwhelming() {
  return (
    <section
      id="wedding-overwhelming"
      className="relative scroll-mt-24 overflow-hidden py-14 sm:py-16 lg:py-20"
      style={{
        background:
          "linear-gradient(180deg, #fff8fb 0%, #fef2f6 45%, #fff5f9 100%), radial-gradient(ellipse 90% 60% at 50% 0%, rgba(255, 200, 220, 0.35) 0%, transparent 55%)",
      }}
      aria-labelledby="wedding-overwhelming-heading"
    >
      <div className="px-4 sm:px-6 lg:px-8 pointer-events-none absolute inset-0 opacity-40" aria-hidden>
        <div className="absolute -left-10 top-1/4 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -right-8 bottom-1/4 h-48 w-48 rounded-full bg-primary-soft/60 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <h2
          id="wedding-overwhelming-heading"
          className={`${serif} px-4 sm:px-6 lg:px-8 text-center text-balance text-2xl font-semibold leading-snug tracking-tight sm:text-3xl md:text-4xl`}
        >
          <span className="text-text-strong">Wedding Planning is </span>
          <span className="font-semibold text-primary-hover">Overwhelming</span>
          <span className="ml-2 inline-block align-middle sm:ml-2.5">
            <Image
              src="/happy-girl.webp"
              alt=""
              width={80}
              height={80}
              className="inline-block h-11 w-11 object-contain align-middle sm:h-11 sm:w-11 md:h-20 md:w-20"
            />
          </span>
        </h2>
        <p className="mx-auto px-4 sm:px-6 lg:px-8 mt-3 max-w-xl text-center text-sm leading-relaxed text-muted sm:text-base">
          Venues, guests, décor, outfits — it can feel like pressure from every direction. You are not alone.
        </p>

        <div className="relative sm:px-6 lg:px-8 mx-auto mt-5 sm:mt-4 w-full pl-6 sm:pl-24">
          <div className="relative aspect-video w-full">
            <div className="absolute inset-0 z-0 flex items-center justify-center">
              <div className="relative aspect-square w-full">
                <Image
                  src="/overwhelming-middle.webp"
                  alt="Illustration of a bride feeling stressed by many wedding planning tasks"
                  fill
                  sizes=""
                  className="object-contain object-center drop-shadow-[0_8px_24px_rgba(212,91,123,0.15)]"
                />
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 z-10" aria-hidden>
              <Image
                src="/overwhelming-around.webp"
                alt=""
                fill
                sizes=""
                className="object-fill w-full h-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
