"use client";
import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Brush,
} from "recharts";
import type { ChartConfig } from "@/types";

const COLORS = [
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
  "#F43F5E",
  "#F59E0B",
  "#10B981",
  "#06B6D4",
  "#3B82F6",
];

interface Props {
  data: Record<string, unknown>[];
  config: ChartConfig;
  darkMode: boolean;
  overrideChartType?: string;
  onDrillDown?: (xValue: string, xField: string) => void;
}

function fmt(v: unknown): string {
  if (typeof v !== "number") return String(v ?? "");
  const abs = Math.abs(v);
  if (abs >= 1e9) return (v / 1e9).toFixed(1) + "B";
  if (abs >= 1e6) return (v / 1e6).toFixed(1) + "M";
  if (abs >= 1e3) return (v / 1e3).toFixed(1) + "K";
  if (Number.isInteger(v)) return v.toLocaleString();
  return v.toFixed(2);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg px-4 py-3 text-xs max-w-xs">
      <p className="font-medium text-slate-700 dark:text-slate-200 mb-1.5">
        {label}
      </p>
      {payload.map((p: any, i: number) => (
        <p
          key={i}
          style={{ color: p.color }}
          className="flex justify-between gap-4"
        >
          <span>{p.name}:</span>
          <span className="font-mono font-medium">{fmt(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

function pivotData(
  data: Record<string, any>[],
  xField: string,
  groupField: string,
  valueFields: string[]
) {
  const map: Record<string, Record<string, any>> = {};
  const groups = new Set<string>();
  data.forEach((row) => {
    const x = String(row[xField] ?? "");
    const g = String(row[groupField] ?? "");
    groups.add(g);
    if (!map[x]) map[x] = { [xField]: x };
    valueFields.forEach((vf) => {
      map[x][g + "_" + vf] = row[vf];
    });
  });
  const seriesKeys: string[] = [];
  groups.forEach((g) =>
    valueFields.forEach((vf) => seriesKeys.push(g + "_" + vf))
  );
  return { pivoted: Object.values(map), seriesKeys };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export default function ChartRenderer({
  data,
  config,
  darkMode,
  overrideChartType,
  onDrillDown,
}: Props) {
  const chartType = overrideChartType || config.chart_type;
  const axis = { fontSize: 11, fill: darkMode ? "#94A3B8" : "#64748B" };
  const grid = darkMode ? "#334155" : "#E2E8F0";
  const colors = config.colors?.length > 0 ? config.colors : COLORS;
  const showBrush = data.length > 12;

  const { displayData, seriesKeys } = useMemo(() => {
    const d = data as Record<string, any>[];
    if (config.group_by && d.length > 0 && config.group_by in d[0]) {
      const { pivoted, seriesKeys } = pivotData(
        d,
        config.x_axis,
        config.group_by,
        config.y_axis
      );
      return { displayData: pivoted, seriesKeys };
    }
    return { displayData: d, seriesKeys: config.y_axis };
  }, [data, config]);

  if (!displayData.length)
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        No data to display
      </div>
    );

  const refLines = (config.annotations ?? []).map((a, i) => (
    <ReferenceLine
      key={"ann" + i}
      y={typeof a.value === "number" ? a.value : undefined}
      x={typeof a.value === "string" ? a.value : undefined}
      stroke={a.color || "#EF4444"}
      strokeDasharray="4 4"
      strokeWidth={2}
    />
  ));

  /* ── BAR / GROUPED / STACKED ──────────────────────────────────────── */
  if (["bar", "grouped_bar", "stacked_bar"].includes(chartType)) {
    const stackId = chartType === "stacked_bar" ? "stack" : undefined;
    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={displayData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={grid} />
          <XAxis
            dataKey={config.x_axis}
            tick={axis}
            angle={displayData.length > 6 ? -35 : 0}
            textAnchor={displayData.length > 6 ? "end" : "middle"}
            height={60}
          />
          <YAxis tick={axis} tickFormatter={fmt} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {refLines}
          {seriesKeys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              fill={colors[i % colors.length]}
              radius={[3, 3, 0, 0]}
              stackId={stackId}
              name={key.replace(/_/g, " ")}
              cursor={onDrillDown ? "pointer" : undefined}
              onClick={(entry: any) => {
                if (onDrillDown && entry) {
                  const val =
                    entry[config.x_axis] ?? entry.name ?? entry.payload?.[config.x_axis];
                  if (val != null) onDrillDown(String(val), config.x_axis);
                }
              }}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  /* ── LINE ──────────────────────────────────────────────────────────── */
  if (chartType === "line") {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={displayData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={grid} />
          <XAxis
            dataKey={config.x_axis}
            tick={axis}
            angle={displayData.length > 8 ? -35 : 0}
            textAnchor={displayData.length > 8 ? "end" : "middle"}
            height={60}
          />
          <YAxis tick={axis} tickFormatter={fmt} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {refLines}
          {config.y_label?.toLowerCase().includes("sentiment") && (
            <ReferenceLine y={0} stroke="#EF4444" strokeDasharray="6 3" />
          )}
          {seriesKeys.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[i % colors.length]}
              strokeWidth={2}
              dot={{ r: 3, fill: colors[i % colors.length] }}
              activeDot={{ r: 5 }}
              name={key.replace(/_/g, " ")}
            />
          ))}
          {showBrush && (
            <Brush
              dataKey={config.x_axis}
              height={24}
              stroke="#6366F1"
              fill={darkMode ? "#1E293B" : "#F8FAFC"}
              tickFormatter={() => ""}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  /* ── AREA ──────────────────────────────────────────────────────────── */
  if (chartType === "area") {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart
          data={displayData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={grid} />
          <XAxis dataKey={config.x_axis} tick={axis} />
          <YAxis tick={axis} tickFormatter={fmt} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {seriesKeys.map((key, i) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[i % colors.length]}
              fill={colors[i % colors.length]}
              fillOpacity={0.12}
              strokeWidth={2}
              name={key.replace(/_/g, " ")}
            />
          ))}
          {showBrush && (
            <Brush
              dataKey={config.x_axis}
              height={24}
              stroke="#6366F1"
              fill={darkMode ? "#1E293B" : "#F8FAFC"}
              tickFormatter={() => ""}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  /* ── PIE / DONUT ───────────────────────────────────────────────────── */
  if (["pie", "donut"].includes(chartType)) {
    const valKey =
      config.y_axis[0] ||
      Object.keys(displayData[0]).find((k) => k !== config.x_axis) ||
      "";
    return (
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={displayData}
            dataKey={valKey}
            nameKey={config.x_axis}
            cx="50%"
            cy="50%"
            outerRadius={150}
            innerRadius={chartType === "donut" ? 80 : 0}
            paddingAngle={2}
            label={({ name, percent }: any) =>
              name + " " + (percent * 100).toFixed(0) + "%"
            }
          >
            {displayData.map((_: any, i: number) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  /* ── SCATTER ───────────────────────────────────────────────────────── */
  if (chartType === "scatter") {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={grid} />
          <XAxis
            dataKey={config.x_axis}
            tick={axis}
            name={config.x_label}
          />
          <YAxis
            dataKey={config.y_axis[0]}
            tick={axis}
            tickFormatter={fmt}
            name={config.y_label}
          />
          <Tooltip content={<CustomTooltip />} />
          <Scatter data={displayData} fill={colors[0]} />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  /* ── FALLBACK BAR ──────────────────────────────────────────────────── */
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={displayData}>
        <CartesianGrid strokeDasharray="3 3" stroke={grid} />
        <XAxis dataKey={config.x_axis} tick={axis} />
        <YAxis tick={axis} tickFormatter={fmt} />
        <Tooltip content={<CustomTooltip />} />
        {seriesKeys.map((key, i) => (
          <Bar
            key={key}
            dataKey={key}
            fill={colors[i % colors.length]}
            radius={[3, 3, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}