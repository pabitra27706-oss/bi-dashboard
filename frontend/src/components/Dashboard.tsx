"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import ThemeProvider, { useTheme } from "./ThemeProvider";
import ChatInput from "./ChatInput";
import ChartRenderer from "./ChartRenderer";
import KPICards from "./KPICards";
import InsightBox from "./InsightBox";
import QueryHistory from "./QueryHistory";
import DataTable from "./DataTable";
import ExportButtons from "./ExportButtons";
import CSVUpload from "./CSVUpload";
import DatasetSwitcher from "./DatasetSwitcher";
import ErrorBoundary from "./ErrorBoundary";
import { toPng } from "html-to-image";
import {
  sendQuery,
  fetchSuggestions,
  fetchSchema,
  fetchTables,
  setActiveTable as apiSetActiveTable,
  deleteTable as apiDeleteTable,
} from "@/services/api";
import type {
  QueryResponse,
  Suggestion,
  SchemaInfo,
  TableInfo,
  ChartConfig,
  ChatMessage,
  Conversation,
} from "@/types";

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Dark-mode color tokens (matches globals.css)                          */
/*  bg-primary:   #0a0a0f    surface:       #1a1a25                      */
/*  bg-secondary: #111118    surface-hover: #22222e                      */
/*  bg-tertiary:  #16161f    border:        #2a2a3a                      */
/*  sidebar:      #0e0e15                                                 */
/* ═══════════════════════════════════════════════════════════════════════ */

const ALL_CHART_TYPES = [
  { value: "bar", label: "Bar" },
  { value: "line", label: "Line" },
  { value: "area", label: "Area" },
  { value: "pie", label: "Pie" },
  { value: "donut", label: "Donut" },
  { value: "scatter", label: "Scatter" },
];

function getCompatibleTypes(config: ChartConfig | null): string[] {
  if (!config) return ALL_CHART_TYPES.map((t) => t.value);
  const yCount = config.y_axis?.length || 0;
  const xAxis = config.x_axis || "";
  const isTime = /month|date|year|week/i.test(xAxis);
  const compat = ["bar", "line", "area"];
  if (!isTime && yCount <= 1) compat.push("pie", "donut");
  if (yCount >= 1) compat.push("scatter");
  return [...new Set(compat)];
}

