"use client";
import React, { useState } from "react";

interface Props {
  insight: string;
  sql: string;
  executionTime: number;
}

export default function InsightBox({ insight, sql, executionTime }: Props) {
  const [showSQL, setShowSQL] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!insight) return null;

  const copy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-indigo-950/40 dark:via-slate-800/80 dark:to-violet-950/30 p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/50 dark:to-violet-900/50 flex-shrink-0 text-2xl">
          🧠
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
              AI Insight
            </h3>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold">
              ⚡ {executionTime}s
            </span>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {insight}
          </p>
          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={() => setShowSQL(!showSQL)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
            >
              {showSQL ? "🔽 Hide SQL" : "▶️ Show SQL Query"}
            </button>
          </div>
          {showSQL && (
            <div className="mt-3 relative">
              <pre className="bg-slate-900 text-green-400 rounded-xl p-5 text-xs overflow-x-auto font-mono whitespace-pre-wrap leading-relaxed border border-slate-700">
                {sql}
              </pre>
              <button
                onClick={copy}
                className="absolute top-3 right-3 px-3 py-1.5 text-xs rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition"
              >
                {copied ? "✅ Copied!" : "📋 Copy"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}