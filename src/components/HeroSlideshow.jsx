"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";

const DEFAULT_ALT = "Hero";

const DEFAULT_INDICATOR_COLORS = ["#FFC107", "#4C6FFF", "#FF4F86"];

function isHexColor(value) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(String(value || "").trim());
}

function normalizeIndicatorColors(input) {
  return [0, 1, 2].map((i) => {
    const c = Array.isArray(input) ? String(input[i] || "").trim() : "";
    return isHexColor(c) ? c : DEFAULT_INDICATOR_COLORS[i];
  });
}

function normalizeSlides(slides) {
  if (!Array.isArray(slides)) return [];
  return slides
    .map((s) => ({
      image_url: String(s?.image_url || "").trim(),
      alt: String(s?.alt || "").trim() || DEFAULT_ALT,
    }))
    .filter((s) => s.image_url);
}

function stackZIndex(i, activeIdx, len) {
  if (len <= 1) return i === activeIdx ? 2 : 0;
  const prevIdx = (activeIdx - 1 + len) % len;
  if (i === activeIdx) return 3;
  if (i === prevIdx) return 2;
  return 0;
}

function subscribeReducedMotion(callback) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Hollow rings: inactive same size; active larger. Colors cycle A,B,C from admin. */
function SlideshowCornerDots({ colors, count, activeIdx, onSelect }) {
  if (count < 1) return null;

  return (
    <div
      className="pointer-events-auto absolute bottom-[10%] right-0 z-[100] flex items-center gap-3 sm:bottom-[5%] sm:gap-4 lg:right-[10%]"
      role="tablist"
      aria-label="Hero slides"
    >
      {Array.from({ length: count }, (_, i) => {
        const active = i === activeIdx;
        const color = colors[i % 3];
        return (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={`Slide ${i + 1} of ${count}`}
            onClick={() => onSelect(i)}
            className="flex cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span
              className={`box-border shrink-0 rounded-full bg-transparent transition-all duration-300 ${
                active
                  ? "h-8 w-8 border-4 shadow-md sm:h-9 sm:w-9"
                  : "h-3.5 w-3.5 border-2 sm:h-4 sm:w-4"
              }`}
              style={{
                borderColor: color,
                borderStyle: "solid",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}

export default function HeroSlideshow({
  slides: slidesProp = [],
  intervalSeconds = 5,
  transitionMs = 900,
  autoplay = true,
  className = "",
  sizes = "(max-width: 1024px) 100vw, 55vw",
  maskStyle,
  onSlideChange,
  indicatorColors: indicatorColorsProp,
}) {
  const list = normalizeSlides(slidesProp);
  const n = list.length;

  const ringColors = useMemo(
    () => normalizeIndicatorColors(indicatorColorsProp),
    [indicatorColorsProp],
  );

  const [idx, setIdx] = useState(0);
  const reduceMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    () => false,
  );

  const intervalMs = Math.max(2000, Math.min(120000, (Number(intervalSeconds) || 5) * 1000));
  const duration = reduceMotion ? 0 : Math.min(3000, Math.max(200, Number(transitionMs) || 900));
  const shouldAutoplay = autoplay !== false && !reduceMotion && n > 1;

  useEffect(() => {
    if (!shouldAutoplay) return undefined;
    const id = window.setInterval(() => {
      setIdx((i) => (i + 1) % n);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [n, intervalMs, shouldAutoplay]);

  const goTo = useCallback(
    (i) => {
      if (i >= 0 && i < n) setIdx(i);
    },
    [n],
  );

  const activeIdx = n === 0 ? 0 : ((idx % n) + n) % n;

  useEffect(() => {
    onSlideChange?.(activeIdx, n);
  }, [activeIdx, n, onSlideChange]);

  if (n === 0) {
    return (
      <div
        className={`relative flex items-center justify-center bg-linear-to-br from-rose-50/95 via-[#fdf2f6] to-slate-100/90 ${className}`}
        style={maskStyle}
        aria-hidden
      />
    );
  }

  return (
    <div className={`relative isolate ${className}`}>
      {/* Mask only the image stack — mask on parent was fading the dots too */}
      <div className="absolute inset-0 overflow-hidden" style={maskStyle}>
        {list.map((slide, i) => (
          <div
            key={`${slide.image_url}-${i}`}
            className="absolute inset-0"
            style={{
              opacity: i === activeIdx ? 1 : 0,
              zIndex: stackZIndex(i, activeIdx, n),
              transition: duration ? `opacity ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)` : "none",
              pointerEvents: "none",
            }}
          >
            <Image
              src={slide.image_url}
              alt={slide.alt}
              fill
              className="object-cover object-top"
              sizes={sizes}
              priority={i === 0}
              unoptimized
            />
          </div>
        ))}
      </div>

      <SlideshowCornerDots colors={ringColors} count={n} activeIdx={activeIdx} onSelect={goTo} />
    </div>
  );
}
