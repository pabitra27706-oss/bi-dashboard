"use client";
import React from "react";

export default function LoadingState() {
  return (
    <div className="space-y-6">
      {/* KPI skeletons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-700/50 animate-pulse" />
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-6">
        <div className="h-5 w-52 bg-slate-200 dark:bg-slate-700 rounded-lg mb-6 animate-pulse" />
        <div className="h-80 bg-slate-100 dark:bg-slate-700/30 rounded-xl flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-900 rounded-full" />
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold text-center">
              🧠 AI is analyzing your query...
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-1">
              Generating SQL, fetching data, building charts
            </p>
          </div>
        </div>
      </div>

      {/* Insight skeleton */}
      <div className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-700/30 animate-pulse" />
    </div>
  );
}