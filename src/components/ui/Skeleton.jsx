"use client";

// Shared loading-skeleton primitives for the order / service-order redesign.
// Tiny, dependency-free, presentational. Every page's first-paint loading state
// is built from these so shimmer, rounding and spacing match across all pages.
//
// Tokens only: skeleton blocks use bg-surface-muted, the same inset color used
// for muted insets elsewhere, so they read as "this card is loading".

// Base block — an animate-pulse, rounded, muted rectangle.
// Default rounding is rounded-lg; pass your own rounded-* in className to override
// (e.g. "rounded-full" for avatars, "rounded-xl" for card-sized blocks).
export function Skeleton({ className = "" }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-lg bg-surface-muted ${className}`} />;
}

// A single text-line skeleton. Height defaults to a body-line; width is yours.
export function SkeletonText({ className = "" }) {
  return <Skeleton className={`h-3.5 ${className}`} />;
}

// A circular skeleton — avatars, status dots, icon tiles.
export function SkeletonCircle({ className = "" }) {
  return <Skeleton className={`rounded-full ${className}`} />;
}

export default Skeleton;
