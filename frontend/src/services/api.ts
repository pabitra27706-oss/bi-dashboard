import axios from "axios";
import type { QueryResponse, SchemaInfo, Suggestion } from "@/types";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  timeout: 120000,
});

export async function sendQuery(
  query: string,
  conversationHistory: { query: string; sql: string; insight: string }[] = []
): Promise<QueryResponse> {
  const { data } = await API.post<QueryResponse>("/api/query", {
    query,
    conversation_history: conversationHistory,
  });
  return data;
}

export async function fetchSchema(): Promise<SchemaInfo> {
  const { data } = await API.get("/api/schema");
  return data;
}

export async function fetchSuggestions(): Promise<Suggestion[]> {
  const { data } = await API.get("/api/suggestions");
  return data.suggestions;
}

export async function uploadCSV(
  file: File,
  tableName: string = "custom_data"
): Promise<Record<string, unknown>> {
  const form = new FormData();
  form.append("file", file);
  form.append("table_name", tableName);
  const { data } = await API.post("/api/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}