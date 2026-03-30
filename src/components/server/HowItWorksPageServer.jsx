import { CheckCircle2, ClipboardList, Compass, CreditCard, Sparkles } from "lucide-react";

const steps = [
  {
    title: "Start with your journey",
    description:
      "Pick the wedding stage you are currently planning and see the right services and products for that moment.",
    icon: Compass,
  },
  {
    title: "Curate smarter, not harder",
    description:
      "Browse category-wise options, compare details, and add what you need into quotation cart or shopping cart.",
    icon: Sparkles,
  },
  {
    title: "Checkout or request quote",
    description:
      "Use quotation flow for custom pricing and shopping checkout for instant payment with saved addresses.",
    icon: CreditCard,
  },
  {
    title: "Track every update",
    description:
      "Monitor order progress and stay in control from profile, orders, and tracking pages in one place.",
    icon: ClipboardList,
  },
];

const highlights = [
  "Journey-first planning experience",
  "Separate quotation and instant shopping flows",
  "Saved addresses for faster checkout",
  "Real-time order visibility",
];

export default function HowItWorksPageServer() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[34px] border border-[#eee4ea] bg-[linear-gradient(140deg,#ffffff_0%,#faf7f9_55%,#f6f0f4_100%)] p-7 shadow-[0_24px_60px_rgba(15,23,42,0.06)] sm:p-10">
        <p className="inline-flex rounded-full bg-[#f8eef3] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#ff4f86]">
          How it works
        </p>
        <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-slate-800 sm:text-4xl">
          A calm and guided way to plan your wedding, one step at a time.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
          MyShaadiStore combines journey planning, curated shopping, quotation requests, and live order
          tracking so your complete wedding workflow stays clean and organized.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {highlights.map((point) => (
            <div
              key={point}
              className="flex items-center gap-2 rounded-2xl border border-[#f0e6ec] bg-white/90 px-4 py-3 text-sm font-medium text-[#ff4f86]"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {point}
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-4">
          {steps.map((item, index) => (
            <article
              key={item.title}
              className="flex items-start gap-4 rounded-3xl border border-[#efe5eb] bg-white p-5 shadow-[0_10px_26px_rgba(15,23,42,0.03)]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#fff1f6] text-[#ff4f86]">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {String(index + 1).padStart(2, "0")} . {item.title}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

