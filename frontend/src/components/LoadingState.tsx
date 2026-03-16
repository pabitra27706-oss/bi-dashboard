"use client";
import React, { useState, useEffect } from "react";

const STEPS = [
  "Understanding your question",
  "Generating SQL query",
  "Executing database query",
  "Building visualizations",
];

export default function LoadingState() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1200),
      setTimeout(() => setStep(2), 3000),
      setTimeout(() => setStep(3), 5500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="space-y-6">
      {/* KPI skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-lg bg-slate-100 dark:bg-slate-800/60 animate-pulse"
          />
        ))}
      </div>

      {/* Chart skeleton with step progress */}
      <div className="rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-6">
        <div className="h-5 w-48 bg-slate-100 dark:bg-slate-700 rounded mb-6 animate-pulse" />

        <div className="h-72 bg-slate-50 dark:bg-slate-700/20 rounded-lg flex flex-col items-center justify-center gap-8">
          {/* Spinner */}
          <div className="relative">
            <div className="w-12 h-12 border-[3px] border-slate-200 dark:border-slate-700 rounded-full" />
            <div className="absolute inset-0 w-12 h-12 border-[3px] border-transparent border-t-indigo-500 rounded-full animate-spin" />
          </div>

          {/* Steps */}
          <div className="w-full max-w-sm space-y-1">
            {STEPS.map((text, i) => {
              const isDone = i < step;
              const isActive = i === step;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-2 rounded-md transition-all duration-500 ${
                    isActive
                      ? "bg-indigo-50 dark:bg-indigo-900/30"
                      : isDone
                        ? "opacity-50"
                        : "opacity-25"
                  }`}
                >
                  {/* Step indicator */}
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-semibold ${
                      isDone
                        ? "bg-indigo-500 text-white"
                        : isActive
                          ? "border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                          : "border border-slate-300 dark:border-slate-600 text-slate-400"
                    }`}
                  >
                    {isDone ? (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isActive
                        ? "text-indigo-700 dark:text-indigo-300"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {text}
                  </span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Insight skeleton */}
      <div className="h-28 rounded-lg bg-slate-100 dark:bg-slate-800/40 animate-pulse" />
    </div>
  );
}