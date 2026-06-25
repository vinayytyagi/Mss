import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import React from "react";

export default function WeddingJourney() {
  const milestones = [
    "Engagement Confirmed",
    "Wedding Date Finalized",
    "Select Wedding Destination",
    "Plan Wedding Decor & Theme",
    "Photography & Videography",
    "Makeup & Bridal Styling",
    "Send Wedding Invitations",
    "Plan Wedding Functions",
    "Honeymoon Planning",
    "Pre-Wedding Shoots",
  ];

  return (
    <section className="flex flex-col items-center justify-center px-4 pt-20 pb-10 -mx-4 bg-primary-soft sm:-mx-6 lg:-mx-8 sm:px-6 lg:px-8">
      {/* Headings */}
      <div className="mb-16 text-center">
        <p className="text-[#C68752] font-semibold tracking-[0.15em] uppercase text-sm mb-3">
          Your Path
        </p>
        <h2 className="mb-4 text-4xl font-extrabold sm:text-5xl text-muted">
          Your{" "}
          <span className="font-normal tracking-wide text-primary-hover">
            Wedding
          Journey
          </span>{" "}
        </h2>
        <p className="text-lg font-medium text-muted">
          Plan your dream wedding step-by-step with ease.
        </p>
      </div>

      {/* Mobile timeline */}
      <div className="w-full max-w-xl mx-auto mb-10 md:hidden">
        <div className="p-4 space-y-3 shadow-sm rounded-xl bg-surface/70">
          {milestones.map((item, index) => (
            <div key={item} className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {index + 1}
              </span>
              <p className="text-sm font-medium text-muted">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop timeline */}
      <div className="relative justify-center hidden w-full max-w-4xl mb-10 md:flex">
        {/* Main Vertical Center Line */}
        <div className="absolute top-0 bottom-16 left-1/2 -translate-x-1/2 w-0.5 bg-linear-to-b from-primary-accent via-primary-accent to-transparent z-0" />

        <div className="relative z-10 flex flex-col w-full gap-10 lg:gap-14">
          {/* Node 1 */}
          <div className="flex items-center w-full">
            <div className="flex-1 pr-6 text-right sm:pr-12 md:pr-16 lg:pr-24">
              <span className="text-base font-medium text-muted sm:text-lg">
                Engagement Confirmed
              </span>
            </div>

            {/* The Node */}
            <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
              <div className="absolute inset-0 scale-125 rounded-full bg-primary opacity-30" />
              <div className="relative z-10 flex items-center justify-center rounded-full shadow-md w-7 h-7 bg-primary">
                <svg
                  className="w-4 h-4 text-primary-foreground"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            <div className="flex-1 pl-6 sm:pl-12 md:pl-16 lg:pl-24">
              <span className="text-base font-medium text-muted sm:text-lg">
                Wedding Date Finalized
              </span>
            </div>
          </div>

          {/* Node 2 */}
          <div className="flex items-center w-full">
            <div className="flex-1 pr-6 text-right sm:pr-12 md:pr-16 lg:pr-24">
              <span className="text-base font-medium text-muted sm:text-lg">
                Select Wedding Destination
              </span>
            </div>

            <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
              <div className="absolute inset-0 bg-[#f4ebd9] opacity-70 rounded-full scale-125" />
              <div className="w-7 h-7 bg-surface border-[3px] border-[#e8c18f] rounded-full relative z-10 shadow-sm" />
            </div>

            <div className="flex-1 pl-6 sm:pl-12 md:pl-16 lg:pl-24">
              <span className="text-base font-medium text-muted sm:text-lg">
                Plan Wedding Decor & Theme
              </span>
            </div>
          </div>

          {/* Node 3 */}
          <div className="flex items-center w-full max-w-full">
            <div className="flex-1 pr-6 text-right sm:pr-12 md:pr-16 lg:pr-24">
              <span className="text-base font-medium text-muted sm:text-lg">
                Photography & Videography
              </span>
            </div>

            {/* The Node */}
            <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
              <div className="relative z-10 w-6 h-6 border-4 rounded-full bg-primary-soft border-primary-soft" />
            </div>

            <div className="flex-1 pl-6 sm:pl-12 md:pl-16 lg:pl-24">
              <span className="text-base font-medium text-muted sm:text-lg">
                Makeup & Bridal Styling
              </span>
            </div>
          </div>

          {/* Node 4 */}
          <div className="flex items-center w-full">
            <div className="flex-1 pr-6 text-right sm:pr-12 md:pr-16 lg:pr-24">
              <span className="text-base font-medium text-muted sm:text-lg">
                Send Wedding Invitations
              </span>
            </div>

            {/* The Node */}
            <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
              <div className="relative z-10 w-6 h-6 border-4 rounded-full bg-primary-soft border-primary-soft" />
            </div>

            <div className="flex-1 pl-6 sm:pl-12 md:pl-16 lg:pl-24">
              <span className="text-base font-medium text-muted sm:text-lg">
                Plan Wedding Functions
              </span>
            </div>
          </div>

          {/* Node 5 */}
          <div className="flex items-center w-full">
            <div className="flex-1 pr-6 text-right sm:pr-12 md:pr-16 lg:pr-24">
              <span className="text-base font-medium text-muted sm:text-lg">
                Honeymoon Planning
              </span>
            </div>

            {/* The Node */}
            <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
              <div className="relative z-10 w-6 h-6 border-4 rounded-full bg-primary-soft border-primary-soft" />
            </div>

            <div className="flex-1 pl-6 sm:pl-12 md:pl-16 lg:pl-24">
              <span className="text-base font-medium text-muted sm:text-lg">
                Pre-Wedding Shoots
              </span>
            </div>
          </div>

          {/* Node 6 (last empty circle) */}
          <div className="flex items-center w-full">
            <div className="flex-1 pr-6 text-right sm:pr-12 md:pr-16 lg:pr-24"></div>

            {/* The Node */}
            <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
              <div className="relative z-10 w-6 h-6 border-4 rounded-full bg-primary-soft border-primary-soft" />
            </div>

            <div className="flex-1 pl-6 sm:pl-12 md:pl-16 lg:pl-24"></div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <Link
        href="/login"
        className="px-6 py-3 bg-linear-to-r from-primary-hover to-primary-accent text-primary-foreground rounded-full font-medium text-sm shadow-[0_20px_40px_rgba(255,79,134,0.35)] hover:shadow-[0_25px_50px_rgba(255,79,134,0.45)] hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-3 sm:px-8 sm:py-4 sm:text-base lg:px-10 lg:py-5 lg:text-lg"
      >
        <Sparkles className="w-4 h-4 sm:h-5 sm:w-5 text-primary-foreground" />
        <span className="text-primary-foreground">Start Planning Your Wedding</span>
        <ArrowRight className="w-4 h-4 sm:h-6 sm:w-6 text-primary-foreground" />
      </Link>
    </section>
  );
}
