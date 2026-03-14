"use client";
import React from "react";
import type { KPI } from "@/types";

const ACCENT = ["#6366F1", "#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#06B6D4"];
const ICONS: Record<string, string> = {
  "bar-chart": "📊", eye: "👁️", heart: "❤️", "message-circle": "💬",
  share: "🔗", star: "⭐", globe: "🌍", clock: "⏱️", zap: "⚡",
  users: "👥", play: "▶️", "trending-up": "📈",
};

export default function KPICards({ kpis }: { kpis: KPI[] }) {
  if (!kpis.length) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, i) => {
        const trendColor =
          kpi.trend_direction === "up"
            ? "text-emerald-500"
            : kpi.trend_direction === "down"
            ? "text-rose-500"
            : "text-slate-400";
        const trendIcon = kpi.trend_direction === "up" ? "📈" : kpi.trend_direction === "down" ? "📉" : "";
        const icon = ICONS[kpi.icon] || "📊";

        return (
          <div
            key={i}
            className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-5 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
          >
            <div
              className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl"
              style={{ background: ACCENT[i % ACCENT.length] }}
            />
            <div className="flex items-start justify-between ml-3">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {kpi.label}
                </p>
                <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                  {kpi.value}
                </p>
                {kpi.trend && (
                  <p className={`text-xs font-semibold mt-1.5 ${trendColor}`}>
                    {trendIcon} {kpi.trend}
                  </p>
                )}
              </div>
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700/50 text-xl">
                {icon}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}