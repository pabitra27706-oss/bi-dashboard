"use client";
import React, { useState } from "react";

interface Props {
  insight: string;
  sql: string;
  executionTime: number;
  confidence?: string | null;
  assumptions?: string[];
}

export default function InsightBox({
  insight,
  sql,
  executionTime,
  confidence,
  assumptions,
}: Props) {
  const [showSQL, setShowSQL] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAssumptions, setShowAssumptions] = useState(false);

  if (!insight) return null;

  const isConversational = !sql;

  const copy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confidenceColor =
    confidence === "high"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
      : confidence === "medium"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
        : confidence === "low"
          ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400"
          : "";

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/80 p-5">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex-shrink-0">
          {isConversational ? (
            <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {isConversational ? "InsightAI" : "AI Insight"}
            </h3>
            {executionTime > 0 && !isConversational && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium">
                {executionTime}s
              </span>
            )}
            {confidence && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-medium ${confidenceColor}`}
              >
                {confidence} confidence
              </span>
            )}
          </div>

          {/* Insight text */}
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
            {insight}
          </p>

          {/* Low confidence warning */}
          {confidence === "low" && (
            <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-md px-3 py-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              Low confidence — consider rephrasing your question for better accuracy.
            </div>
          )}

          {/* Assumptions */}
          {assumptions && assumptions.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowAssumptions(!showAssumptions)}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 font-medium flex items-center gap-1 transition-colors"
              >
                <svg
                  className={`w-3 h-3 transition-transform ${showAssumptions ? "rotate-90" : ""}`}
                  fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
                {assumptions.length} assumption{assumptions.length > 1 ? "s" : ""}
              </button>
              {showAssumptions && (
                <ul className="mt-1.5 space-y-1 pl-4">
                  {assumptions.map((a, i) => (
                    <li
                      key={i}
                      className="text-xs text-slate-500 dark:text-slate-400 list-disc"
                    >
                      {a}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* SQL toggle */}
          {sql && (
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => setShowSQL(!showSQL)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d={showSQL ? "M6 9l6 6 6-6" : "M8.25 4.5l7.5 7.5-7.5 7.5"} />
                </svg>
                {showSQL ? "Hide SQL" : "Show SQL"}
              </button>
            </div>
          )}

          {showSQL && sql && (
            <div className="mt-2 relative">
              <pre className="bg-slate-900 text-slate-300 rounded-lg p-4 text-xs overflow-x-auto font-mono whitespace-pre-wrap leading-relaxed border border-slate-700">
                {sql}
              </pre>
              <button
                onClick={copy}
                className="absolute top-2 right-2 px-2.5 py-1 text-[10px] rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium transition-colors flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}