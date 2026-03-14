"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import ThemeProvider, { useTheme } from "./ThemeProvider";
import ChatInput from "./ChatInput";
import ChartRenderer from "./ChartRenderer";
import KPICards from "./KPICards";
import InsightBox from "./InsightBox";
import QueryHistory from "./QueryHistory";
import LoadingState from "./LoadingState";
import DataTable from "./DataTable";
import ExportButtons from "./ExportButtons";
import CSVUpload from "./CSVUpload";
import { sendQuery, fetchSuggestions, fetchSchema } from "@/services/api";
import type { QueryResponse, HistoryItem, Suggestion, SchemaInfo } from "@/types";

function DashboardInner() {
  const { theme, toggle } = useTheme();
  const darkMode = theme === "dark";

  const [results, setResults] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showTable, setShowTable] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [schema, setSchema] = useState<SchemaInfo | null>(null);
  const [conversationCtx, setConversationCtx] = useState<{ query: string; sql: string; insight: string }[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSuggestions().then(setSuggestions).catch(console.error);
    fetchSchema().then(setSchema).catch(console.error);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bi-history");
      if (saved) setHistory(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("bi-history", JSON.stringify(history.slice(0, 50)));
  }, [history]);

  const handleSubmit = useCallback(async (query: string) => {
    setLoading(true);
    setResults(null);
    setShowTable(false);
    setErrorMsg(null);
    try {
      const resp = await sendQuery(query, conversationCtx);
      setResults(resp);
      if (resp.success) {
        const item: HistoryItem = {
          id: Date.now().toString(),
          query,
          sql: resp.sql,
          insight: resp.insight,
          timestamp: new Date(),
          chartType: resp.chart_config?.chart_type || "bar",
        };
        setHistory((prev) => [item, ...prev]);
        setConversationCtx((prev) => [...prev.slice(-4), { query, sql: resp.sql, insight: resp.insight }]);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Request failed";
      setErrorMsg(msg);
      setResults({
        success: false, query, sql: "", data: [], chart_config: null,
        additional_charts: [], insight: "", kpis: [], follow_up_questions: [],
        execution_time: 0, error: msg,
      });
    } finally {
      setLoading(false);
    }
  }, [conversationCtx]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      {sidebarOpen && (
        <aside className="w-[280px] flex-shrink-0 border-r border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/60 overflow-hidden transition-all duration-300">
          <QueryHistory
            history={history}
            onSelect={(h) => handleSubmit(h.query)}
            onClear={() => { setHistory([]); localStorage.removeItem("bi-history"); }}
            onClose={() => setSidebarOpen(false)}
          />
        </aside>
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-lg">
              {sidebarOpen ? "◀" : "▶"}
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <span className="text-white text-xl">📊</span>
              </div>
              <div>
                <h1 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">
                  InsightAI
                </h1>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  {schema ? `${schema.row_count.toLocaleString()} rows · ${schema.tables.length} table(s) · AI-Powered` : "AI-Powered Analytics"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CSVUpload onUploadDone={() => fetchSchema().then(setSchema)} />
            <button onClick={toggle} className="p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-lg border border-slate-200 dark:border-slate-700">
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {/* Welcome */}
          {!results && !loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 flex items-center justify-center mb-8 shadow-2xl shadow-indigo-500/30 text-5xl">
                📊
              </div>
              <h2 className="text-4xl font-extrabold text-slate-800 dark:text-white mb-3 tracking-tight">
                What would you like to explore?
              </h2>
              <p className="text-base text-slate-500 dark:text-slate-400 max-w-xl mb-12 leading-relaxed">
                Ask questions in plain English about your YouTube data.
                I'll generate SQL, create interactive charts, and surface executive-level insights — all in seconds.
              </p>

              {/* Stats bar */}
              {schema && (
                <div className="flex items-center gap-6 mb-10 text-sm">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium">
                    <span>📁</span> {schema.row_count.toLocaleString()} records
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 font-medium">
                    <span>📋</span> {schema.tables.length} table(s)
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium">
                    <span>🤖</span> Gemini AI
                  </div>
                </div>
              )}

              {/* Suggestion cards */}
              <div className="grid sm:grid-cols-3 gap-5 max-w-4xl w-full">
                {suggestions.slice(0, 3).map((s, i) => (
                  <button key={i} onClick={() => handleSubmit(s.query)} className="text-left p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 group">
                    <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-4 ${s.difficulty === "Simple" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" : s.difficulty === "Medium" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400"}`}>
                      {s.difficulty}
                    </span>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                      {s.query}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-3">
                      {s.description}
                    </p>
                  </button>
                ))}
              </div>

              {/* More suggestions */}
              {suggestions.length > 3 && (
                <div className="mt-6 flex flex-wrap gap-2 max-w-3xl justify-center">
                  {suggestions.slice(3).map((s, i) => (
                    <button key={i} onClick={() => handleSubmit(s.query)} className="px-4 py-2 text-xs rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-400 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all">
                      {s.query}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Loading */}
          {loading && <LoadingState />}

          {/* Error */}
          {results && !results.success && (
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="text-sm font-semibold text-rose-700 dark:text-rose-400 mb-1">Something went wrong</p>
                  <p className="text-xs text-rose-600 dark:text-rose-400/80 leading-relaxed">{results.error}</p>
                  <button onClick={() => handleSubmit(results.query)} className="mt-3 text-xs font-medium text-rose-700 dark:text-rose-400 hover:underline">
                    🔄 Retry this query
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success */}
          {results && results.success && (
            <div className="space-y-6">
              {/* Query label */}
              <div className="flex items-center gap-2">
                <span className="text-sm">💬</span>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 italic">
                  &quot;{results.query}&quot;
                </p>
              </div>

              {/* KPIs */}
              <KPICards kpis={results.kpis} />

              {/* Main chart */}
              {results.chart_config && results.data.length > 0 && (
                <div className="rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-6 pt-5 pb-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-800 dark:text-white">
                        {results.chart_config.title || "Results"}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {results.data.length} data points · {results.chart_config.chart_type} chart · {results.execution_time}s
                      </p>
                    </div>
                    <ExportButtons chartRef={chartRef} data={results.data} title={results.chart_config.title || "chart"} />
                  </div>
                  <div ref={chartRef} className="px-4 pb-4">
                    <ChartRenderer data={results.data} config={results.chart_config} darkMode={darkMode} />
                  </div>
                </div>
              )}

              {/* Additional charts */}
              {results.additional_charts.length > 0 && (
                <div className="grid md:grid-cols-2 gap-4">
                  {results.additional_charts.map((ac, i) => (
                    <div key={i} className="rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-5">
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">{ac.title}</h4>
                      <ChartRenderer data={results.data} config={ac} darkMode={darkMode} />
                    </div>
                  ))}
                </div>
              )}

              {/* AI Insight */}
              <InsightBox insight={results.insight} sql={results.sql} executionTime={results.execution_time} />

              {/* Data table */}
              <DataTable data={results.data} visible={showTable} onToggle={() => setShowTable(!showTable)} />
            </div>
          )}
        </div>

        {/* Chat input — fixed bottom */}
        <div className="border-t border-slate-200 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl px-6 py-4">
          <ChatInput onSubmit={handleSubmit} loading={loading} suggestions={suggestions} followUps={results?.follow_up_questions || []} />
        </div>
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ThemeProvider>
      <DashboardInner />
    </ThemeProvider>
  );
}