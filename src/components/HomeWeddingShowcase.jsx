import Image from "next/image";
import Link from "next/link";
import { Camera, Check, Flower2, Landmark } from "lucide-react";

const serif = "font-[family-name:var(--font-playfair),ui-serif,Georgia,serif]";

const coupleMaskStyle = {
  WebkitMaskImage:
    "linear-gradient(to right, transparent 0%, black 26%), linear-gradient(to bottom, black 0%, black 52%, transparent 100%)",
  maskImage:
    "linear-gradient(to right, transparent 0%, black 26%), linear-gradient(to bottom, black 0%, black 52%, transparent 100%)",
  WebkitMaskComposite: "source-in",
  maskComposite: "intersect",
};

const cards = [
  {
    title: "Wedding Venues",
    points: [
      "Explore top wedding venues",
      "Compare prices & availability",
      "Find the perfect location for your big day",
    ],
    Icon: Landmark,
    iconWrap: "bg-amber-100/95 text-[#c27803]",
  },
  {
    title: "Décor & Styling",
    points: [
      "Wedding themes & stage décor",
      "Floral setups & mandap design",
      "Customized décor ideas",
    ],
    Icon: Flower2,
    iconWrap: "bg-amber-100/95 text-[#c27803]",
  },
  {
    title: "Wedding Services",
    points: [
      "Photography & videography",
      "Bridal makeup & styling",
      "Catering, invitations & more",
    ],
    Icon: Camera,
    iconWrap: "bg-pink-100/95 text-[#ff4f86]",
  },
];

export default function HomeWeddingShowcase({ journeyHref = "/how-it-works" }) {
  return (
    <section className="relative overflow-hidden bg-[#fff0f5] px-4 pb-28 pt-14 sm:px-6 lg:px-8">
      {/* Bottom bokeh + soft sparkles */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[min(48vh,340px)]" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_100%,rgba(255,255,255,0.98)_0%,rgba(255,240,245,0.55)_38%,transparent_70%)]" />
        <div className="absolute bottom-8 left-[8%] h-32 w-32 rounded-full bg-white/50 blur-3xl" />
        <div className="absolute bottom-12 left-[28%] h-28 w-40 rounded-full bg-amber-100/50 blur-3xl" />
        <div className="absolute bottom-6 right-[22%] h-36 w-36 rounded-full bg-white/45 blur-3xl" />
        <div className="absolute bottom-16 right-[8%] h-24 w-32 rounded-full bg-rose-200/40 blur-3xl" />
        <div className="absolute bottom-20 left-[18%] h-1.5 w-1.5 rounded-full bg-white/90 shadow-[0_0_12px_3px_rgba(255,255,255,0.85)]" />
        <div className="absolute bottom-32 left-[42%] h-1 w-1 rounded-full bg-white/80 shadow-[0_0_10px_2px_rgba(255,255,255,0.75)]" />
        <div className="absolute bottom-24 left-[55%] h-1.5 w-1.5 rounded-full bg-rose-100 shadow-[0_0_14px_4px_rgba(255,200,220,0.6)]" />
        <div className="absolute bottom-36 right-[35%] h-1 w-1 rounded-full bg-white/90 shadow-[0_0_10px_2px_rgba(255,255,255,0.8)]" />
        <div className="absolute bottom-28 right-[48%] h-1.5 w-1.5 rounded-full bg-white/70 shadow-[0_0_12px_3px_rgba(255,255,255,0.65)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <p
          className={`text-center text-3xl font-semibold tracking-tight text-[#2d2d44] sm:text-[2.35rem] ${serif}`}
        >
          MyShaadiStore
        </p>
        <h2
          className={`mx-auto mt-4 max-w-4xl text-center text-2xl font-semibold leading-snug tracking-tight text-[#2d2d44] sm:text-3xl md:text-[2.125rem] md:leading-tight ${serif}`}
        >
          Shop Everything for Your Dream Wedding —{" "}
          <span className="font-semibold text-[#ff4f86]">All in One Place</span>
        </h2>

        <div className="mx-auto mt-5 max-w-3xl space-y-1 text-center text-[15px] leading-relaxed text-[#5c5c74] sm:text-base">
          <p>
            Discover everything you need for your wedding — outfits, décor, venues, photography, makeup
            and more.
          </p>
          <p>
            Choose individual services or shop complete wedding essentials with MyShaadiStore.
          </p>
        </div>

        <div className="relative mt-12 lg:mt-16">
          <div className="grid gap-5 lg:grid-cols-3 lg:gap-6 lg:pr-[min(340px,30vw)]">
            {cards.map((card) => (
              <article
                key={card.title}
                className="relative z-10 rounded-[1.5rem] bg-white p-6 shadow-[0_10px_40px_rgba(45,45,68,0.07),0_2px_12px_rgba(45,45,68,0.04)] sm:p-7"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${card.iconWrap}`}
                  >
                    <card.Icon className="h-6 w-6 stroke-[1.6]" aria-hidden />
                  </span>
                  <h3 className={`text-lg font-semibold tracking-tight text-[#2d2d44] ${serif}`}>
                    {card.title}
                  </h3>
                </div>
                <ul className="mt-5 space-y-2.5">
                  {card.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-2.5 text-[15px] leading-snug text-[#4a4a62]"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ffe4ef] text-[#ff4f86]">
                        <Check className="h-3 w-3 stroke-[2.5]" strokeLinecap="round" />
                      </span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="pointer-events-none absolute -right-4 top-1/2 z-20 hidden h-[min(520px,52vw)] w-[min(380px,34vw)] -translate-y-1/2 lg:block xl:-right-6 xl:h-[min(560px,50vw)] xl:w-[min(420px,32vw)]">
            <div className="relative h-full w-full" style={coupleMaskStyle}>
              <Image
                src="https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&w=1000&q=80"
                alt="Couple in wedding attire"
                fill
                sizes="(min-width: 1280px) 420px, 380px"
                className="object-cover object-[center_22%]"
              />
            </div>
          </div>
        </div>

        <div className="relative z-20 mt-14 flex justify-center lg:mt-16">
          <Link
            href={journeyHref}
            className="showcase-journey-cta inline-flex items-center gap-2 rounded-full bg-linear-to-r from-[#ff6ba8] via-[#ff4f86] to-[#e91e90] px-10 py-3.5 text-base font-semibold text-white shadow-[0_14px_34px_rgba(233,30,144,0.35)] transition hover:brightness-[1.05] sm:px-14 sm:py-4 sm:text-lg"
          >
            Begin Your Wedding Journey
            <span className="text-xl font-light leading-none sm:text-2xl" aria-hidden>
              ›
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
