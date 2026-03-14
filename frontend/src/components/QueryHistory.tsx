"use client";
import React from "react";
import type { HistoryItem } from "@/types";

const CHART_ICONS: Record<string, string> = {
  bar: "📊", grouped_bar: "📊", stacked_bar: "📊",
  line: "📈", area: "📈", pie: "🥧", donut: "🍩", scatter: "🔵",
};

interface Props {
  history: HistoryItem[];
  onSelect: (h: HistoryItem) => void;
  onClear: () => void;
  onClose: () => void;
}

export default function QueryHistory({ history, onSelect, onClear, onClose }: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-lg">🕐</span>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
            History
          </span>
          <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full px-2 py-0.5 font-bold">
            {history.length}
          </span>
        </div>
        <div className="flex gap-1">
          {history.length > 0 && (
            <button onClick={onClear} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-xs transition" title="Clear all">
              🗑️
            </button>
          )}
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg lg:hidden text-xs transition">
            ✕
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {history.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-3xl mb-3">💬</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              No queries yet.
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              Ask a question to get started!
            </p>
          </div>
        ) : (
          history.map((h) => {
            const icon = CHART_ICONS[h.chartType] || "📊";
            return (
              <button
                key={h.id}
                onClick={() => onSelect(h)}
                className="w-full text-left p-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors group"
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-sm flex-shrink-0 mt-0.5">{icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 line-clamp-2 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                      {h.query}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(h.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}