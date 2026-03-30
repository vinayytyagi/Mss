"use client";

function formatAmount(value) {
  const amount = Number(value || 0);
  if (!amount) return "—";
  if (amount >= 100000) {
    return `${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1)}L`;
  }
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount);
}

export default function BudgetBadge({ effectiveCap, defaultBudget = 0, noLimit = false }) {
  if (noLimit) {
    return <>All prices</>;
  }
  if (effectiveCap === 0) {
    return <>Free only</>;
  }
  if (effectiveCap != null && Number(effectiveCap) > 0) {
    return <>{formatAmount(effectiveCap)}</>;
  }
  return <>{formatAmount(defaultBudget)}</>;
}
