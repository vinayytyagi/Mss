import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import React from "react";

export default function WeddingJourney() {
  return (
    <section className="pt-20 pb-10 bg-[#fdeaee] flex flex-col items-center justify-center -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
      {/* Headings */}
      <div className="text-center mb-16">
        <p className="text-[#C68752] font-semibold tracking-[0.15em] uppercase text-sm mb-3">
          Your Path
        </p>
        <h2 className="text-4xl sm:text-5xl font-serif font-extrabold text-[#696666] mb-4">
          Your{" "}
          <span className="text-[#d45b7b] font-serif font-normal tracking-wide">
            Wedding
          Journey
          </span>{" "}
        </h2>
        <p className="text-[#848ea6] text-lg font-medium">
          Plan your dream wedding step-by-step with ease.
        </p>
      </div>

      {/* Timeline */}
      <div className="relative w-full max-w-4xl flex justify-center mb-10">
        {/* Main Vertical Center Line */}
        <div className="absolute top-0 bottom-16 left-1/2 -translate-x-1/2 w-0.5 bg-linear-to-b from-[#ff8fb1] via-[#ffafc7] to-transparent z-0" />

        <div className="w-full relative z-10 flex flex-col gap-10 lg:gap-14">
          {/* Node 1 */}
          <div className="flex items-center w-full">
            <div className="flex-1 text-right pr-6 sm:pr-12 md:pr-16 lg:pr-24">
              <span className="text-[#6c7693] font-medium text-base sm:text-lg">
                Engagement Confirmed
              </span>
            </div>

            {/* The Node */}
            <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
              <div className="absolute inset-0 bg-[#ff4f86] opacity-30 rounded-full scale-125" />
              <div className="w-7 h-7 bg-[#ff4f86] rounded-full flex items-center justify-center shadow-md relative z-10">
                <svg
                  className="w-4 h-4 text-white"
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
              <span className="text-[#6c7693] font-medium text-base sm:text-lg">
                Wedding Date Finalized
              </span>
            </div>
          </div>

          {/* Node 2 */}
          <div className="flex items-center w-full">
            <div className="flex-1 text-right pr-6 sm:pr-12 md:pr-16 lg:pr-24">
              <span className="text-[#6c7693] font-medium text-base sm:text-lg">
                Select Wedding Destination
              </span>
            </div>

            <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
              <div className="absolute inset-0 bg-[#f4ebd9] opacity-70 rounded-full scale-125" />
              <div className="w-7 h-7 bg-white border-[3px] border-[#e8c18f] rounded-full relative z-10 shadow-sm" />
            </div>

            <div className="flex-1 pl-6 sm:pl-12 md:pl-16 lg:pl-24">
              <span className="text-[#6c7693] font-medium text-base sm:text-lg">
                Plan Wedding Decor & Theme
              </span>
            </div>
          </div>

          {/* Node 3 */}
          <div className="flex items-center w-full max-w-full">
            <div className="flex-1 text-right pr-6 sm:pr-12 md:pr-16 lg:pr-24">
              <span className="text-[#6c7693] font-medium text-base sm:text-lg">
                Photography & Videography
              </span>
            </div>

            {/* The Node */}
            <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
              <div className="w-6 h-6 bg-[#fff1f6] border-4 border-[#ffd6e4] rounded-full relative z-10" />
            </div>

            <div className="flex-1 pl-6 sm:pl-12 md:pl-16 lg:pl-24">
              <span className="text-[#6c7693] font-medium text-base sm:text-lg">
                Makeup & Bridal Styling
              </span>
            </div>
          </div>

          {/* Node 4 */}
          <div className="flex items-center w-full">
            <div className="flex-1 text-right pr-6 sm:pr-12 md:pr-16 lg:pr-24">
              <span className="text-[#6c7693] font-medium text-base sm:text-lg">
                Send Wedding Invitations
              </span>
            </div>

            {/* The Node */}
            <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
              <div className="w-6 h-6 bg-[#fff1f6] border-4 border-[#ffd6e4] rounded-full relative z-10" />
            </div>

            <div className="flex-1 pl-6 sm:pl-12 md:pl-16 lg:pl-24">
              <span className="text-[#6c7693] font-medium text-base sm:text-lg">
                Plan Wedding Functions
              </span>
            </div>
          </div>

          {/* Node 5 */}
          <div className="flex items-center w-full">
            <div className="flex-1 text-right pr-6 sm:pr-12 md:pr-16 lg:pr-24">
              <span className="text-[#6c7693] font-medium text-base sm:text-lg">
                Honeymoon Planning
              </span>
            </div>

            {/* The Node */}
            <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
              <div className="w-6 h-6 bg-[#fff1f6] border-4 border-[#ffd6e4] rounded-full relative z-10" />
            </div>

            <div className="flex-1 pl-6 sm:pl-12 md:pl-16 lg:pl-24">
              <span className="text-[#6c7693] font-medium text-base sm:text-lg">
                Pre-Wedding Shoots
              </span>
            </div>
          </div>

          {/* Node 6 (last empty circle) */}
          <div className="flex items-center w-full">
            <div className="flex-1 text-right pr-6 sm:pr-12 md:pr-16 lg:pr-24"></div>

            {/* The Node */}
            <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
              <div className="w-6 h-6 bg-[#fff1f6] border-4 border-[#ffd6e4] rounded-full relative z-10" />
            </div>

            <div className="flex-1 pl-6 sm:pl-12 md:pl-16 lg:pl-24"></div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <Link
        href="/journey"
        className="px-10 py-5 bg-linear-to-r from-[#e7477b] to-[#fb6c98] text-white rounded-full font-medium text-lg shadow-[0_20px_40px_rgba(255,79,134,0.35)] hover:shadow-[0_25px_50px_rgba(255,79,134,0.45)] hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4"
      >
        <Sparkles className="h-6 w-6 text-white" />
        <span className="text-white">Start Planning Your Wedding</span>
        <ArrowRight className="h-6 w-6 text-white" />
      </Link>
    </section>
  );
}
