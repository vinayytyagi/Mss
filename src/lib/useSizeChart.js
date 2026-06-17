"use client";

/**
 * useSizeChart — client hook for the admin-managed size-chart tables.
 *
 * Fetches `/api/v1/size-chart` once per page load (the underlying promise is
 * cached in module scope) and shares it across consumers. SSR-safe: returns a
 * sensible default while the fetch is in flight so nothing flashes/breaks.
 *
 * Shape: `{ sizeChart }` where sizeChart is `{ heading, intro, tables }` and
 * each table is `{ title, note, columns: string[], rows: string[][] }`.
 */

import { useEffect, useState } from "react";
import { fetchSizeChart } from "@/lib/api/siteSettingsApi";

// Safe default used during SSR and while the fetch is in flight.
export const DEFAULT_SIZE_CHART = {
  heading: "Size Chart",
  intro: "",
  tables: [],
};

function normalizeChart(raw) {
  const data = raw || {};
  const tables = Array.isArray(data.tables)
    ? data.tables
        .map((t) => {
          const columns = Array.isArray(t?.columns) ? t.columns.map(String) : [];
          const rows = Array.isArray(t?.rows)
            ? t.rows.map((r) => (Array.isArray(r) ? r.map(String) : []))
            : [];
          return {
            title: String(t?.title || ""),
            note: String(t?.note || ""),
            columns,
            rows,
          };
        })
        .filter((t) => t.columns.length > 0)
    : [];
  return {
    heading: String(data.heading || DEFAULT_SIZE_CHART.heading),
    intro: String(data.intro || ""),
    tables,
  };
}

// Module-scoped cache: one in-flight promise, reused across all consumers.
let cachedPromise = null;

function loadSizeChart() {
  if (!cachedPromise) {
    cachedPromise = fetchSizeChart()
      .then((raw) => normalizeChart(raw))
      .catch(() => {
        // Drop the cache so a later mount can retry, but resolve to defaults
        // for the current consumers so the UI stays graceful.
        cachedPromise = null;
        return { ...DEFAULT_SIZE_CHART };
      });
  }
  return cachedPromise;
}

export default function useSizeChart() {
  const [sizeChart, setSizeChart] = useState(DEFAULT_SIZE_CHART);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadSizeChart().then((chart) => {
      if (!cancelled) {
        setSizeChart(chart);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { sizeChart, loading };
}
