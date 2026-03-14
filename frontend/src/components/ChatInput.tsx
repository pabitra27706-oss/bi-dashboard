"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";
import type { Suggestion } from "@/types";

interface Props {
  onSubmit: (q: string) => void;
  loading: boolean;
  suggestions: Suggestion[];
  followUps: string[];
}

export default function ChatInput({
  onSubmit,
  loading,
  suggestions,
  followUps,
}: Props) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const submit = () => {
    const q = value.trim();
    if (!q || loading) return;
    onSubmit(q);
    setValue("");
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const chips =
    followUps.length > 0
      ? followUps
      : suggestions.slice(0, 3).map((s) => s.query);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Suggestion / follow-up chips */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {chips.map((c, i) => (
            <button
              key={i}
              onClick={() => {
                setValue(c);
                onSubmit(c);
              }}
              className="px-3 py-1.5 text-xs rounded-full border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-colors truncate max-w-[280px]"
            >
              <Sparkles className="inline w-3 h-3 mr-1 -mt-0.5" />
              {c.length > 55 ? c.slice(0, 52) + "…" : c}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="flex items-end gap-2 p-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 focus-within:ring-2 focus-within:ring-indigo-500/40 transition-shadow">
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          placeholder="Ask anything about your data…"
          className="flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
        />
        <button
          onClick={submit}
          disabled={loading || !value.trim()}
          className="flex-shrink-0 p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white disabled:text-slate-500 transition-colors"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}