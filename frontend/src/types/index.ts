export interface Annotation {
  type: string;
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
  cache_hit?: boolean;
  timestamp?: string;
  confidence?: string | null;
  assumptions?: string[];
  is_modification?: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  query: string;
  response?: QueryResponse;
  timestamp: string;
  isCollapsed?: boolean;
  isRestoredFromHistory?: boolean;
}

/* ── Conversation-based history ──────────────────────────────────────── */
export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  isArchived: boolean;
}

/* ── Legacy — kept for backward compat but unused ────────────────────── */
export interface HistoryItem {
  id: string;
  query: string;
  response: QueryResponse;
  timestamp: Date;
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

export interface TableInfo {
  name: string;
  row_count: number;
  column_count: number;
  columns: { name: string; type: string }[];
  is_active: boolean;
}

export interface TablesResponse {
  tables: TableInfo[];
  active_table: string;
  timestamp?: string;
}

export interface UploadPreview {
  success: boolean;
  file_name: string;
  file_size: number;
  row_count: number;
  columns: { name: string; type: string }[];
  sample_rows: Record<string, unknown>[];
  error?: string | null;
}