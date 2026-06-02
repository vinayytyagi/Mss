import { apiFetch } from "./apiClient";

/**
 * Fetch active wedding-budget presets configured by admin.
 * Used by the customer signup wizard "Budget Planner" step.
 */
export async function fetchBudgetPresets() {
  return apiFetch("/budget-presets", { revalidateSeconds: 60 });
}
