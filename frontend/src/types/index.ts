export interface Annotation {
  type: "line" | "area" | "dot";
  value?: number | string;
  label: string;
  color: string;
}

export interface ChartConfig {
  chart_type: string;
  title: string;
  x_axis: string;
  x_label: string;
  y_axis: string[];
  y_label: string;
  group_by: string | null;
  colors: string[];
  annotations: Annotation[];
}

export interface KPI {
  label: string;
  value: string;
  icon: string;
  trend?: string | null;
  trend_direction: string;
}

export interface QueryResponse {
  success: boolean;
  query: string;
  sql: string;
  data: Record<string, unknown>[];
  chart_config: ChartConfig | null;
  additional_charts: ChartConfig[];
  insight: string;
  kpis: KPI[];
  follow_up_questions: string[];
  execution_time: number;
  error?: string | null;
}

export interface HistoryItem {
  id: string;
  query: string;
  sql: string;
  insight: string;
  timestamp: Date;
  chartType: string;
}

export interface TableSchema {
  name: string;
  columns: { name: string; type: string }[];
  row_count: number;
  sample: Record<string, unknown>[];
}

export interface SchemaInfo {
  tables: TableSchema[];
  row_count: number;
}

export interface Suggestion {
  query: string;
  difficulty: string;
  description: string;
}