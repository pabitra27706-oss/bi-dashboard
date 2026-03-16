"use client";
import React from "react";
import type { KPI } from "@/types";

const ACCENT = [
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
  "#10B981",
  "#F59E0B",
  "#06B6D4",
];

export default function KPICards({ kpis }: { kpis: KPI[] }) {
  if (!kpis.length) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map((kpi, i) => {
        const trendColor =
          kpi.trend_direction === "up"
            ? "text-emerald-600 dark:text-emerald-400"
            : kpi.trend_direction === "down"
              ? "text-rose-600 dark:text-rose-400"
              : "text-slate-400";

        return (
          <div
            key={i}
            className="relative overflow-hidden rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-4 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
          >
            {/* Accent bar */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
              style={{ background: ACCENT[i % ACCENT.length] }}
            />

            <div className="ml-3">
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                {kpi.label}
              </p>
              <p className="text-xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
                {kpi.value}
              </p>
              {kpi.trend && (
                <p className={`text-xs font-medium mt-1 flex items-center gap-1 ${trendColor}`}>
                  {kpi.trend_direction === "up" ? (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                    </svg>
                  ) : kpi.trend_direction === "down" ? (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25" />
                    </svg>
                  ) : null}
                  {kpi.trend}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}