"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import HeroSlideshow from "@/components/HeroSlideshow";

export default function HeroSection({ heroSlideshow = null }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shopping?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="relative mx-auto w-full h-[100vh] overflow-x-hidden px-4 pb-8 pt-2 sm:px-20 sm:pt-6">
      {/* Pink vertical strip on the far left edge */}
      <div className="absolute left-0 top-[10%] z-0 h-[100px] w-2.5 rounded-r-2xl bg-[#ff4f86] sm:h-[120px] sm:w-3.5 xl:h-[135px] xl:w-4" />

      {/* Top right striped circle decoration — clipped so it never causes horizontal scroll */}
      <div className="pointer-events-none absolute -right-[20%] top-[-120px] z-0 h-[240px] w-[240px] overflow-hidden opacity-35 sm:-right-[8%] sm:top-[-80px] sm:h-[280px] sm:w-[280px] -lg:right-10 lg:top-[-160px] lg:h-[360px] lg:w-[360px]">
        <svg viewBox="0 0 100 100" className="w-full h-full text-[#ff4e83]">
          <pattern
            id="diagonalHatch"
            width="5"
            height="3"
            patternTransform="rotate(45 0 0)"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="3"
              stroke="currentColor"
              strokeWidth="3"
            />
          </pattern>
          <circle cx="50" cy="50" r="50" fill="url(#diagonalHatch)" />
        </svg>
      </div>

      <div className="relative z-10 mt-0 flex w-full max-w-full flex-col items-center gap-8 lg:mt-12 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
        {/* Left Content */}
        <div className="w-full max-w-xl flex-1 pt-2 lg:max-w-xl lg:pl-4 lg:pt-4 xl:max-w-2xl xl:pl-6">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#49516f] tracking-tight leading-[1.05]">
            <span className="text-[#65738E] font-medium flex items-center gap-3 mb-3 text-[1.8rem] sm:text-[2.5rem] lg:text-[2.8rem]">
              When your
              <span className="text-[#ff4f86] flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-8 h-8 sm:w-10 sm:h-10 mt-1 drop-shadow-md"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </span>
            </span>
            Dream Wedding come true
          </h1>

          <p className="mt-8 text-[1.05rem] sm:text-[1.15rem] text-slate-500 max-w-[420px] leading-[1.7] font-normal italic">
            &quot; Once in a while, right in the middle of an ordinary life,
            love gives us a fairy tale. &quot;
          </p>

          {/* Search Box */}
          <form
            onSubmit={handleSearch}
            className="mt-6 flex items-center bg-white rounded-2xl shadow-[0_20px_50px_rgba(16,24,40,0.06)] w-full max-w-[550px] p-2 transition-shadow focus-within:shadow-[0_25px_60px_rgba(255,79,134,0.12)]"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find Photographer, Catering, etc"
              className="flex-1 bg-transparent px-5 py-4 outline-none text-slate-700 placeholder:text-slate-400 font-normal text-[1.05rem]"
            />
            {/* <div className="p-2 text-[#ff4f86] opacity-70 hidden sm:flex items-center justify-center border-l border-slate-100 ml-2 pl-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div> */}
            <button
              type="submit"
              className="bg-[#ff4f86] text-white p-4.5 rounded-[14px] hover:bg-[#ff3d79] transition-all active:translate-y-0 ml-2 cursor-pointer flex items-center justify-center w-14 h-14"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
            </button>
          </form>

          {/* 4 Cards Grid */}
          <div className="mt-6 grid grid-cols-2 gap-2">
            {/* Card 1 */}
            <Link
              href="/shopping?category=honeymoon"
              className="flex items-center gap-5 p-4 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-center w-14 h-14 bg-white rounded-[18px] text-[#ff4f86] group-hover:bg-[#ff4f86] group-hover:text-white transition-colors duration-300">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.2"
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  ></path>
                </svg>
              </div>
              <span className="font-semibold text-[#3b435b] text-[1.1rem]">
                Honeymoon
              </span>
            </Link>
            {/* Card 2 */}
            <Link
              href="/shopping?category=catering"
              className="flex items-center gap-5 p-4 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-center w-14 h-14 bg-white rounded-[18px] text-[#ff4f86] group-hover:bg-[#ff4f86] group-hover:text-white transition-colors duration-300">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.2"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  ></path>
                </svg>
              </div>
              <span className="font-semibold text-[#3b435b] text-[1.1rem]">
                Catering
              </span>
            </Link>
            {/* Card 3 */}
            <Link
              href="/shopping?category=decor"
              className="flex items-center gap-5 p-4 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-center w-14 h-14 bg-white rounded-[18px] text-[#ff4f86] group-hover:bg-[#ff4f86] group-hover:text-white transition-colors duration-300">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.2"
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
              <span className="font-semibold text-[#3b435b] text-[1.1rem]">
                Decor
              </span>
            </Link>
            {/* Card 4 */}
            <Link
              href="/shopping?category=venues"
              className="flex items-center gap-5 p-4 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-center w-14 h-14 bg-white rounded-[18px] text-[#ff4f86] group-hover:bg-[#ff4f86] group-hover:text-white transition-colors duration-300">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  ></path>
                </svg>
              </div>
              <span className="font-semibold text-[#3b435b] text-[1.1rem]">
                Venues
              </span>
            </Link>
          </div>
        </div>

        {/* Right Content — constrained so hero never overflows viewport */}
        <div className="relative flex w-full max-w-full shrink-0 items-center justify-center lg:w-[42%] lg:max-w-[min(42vw)] lg:justify-end">
          <HeroSlideshow
            slides={heroSlideshow?.slides}
            intervalSeconds={heroSlideshow?.interval_seconds}
            transitionMs={heroSlideshow?.transition_ms}
            autoplay={heroSlideshow?.autoplay}
            indicatorColors={heroSlideshow?.indicator_colors}
            className="aspect-[3/4] max-h-[min(68vh,520px)] w-full max-w-[min(100%,340px)] overflow-hidden sm:max-w-[min(100%,380px)] lg:max-w-full lg:-mt-4 xl:max-h-[min(75vh,520px)]"
            sizes="(max-width: 1024px) 100vw, 55vw"
            maskStyle={{
              maskImage:
                "linear-gradient(to bottom, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%)",
            }}
          />

          {/* {showHeroMedia ? (
            <button
              type="button"
              className="absolute top-[45%] lg:top-[48%] left-1/2 lg:left-[45%] -translate-x-1/2 -translate-y-1/2 w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center shadow-[0_24px_50px_rgba(16,24,40,0.15)] hover:bg-white transition-all group z-20 cursor-pointer"
              aria-label="Play video"
            >
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-[#ff4f86] ml-2 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          ) : null} */}

          {/* Slideshow dots (amber / blue / pink cycle) live inside HeroSlideshow */}
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute bottom-10 left-4 z-20 ml-10 hidden items-center sm:left-10 lg:left-12 xl:flex">
        <div className="flex items-center gap-3">
          <span className="text-slate-800 font-medium text-[0.5rem] tracking-[0.2em] -rotate-90">
            Scroll Down
          </span>
          <div className="w-[30px] h-[48px] border-[3px] border-slate-800/70 rounded-[20px] flex justify-center p-1.5">
            <div className="w-1 h-4 bg-pink-500 rounded-full animate-bounce mt-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
