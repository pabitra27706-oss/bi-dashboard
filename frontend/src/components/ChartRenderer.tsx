"use client";
import { useMemo } from "react";
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
  Label,
} from "recharts";
import type { ChartConfig } from "@/types";

const DEFAULT_COLORS = [
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
}

/* ── Formatting ────────────────────────────────────────────── */

function fmt(v: unknown): string {
  if (typeof v !== "number") return String(v ?? "");
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + "B";
  if (abs >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (abs >= 1_000) return (v / 1_000).toFixed(1) + "K";
  if (Number.isInteger(v)) return v.toLocaleString();
  return v.toFixed(2);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl px-4 py-3 text-xs max-w-xs">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1.5 truncate">
        {label}
      </p>
      {payload.map((p: any, i: number) => (
        <p
          key={i}
          className="flex justify-between gap-4"
          style={{ color: p.color }}
        >
          <span className="truncate">{p.name}:</span>
          <span className="font-mono font-semibold">{fmt(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

/* ── Pivot helper for grouped data ─────────────────────────── */

function pivotData(
  data: Record<string, unknown>[],
  xField: string,
  groupField: string,
  valueFields: string[]
) {
  const map: Record<string, Record<string, unknown>> = {};
  const groups = new Set<string>();

  data.forEach((row) => {
    const x = String(row[xField] ?? "");
    const g = String(row[groupField] ?? "");
    groups.add(g);
    if (!map[x]) map[x] = { [xField]: x };
    valueFields.forEach((vf) => {
      map[x][`${g}_${vf}`] = row[vf];
    });
  });

  const seriesKeys: string[] = [];
  groups.forEach((g) =>
    valueFields.forEach((vf) => seriesKeys.push(`${g}_${vf}`))
  );
  return { pivoted: Object.values(map), seriesKeys };
}

/* ── Main Component ────────────────────────────────────────── */

export default function ChartRenderer({ data, config, darkMode }: Props) {
  const axis = {
    fontSize: 11,
    fill: darkMode ? "#94A3B8" : "#64748B",
  };
  const grid = darkMode ? "#334155" : "#E2E8F0";
  const colors =
    config.colors?.length > 0 ? config.colors : DEFAULT_COLORS;

  const { displayData, seriesKeys } = useMemo(() => {
    if (
      config.group_by &&
      data.length > 0 &&
      config.group_by in (data[0] as Record<string, unknown>)
    ) {
      const { pivoted, seriesKeys } = pivotData(
        data,
        config.x_axis,
        config.group_by,
        config.y_axis
      );
      return { displayData: pivoted, seriesKeys };
    }
    return { displayData: data, seriesKeys: config.y_axis };
  }, [data, config]);

  if (!displayData.length) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 dark:text-slate-500">
        No data to display
      </div>
    );
  }

  const annotations = (config.annotations ?? []).map((a, i) => (
    <ReferenceLine
      key={`ann-${i}`}
      y={typeof a.value === "number" ? a.value : undefined}
      x={typeof a.value === "string" ? a.value : undefined}
      stroke={a.color || "#EF4444"}
      strokeDasharray="4 4"
      strokeWidth={2}
    >
      {a.label && (
        <Label
          value={a.label}
          position="insideTopRight"
          fill={a.color}
          fontSize={10}
        />
      )}
    </ReferenceLine>
  ));

  /* ── BAR / GROUPED_BAR / STACKED_BAR ─────────────────── */
  if (["bar", "grouped_bar", "stacked_bar"].includes(config.chart_type)) {
    const stackId =
      config.chart_type === "stacked_bar" ? "stack" : undefined;
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
          <YAxis tick={axis} tickFormatter={(v) => fmt(v)} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {annotations}
          {seriesKeys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              fill={colors[i % colors.length]}
              radius={[4, 4, 0, 0]}
              stackId={stackId}
              name={key.replace(/_/g, " ")}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  /* ── LINE ────────────────────────────────────────────── */
  if (config.chart_type === "line") {
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
          <YAxis tick={axis} tickFormatter={(v) => fmt(v)} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {annotations}
          {config.y_label?.toLowerCase().includes("sentiment") && (
            <ReferenceLine y={0} stroke="#EF4444" strokeDasharray="6 3">
              <Label
                value="Neutral"
                position="right"
                fill="#EF4444"
                fontSize={10}
              />
            </ReferenceLine>
          )}
          {seriesKeys.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[i % colors.length]}
              strokeWidth={2.5}
              dot={{ r: 4, fill: colors[i % colors.length] }}
              activeDot={{ r: 6 }}
              name={key.replace(/_/g, " ")}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  /* ── AREA ────────────────────────────────────────────── */
  if (config.chart_type === "area") {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart
          data={displayData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={grid} />
          <XAxis dataKey={config.x_axis} tick={axis} />
          <YAxis tick={axis} tickFormatter={(v) => fmt(v)} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {seriesKeys.map((key, i) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[i % colors.length]}
              fill={colors[i % colors.length]}
              fillOpacity={0.15}
              strokeWidth={2}
              name={key.replace(/_/g, " ")}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  /* ── PIE / DONUT ─────────────────────────────────────── */
  if (["pie", "donut"].includes(config.chart_type)) {
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
            innerRadius={config.chart_type === "donut" ? 80 : 0}
            paddingAngle={2}
            label={({ name, percent }: any) =>
              `${name} ${(percent * 100).toFixed(0)}%`
            }
          >
            {displayData.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  /* ── SCATTER ─────────────────────────────────────────── */
  if (config.chart_type === "scatter") {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={grid} />
          <XAxis dataKey={config.x_axis} tick={axis} name={config.x_label} />
          <YAxis
            dataKey={config.y_axis[0]}
            tick={axis}
            tickFormatter={(v) => fmt(v)}
            name={config.y_label}
          />
          <Tooltip content={<CustomTooltip />} />
          <Scatter data={displayData} fill={colors[0]} />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  /* ── FALLBACK ────────────────────────────────────────── */
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={displayData}>
        <CartesianGrid strokeDasharray="3 3" stroke={grid} />
        <XAxis dataKey={config.x_axis} tick={axis} />
        <YAxis tick={axis} tickFormatter={(v) => fmt(v)} />
        <Tooltip content={<CustomTooltip />} />
        {seriesKeys.map((key, i) => (
          <Bar
            key={key}
            dataKey={key}
            fill={colors[i % colors.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}