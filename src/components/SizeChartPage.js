"use client";

import { Ruler } from "lucide-react";
import useSizeChart from "@/lib/useSizeChart";

export default function SizeChartPage() {
  const { sizeChart, loading } = useSizeChart();
  const { heading, intro, tables } = sizeChart;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <header className="mb-10 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Ruler className="h-6 w-6" aria-hidden />
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-text-strong sm:text-4xl">
          {heading || "Size Chart"}
        </h1>
        {intro ? (
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted">{intro}</p>
        ) : null}
      </header>

      {loading ? (
        <p className="text-center text-sm text-muted">Loading size chart…</p>
      ) : tables.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-10 text-center">
          <p className="text-sm text-muted">Size charts will be available here soon.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {tables.map((table, ti) => (
            <section key={ti}>
              {table.title ? (
                <h2 className="mb-1 text-lg font-semibold text-text-strong">{table.title}</h2>
              ) : null}
              {table.note ? (
                <p className="mb-3 text-sm leading-relaxed text-muted">{table.note}</p>
              ) : null}

              <div className="scrollbar-themed overflow-x-auto rounded-lg border border-border">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-surface-muted">
                      {table.columns.map((col, ci) => (
                        <th
                          key={ci}
                          scope="col"
                          className="whitespace-nowrap px-4 py-3 text-left font-semibold text-text-strong"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row, ri) => (
                      <tr
                        key={ri}
                        className="border-t border-border odd:bg-surface even:bg-surface-muted/40 transition-colors hover:bg-primary-soft/60"
                      >
                        {table.columns.map((_, ci) => (
                          <td key={ci} className="whitespace-nowrap px-4 py-3 text-text">
                            {row[ci] || ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