function generateTitle(query: string): string {
  const cleaned = query.replace(/['"]/g, "").trim();
  if (cleaned.length <= 50) return cleaned;
  return cleaned.substring(0, 47) + "...";
}

function createConversation(firstQuery?: string): Conversation {
  const now = new Date().toISOString();
  return {
    id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
    title: firstQuery ? generateTitle(firstQuery) : "New conversation",
    messages: [],
    createdAt: now,
    updatedAt: now,
    isPinned: false,
    isArchived: false,
  };
}

function serializeConversations(convs: Conversation[]): string {
  const trimmed = convs.slice(0, 50).map((c) => ({
    ...c,
    messages: c.messages.map((m) => ({
      ...m,
      response: m.response
        ? { ...m.response, data: m.response.data.slice(0, 50) }
        : undefined,
    })),
  }));
  return JSON.stringify(trimmed);
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  PDF Export                                                            */
/* ═══════════════════════════════════════════════════════════════════════ */
async function doExportPDF(
  resp: QueryResponse,
  chartEl: HTMLElement | null,
  activeTable: string
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const m = 15;
  const cw = pw - 2 * m;
  let y = 0;
  const check = (n: number) => {
    if (y + n > ph - m) { doc.addPage(); y = m; }
  };

  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, pw, 22, "F");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("InsightAI Report", m, 14);
  y = 30;
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`${new Date().toLocaleString()} | ${activeTable}`, m, y);
  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  const qL = doc.splitTextToSize(`"${resp.query}"`, cw);
  doc.text(qL, m, y);
  y += qL.length * 4.5 + 6;

  if (resp.kpis.length) {
    check(20);
    doc.setFontSize(12); doc.setTextColor(99, 102, 241);
    doc.text("Key Metrics", m, y); y += 7;
    resp.kpis.forEach((kpi) => {
      check(8);
      doc.setFontSize(8); doc.setTextColor(120, 120, 120);
      doc.text(kpi.label, m, y);
      doc.setFontSize(12); doc.setTextColor(30, 30, 30);
      doc.text(kpi.value, m + 55, y);
      if (kpi.trend) {
        doc.setFontSize(8);
        const u = kpi.trend_direction === "up";
        doc.setTextColor(u ? 34 : 239, u ? 197 : 68, u ? 94 : 68);
        doc.text(kpi.trend, m + 95, y);
      }
      y += 7;
    });
    y += 4;
  }

  if (chartEl && resp.data.length) {
    check(90);
    doc.setFontSize(12); doc.setTextColor(99, 102, 241);
    doc.text(resp.chart_config?.title || "Chart", m, y); y += 4;
    try {
      const url = await toPng(chartEl, { backgroundColor: "#fff", pixelRatio: 2 });
      const w = cw, h = w * 0.55;
      check(h + 5);
      doc.addImage(url, "PNG", m, y, w, h);
      y += h + 8;
    } catch { /* skip */ }
  }

  if (resp.insight) {
    check(25);
    doc.setFontSize(12); doc.setTextColor(99, 102, 241);
    doc.text("AI Insight", m, y); y += 6;
    doc.setFontSize(9); doc.setTextColor(60, 60, 60);
    const iL = doc.splitTextToSize(resp.insight, cw);
    check(iL.length * 4.5);
    doc.text(iL, m, y); y += iL.length * 4.5 + 6;
  }

  if (resp.sql) {
    check(15);
    doc.setFontSize(12); doc.setTextColor(99, 102, 241);
    doc.text("SQL Query", m, y); y += 6;
    doc.setFontSize(7); doc.setTextColor(80, 80, 80);
    const sL = doc.splitTextToSize(resp.sql, cw);
    check(sL.length * 3.5);
    doc.text(sL, m, y); y += sL.length * 3.5 + 6;
  }

  if (resp.data.length) {
    check(20);
    doc.setFontSize(12); doc.setTextColor(99, 102, 241);
    doc.text(`Data (${resp.data.length} rows)`, m, y); y += 6;
    const cols = Object.keys(resp.data[0]);
    const colW = Math.min(cw / cols.length, 35);
    doc.setFontSize(6); doc.setTextColor(255, 255, 255);
    doc.setFillColor(99, 102, 241);
    doc.rect(m, y - 3, cw, 5, "F");
    cols.forEach((c, i) => doc.text(c.substring(0, 14), m + i * colW + 1, y));
    y += 4;
    doc.setTextColor(60, 60, 60);
    resp.data.slice(0, 20).forEach((row, ri) => {
      check(5);
      if (ri % 2 === 0) { doc.setFillColor(245, 245, 250); doc.rect(m, y - 3, cw, 5, "F"); }
      cols.forEach((c, i) => doc.text(String(row[c] ?? "-").substring(0, 14), m + i * colW + 1, y));
      y += 4;
    });
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7); doc.setTextColor(150, 150, 150);
    doc.text(`InsightAI - Page ${i}/${pages}`, pw / 2, ph - 5, { align: "center" });
  }
  doc.save(`${(resp.chart_config?.title || "report").replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30)}.pdf`);
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Fullscreen Modal                                                      */
/* ═══════════════════════════════════════════════════════════════════════ */
function FullscreenModal({ config, data, darkMode, chartType, onClose }: {
  config: ChartConfig; data: Record<string, unknown>[]; darkMode: boolean; chartType: string; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#1a1a25] rounded-xl w-[95vw] h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-[#2a2a3a] overflow-hidden animate-scaleIn">
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-[#2a2a3a]">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{config.title || "Chart"}</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">{data.length} points &middot; {chartType}</p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButtons chartRef={ref} data={data} title={config.title || "chart"} />
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-[#22222e] text-slate-400 dark:text-slate-500 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div ref={ref} className="flex-1 p-6 overflow-auto bg-white dark:bg-[#111118]">
          <ChartRenderer data={data} config={config} darkMode={darkMode} overrideChartType={chartType} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Chart Type Switcher                                                   */
/* ═══════════════════════════════════════════════════════════════════════ */
function ChartTypeSwitcher({ currentType, compatibleTypes, onChange }: {
  currentType: string; compatibleTypes: string[]; onChange: (t: string) => void;
}) {
  return (
    <div className="flex gap-1 flex-wrap">
      {ALL_CHART_TYPES.filter((t) => compatibleTypes.includes(t.value)).map((t) => (
        <button key={t.value} onClick={() => onChange(t.value)}
          className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-all duration-200 border ${
            currentType === t.value
              ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700 shadow-sm"
              : "bg-white dark:bg-[#1a1a25] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-[#2a2a3a] hover:border-indigo-200 dark:hover:border-indigo-800"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Typing Indicator                                                      */
/* ═══════════════════════════════════════════════════════════════════════ */
function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 animate-fadeIn">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
        </svg>
      </div>
      <div className="bg-white dark:bg-[#1a1a25] border border-slate-200 dark:border-[#2a2a3a] rounded-2xl rounded-tl-none px-5 py-4 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="text-xs text-slate-400 dark:text-slate-500 ml-2">Analyzing...</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Assistant Response Block                                              */
/* ═══════════════════════════════════════════════════════════════════════ */
function AssistantBlock({ message, darkMode, onDrillDown, activeTable, isLatest }: {
  message: ChatMessage; darkMode: boolean; onDrillDown: (q: string) => void; activeTable: string; isLatest: boolean;
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [showTable, setShowTable] = useState(false);
  const [chartType, setChartType] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [fullscreen, setFullscreen] = useState<{ config: ChartConfig; data: Record<string, unknown>[] } | null>(null);
  const [exporting, setExporting] = useState(false);

  const resp = message.response;
  if (!resp) return null;

  const hasData = resp.success && resp.data.length > 0;
  const hasChart = resp.chart_config && hasData;
  const aiType = resp.chart_config?.chart_type || "bar";
  const curType = chartType || aiType;
  const compat = getCompatibleTypes(resp.chart_config || null);

  const handleExport = async () => {
    setExporting(true);
    try { await doExportPDF(resp, chartRef.current, activeTable); }
    catch (e) { console.error(e); }
    finally { setExporting(false); }
  };

  // Error
  if (!resp.success) {
    return (
      <div className="flex items-start gap-3 animate-slideUp">
        <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <div className="flex-1 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl rounded-tl-none p-4">
          <p className="text-sm font-medium text-rose-700 dark:text-rose-300 mb-1">Something went wrong</p>
          <p className="text-xs text-rose-600 dark:text-rose-400/80">{resp.error}</p>
          <button onClick={() => onDrillDown(resp.query)} className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 animate-slideUp">
      {/* Avatar */}
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
        </svg>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Badges + PDF */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">InsightAI</span>
          {resp.cache_hit && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-medium">cached</span>}
          {message.isRestoredFromHistory && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#22222e] text-slate-500 dark:text-slate-400 font-medium">restored</span>}
          {resp.is_modification && <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium">updated</span>}

          {(hasData || resp.insight) && (
            <button onClick={handleExport} disabled={exporting}
              className="ml-auto flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200 shadow-sm hover:shadow disabled:opacity-50 active:scale-[0.97]">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              {exporting ? "Generating..." : "Save as PDF"}
            </button>
          )}

          {!isLatest && (
            <button onClick={() => setCollapsed(!collapsed)} className="text-[10px] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center gap-1">
              <svg className={`w-3 h-3 transition-transform ${collapsed ? "" : "rotate-90"}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              {collapsed ? "Expand" : "Collapse"}
            </button>
          )}
        </div>

        {/* Collapsed */}
        {collapsed ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 transition-colors rounded-lg bg-slate-50 dark:bg-[#16161f] p-3 border border-slate-100 dark:border-[#2a2a3a]" onClick={() => setCollapsed(false)}>
            {resp.insight || "Click to expand"}
          </p>
        ) : (
          <div className="space-y-4">
            <ErrorBoundary fallbackTitle="Failed to render KPIs">
              <div className="animate-slideUp"><KPICards kpis={resp.kpis} /></div>
            </ErrorBoundary>

            {hasChart && (
              <ErrorBoundary fallbackTitle="Failed to render chart">
                <div className="rounded-xl bg-white dark:bg-[#1a1a25] border border-slate-200 dark:border-[#2a2a3a] overflow-hidden shadow-sm animate-slideUp">
                  <div className="flex items-center justify-between px-5 pt-4 pb-1 flex-wrap gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{resp.chart_config!.title || "Results"}</h3>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{resp.data.length} points &middot; {curType} &middot; {resp.execution_time}s</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <ChartTypeSwitcher currentType={curType} compatibleTypes={compat} onChange={setChartType} />
                      <button onClick={() => setFullscreen({ config: resp.chart_config!, data: resp.data })}
                        className="p-1.5 rounded-md border border-slate-200 dark:border-[#2a2a3a] hover:bg-slate-50 dark:hover:bg-[#22222e] text-slate-400 dark:text-slate-500 transition-colors" title="Fullscreen">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9m11.25-5.25v4.5m0-4.5h-4.5m4.5 0L15 9m-11.25 11.25v-4.5m0 4.5h4.5m-4.5 0L9 15m11.25 5.25v-4.5m0 4.5h-4.5m4.5 0L15 15" />
                        </svg>
                      </button>
                      <ExportButtons chartRef={chartRef} data={resp.data} title={resp.chart_config!.title || "chart"} />
                    </div>
                  </div>
                  <div ref={chartRef} className="px-3 pb-3">
                    <ChartRenderer data={resp.data} config={resp.chart_config!} darkMode={darkMode} overrideChartType={chartType || undefined}
                      onDrillDown={(xVal, xField) => onDrillDown(`Show me a detailed breakdown for ${xField} = "${xVal}"`)} />
                  </div>
                </div>
              </ErrorBoundary>
            )}

            {resp.additional_charts.length > 0 && (
              <ErrorBoundary fallbackTitle="Additional charts error">
                <div className="grid md:grid-cols-2 gap-3 animate-slideUp">
                  {resp.additional_charts.map((ac, i) => (
                    <div key={i} className="rounded-xl bg-white dark:bg-[#1a1a25] border border-slate-200 dark:border-[#2a2a3a] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-medium text-slate-700 dark:text-slate-300">{ac.title}</h4>
                        <button onClick={() => setFullscreen({ config: ac, data: resp.data })} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[#22222e] text-slate-400 dark:text-slate-500 transition-colors">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9m11.25-5.25v4.5m0-4.5h-4.5m4.5 0L15 9m-11.25 11.25v-4.5m0 4.5h4.5m-4.5 0L9 15m11.25 5.25v-4.5m0 4.5h-4.5m4.5 0L15 15" />
                          </svg>
                        </button>
                      </div>
                      <ChartRenderer data={resp.data} config={ac} darkMode={darkMode} />
                    </div>
                  ))}
                </div>
              </ErrorBoundary>
            )}

            <div className="animate-slideUp">
              <InsightBox insight={resp.insight} sql={resp.sql} executionTime={resp.execution_time} confidence={resp.confidence} assumptions={resp.assumptions} />
            </div>

            <ErrorBoundary fallbackTitle="Data table error">
              <div className="animate-slideUp">
                <DataTable data={resp.data} visible={showTable} onToggle={() => setShowTable(!showTable)} />
              </div>
            </ErrorBoundary>
          </div>
        )}
      </div>

      {fullscreen && <FullscreenModal config={fullscreen.config} data={fullscreen.data} darkMode={darkMode} chartType={curType} onClose={() => setFullscreen(null)} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  DashboardInner                                                        */
/* ═══════════════════════════════════════════════════════════════════════ */
function DashboardInner() {
  const { theme, toggle } = useTheme();
  const darkMode = theme === "dark";

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [schema, setSchema] = useState<SchemaInfo | null>(null);
  const [activeTable, setActiveTable] = useState("youtube_data");
  const [tableList, setTableList] = useState<TableInfo[]>([]);
  const [uploadSuggestions, setUploadSuggestions] = useState<string[]>([]);

  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeConv = useMemo(() => conversations.find((c) => c.id === activeConvId) ?? null, [conversations, activeConvId]);
  const messages = activeConv?.messages ?? [];
  const lastAssistant = useMemo(() => [...messages].reverse().find((m) => m.role === "assistant" && m.response), [messages]);
  const followUps = lastAssistant?.response?.follow_up_questions || [];
  const conversationCtx = useMemo(() =>
    messages.filter((m) => m.role === "assistant" && m.response?.sql).slice(-5)
      .map((m) => ({ query: m.query, sql: m.response!.sql, insight: m.response!.insight, chart_config: m.response!.chart_config as unknown })),
    [messages]);

  useEffect(() => { fetchSuggestions().then(setSuggestions).catch(console.error); fetchSchema().then(setSchema).catch(console.error); loadTables(); }, []);

  const loadTables = async () => {
    try { const r = await fetchTables(); setTableList(r.tables); setActiveTable(r.active_table); } catch (e) { console.error(e); }
  };

  useEffect(() => { try { const raw = localStorage.getItem("bi-conversations"); if (raw) { const parsed: Conversation[] = JSON.parse(raw); setConversations(parsed); if (parsed.length) { const active = parsed.filter((c) => !c.isArchived); if (active.length) setActiveConvId(active[0].id); } } } catch {} }, []);

  useEffect(() => {
    try { localStorage.setItem("bi-conversations", serializeConversations(conversations)); }
    catch { try { localStorage.setItem("bi-conversations", serializeConversations(conversations.slice(0, 20))); } catch {} }
  }, [conversations]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === "k") { e.preventDefault(); chatInputRef.current?.focus(); }
      if (meta && e.key === "/") { e.preventDefault(); setSidebarOpen((p) => !p); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const updateConversation = useCallback((id: string, updater: (c: Conversation) => Conversation) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
  }, []);

  const handleNewChat = useCallback(() => {
    const conv = createConversation();
    setConversations((prev) => [conv, ...prev]);
    setActiveConvId(conv.id);
    setUploadSuggestions([]);
    setTimeout(() => chatInputRef.current?.focus(), 100);
  }, []);

  const handleSelectConv = useCallback((id: string) => { setActiveConvId(id); }, []);
  const handlePinConv = useCallback((id: string) => { updateConversation(id, (c) => ({ ...c, isPinned: !c.isPinned })); }, [updateConversation]);

  const handleArchiveConv = useCallback((id: string) => {
    updateConversation(id, (c) => ({ ...c, isArchived: !c.isArchived }));
    if (activeConvId === id) { const rem = conversations.filter((c) => c.id !== id && !c.isArchived); setActiveConvId(rem.length ? rem[0].id : null); }
  }, [updateConversation, activeConvId, conversations]);

  const handleDeleteConv = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvId === id) { const rem = conversations.filter((c) => c.id !== id && !c.isArchived); setActiveConvId(rem.length ? rem[0].id : null); }
  }, [activeConvId, conversations]);

  const handleSwitchTable = async (name: string) => {
    try { await apiSetActiveTable(name); setActiveTable(name); handleNewChat(); await loadTables(); fetchSchema().then(setSchema).catch(console.error); } catch (e) { console.error(e); }
  };

  const handleDeleteTable = async (name: string) => {
    try { const r = await apiDeleteTable(name); setTableList(r.tables); setActiveTable(r.active_table); if (activeTable === name) handleNewChat(); fetchSchema().then(setSchema).catch(console.error); } catch (e) { console.error(e); }
  };

  const handleSubmit = useCallback(async (query: string) => {
    let convId = activeConvId;
    if (!convId) {
      const conv = createConversation(query);
      setConversations((prev) => [conv, ...prev]);
      convId = conv.id; setActiveConvId(conv.id);
    } else {
      const existing = conversations.find((c) => c.id === convId);
      if (existing && existing.messages.length === 0 && existing.title === "New conversation") {
        updateConversation(convId, (c) => ({ ...c, title: generateTitle(query) }));
      }
    }
    const capturedConvId = convId;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", query, timestamp: new Date().toISOString() };
    updateConversation(capturedConvId, (c) => ({ ...c, messages: [...c.messages, userMsg], updatedAt: new Date().toISOString() }));
    setLoading(true);

    try {
      const resp = await sendQuery(query, conversationCtx, activeTable);
      const aMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: "assistant", query, response: resp, timestamp: new Date().toISOString() };
      if (resp.is_modification) {
        updateConversation(capturedConvId, (c) => {
          const msgs = [...c.messages];
          for (let i = msgs.length - 1; i >= 0; i--) {
            if (msgs[i].role === "assistant" && msgs[i].response) { msgs[i] = { ...msgs[i], response: resp, isCollapsed: false }; break; }
          }
          return { ...c, messages: msgs, updatedAt: new Date().toISOString() };
        });
      } else {
        updateConversation(capturedConvId, (c) => ({ ...c, messages: [...c.messages, aMsg], updatedAt: new Date().toISOString() }));
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } }; message?: string };
      const msg = ax?.response?.data?.error || ax?.message || "Request failed";
      const errMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: "assistant", query,
        response: { success: false, query, sql: "", data: [], chart_config: null, additional_charts: [], insight: "", kpis: [], follow_up_questions: [], execution_time: 0, error: msg },
        timestamp: new Date().toISOString() };
      updateConversation(capturedConvId, (c) => ({ ...c, messages: [...c.messages, errMsg], updatedAt: new Date().toISOString() }));
    } finally { setLoading(false); }
  }, [activeConvId, conversations, conversationCtx, activeTable, updateConversation]);

  const handleUploadDone = async (tableName: string, suggestedQuestions?: string[]) => {
    await loadTables(); fetchSchema().then(setSchema).catch(console.error);
    setActiveTable(tableName); handleNewChat();
    if (suggestedQuestions?.length) setUploadSuggestions(suggestedQuestions);
  };

  const activeTableInfo = tableList.find((t) => t.name === activeTable);

  /* ═══════════════════════════════════════════════════════════════════ */
  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-[#0a0a0f]">
      {/* Sidebar */}
      {sidebarOpen && (
        <aside className="w-[260px] flex-shrink-0 border-r border-slate-200 dark:border-[#1e1e2a] bg-slate-50 dark:bg-[#0e0e15] overflow-hidden animate-slideInLeft">
          <QueryHistory conversations={conversations} activeConvId={activeConvId} onSelect={handleSelectConv} onNewChat={handleNewChat}
            onPin={handlePinConv} onArchive={handleArchiveConv} onDelete={handleDeleteConv} onClose={() => setSidebarOpen(false)} />
        </aside>
      )}

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-5 py-2.5 border-b border-slate-200 dark:border-[#1e1e2a] bg-white dark:bg-[#0a0a0f] z-20">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-[#1a1a25] text-slate-400 dark:text-slate-500 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
              </svg>
            </button>

            <button onClick={handleNewChat} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#2a2a3a] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1a1a25] transition-all duration-200 active:scale-[0.97]">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New chat
            </button>

            <div className="hidden sm:flex items-center gap-2 ml-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
              </div>
              <div>
                <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-none">InsightAI</h1>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">{schema ? `${schema.row_count.toLocaleString()} rows` : "Analytics"}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DatasetSwitcher tables={tableList} activeTable={activeTable} onSwitch={handleSwitchTable} onDelete={handleDeleteTable} />
            <CSVUpload onUploadDone={handleUploadDone} />
            <button onClick={toggle} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1a1a25] transition-colors border border-slate-200 dark:border-[#2a2a3a] text-slate-500 dark:text-slate-400">
              {darkMode ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" /></svg>
              )}
            </button>
          </div>
        </header>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-[#0a0a0f]">
          <div className="max-w-4xl mx-auto px-6 py-6 space-y-8">
            {/* Welcome */}
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-20 text-center animate-fadeIn">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20 animate-scaleIn">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-2">What would you like to explore?</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-10">
                  Ask questions about your <span className="font-medium text-indigo-600 dark:text-indigo-400">{activeTable}</span> data in plain English
                </p>

                {schema && (
                  <div className="flex items-center gap-3 mb-8 text-xs flex-wrap justify-center animate-slideUp" style={{ animationDelay: "0.15s" }}>
                    <span className="px-3 py-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-medium">
                      {(activeTableInfo?.row_count ?? schema.row_count).toLocaleString()} records
                    </span>
                    <span className="px-3 py-1.5 rounded-md bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 font-medium">
                      {schema.tables.length} table(s)
                    </span>
                    <span className="px-3 py-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-medium">
                      Gemini AI
                    </span>
                  </div>
                )}

                <div className="grid sm:grid-cols-3 gap-4 max-w-3xl w-full">
                  {suggestions.slice(0, 3).map((s, i) => (
                    <button key={i} onClick={() => handleSubmit(s.query)}
                      className="text-left p-5 rounded-xl border border-slate-200 dark:border-[#2a2a3a] bg-white dark:bg-[#1a1a25] hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all duration-200 group animate-slideUp"
                      style={{ animationDelay: `${0.3 + i * 0.08}s` }}>
                      <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded mb-3 ${
                        s.difficulty === "Simple" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : s.difficulty === "Medium" ? "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
                      }`}>{s.difficulty}</span>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{s.query}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">{s.description}</p>
                    </button>
                  ))}
                </div>

                {suggestions.length > 3 && (
                  <div className="mt-4 flex flex-wrap gap-2 max-w-2xl justify-center animate-slideUp" style={{ animationDelay: "0.5s" }}>
                    {suggestions.slice(3).map((s, i) => (
                      <button key={i} onClick={() => handleSubmit(s.query)} className="px-3 py-1.5 text-xs rounded-md border border-slate-200 dark:border-[#2a2a3a] text-slate-500 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200">{s.query}</button>
                    ))}
                  </div>
                )}

                {uploadSuggestions.length > 0 && (
                  <div className="mt-6 w-full max-w-2xl animate-slideUp">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Suggested for your dataset:</p>
                    <div className="flex flex-wrap gap-2">
                      {uploadSuggestions.map((q, i) => (
                        <button key={i} onClick={() => handleSubmit(q)} className="px-3 py-1.5 text-xs rounded-md border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">{q}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Messages */}
            {messages.map((msg) => {
              if (msg.role === "user") {
                return (
                  <div key={msg.id} className="flex justify-end animate-slideInRight">
                    <div className="max-w-[75%] flex items-start gap-3">
                      <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-md px-5 py-3 shadow-sm">
                        <p className="text-sm leading-relaxed">{msg.query}</p>
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              }

              const isLatest = msg.id === ([...messages].reverse().find((m) => m.role === "assistant")?.id);
              return <AssistantBlock key={msg.id} message={msg} darkMode={darkMode} onDrillDown={handleSubmit} activeTable={activeTable} isLatest={!!isLatest} />;
            })}

            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-slate-200 dark:border-[#1e1e2a] bg-white dark:bg-[#0a0a0f] px-6 py-3">
          <ChatInput onSubmit={handleSubmit} loading={loading} suggestions={suggestions}
            followUps={[...followUps, ...uploadSuggestions]} activeTable={activeTable} inputRef={chatInputRef} />
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