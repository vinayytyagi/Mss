/**
 * VerifiedBadge — display-only trust mark shown next to the seller name
 * on product cards / product detail / vendor profile.
 *
 * NOT KYC. Controlled by the admin-toggled `is_verified` flag on the
 * vendor doc. KYC is its own independent system on the vendor record.
 */

const SIZE_CLASS = {
  xs: "h-3.5 w-3.5",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export default function VerifiedBadge({
  size = "sm",
  className = "",
  title = "Verified Seller",
}) {
  const cls = SIZE_CLASS[size] || SIZE_CLASS.sm;

  return (
    <span
      title={title}
      aria-label={title}
      role="img"
      className={`inline-flex shrink-0 items-center justify-center align-middle ${cls} ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden="true">
        {/* Scalloped rosette — same silhouette used by Twitter/X for
            their verified tick, recoloured in MyShaadiStore pink. */}
        <path
          fill="#E91E63"
          d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"
        />
        {/* Crisp white check mark. */}
        <path
          fill="#FFFFFF"
          d="M9.71 16.27 5.93 12.49l1.41-1.41 2.37 2.36 6.95-6.95 1.41 1.42z"
        />
      </svg>
    </span>
  );
}
