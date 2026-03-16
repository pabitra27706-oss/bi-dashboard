"use client";
import React, { useState, useRef } from "react";
import { uploadCSV, uploadPreview } from "@/services/api";
import type { UploadPreview } from "@/types";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

interface Props {
  onUploadDone: (tableName: string, suggestedQuestions?: string[]) => void;
}

export default function CSVUpload({ onUploadDone }: Props) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<UploadPreview | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setPreview(null);
    setSelectedFile(null);
    setError("");
    setDone(false);
    setUploadProgress(0);
    setLoadingPreview(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setPreview(null);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError(`Invalid file type: "${file.name}". Only .csv files are allowed.`);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum is 50MB.`);
      return;
    }

    setSelectedFile(file);
    setLoadingPreview(true);
    try {
      const prev = await uploadPreview(file);
      if (prev.success) setPreview(prev);
      else setError(prev.error || "Failed to preview file");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError("");
    setUploadProgress(0);
    const tableName = selectedFile.name
      .replace(/\.csv$/i, "")
      .replace(/\W/g, "_");
    try {
      const result = await uploadCSV(
        selectedFile,
        tableName,
        (pct: number) => setUploadProgress(pct)
      );
      if (result.success) {
        setDone(true);
        setTimeout(() => {
          onUploadDone(
            result.table_name,
            result.suggested_questions
          );
          setOpen(false);
          resetState();
        }, 1200);
      } else {
        setError(result.error || "Upload failed");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
        </svg>
        Upload CSV
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-lg shadow-xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
            Upload dataset
          </h3>
          <button
            onClick={() => { setOpen(false); resetState(); }}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!preview && !loadingPreview && !done && (
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-lg p-10 text-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
          >
            <svg className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Click to select a CSV file
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Max 50 MB</p>
          </div>
        )}

        {loadingPreview && (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-8 h-8 border-[3px] border-transparent border-t-indigo-500 rounded-full animate-spin mb-3" />
            <p className="text-xs text-slate-500">Loading preview...</p>
          </div>
        )}

        {preview && !done && (
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {preview.file_name}
                </p>
                <span className="text-[10px] text-slate-400">
                  {formatSize(preview.file_size)}
                </span>
              </div>
              <div className="flex gap-4 text-[10px] text-slate-500">
                <span>{preview.row_count.toLocaleString()} rows</span>
                <span>{preview.columns.length} columns</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                Columns
              </p>
              <div className="flex flex-wrap gap-1.5">
                {preview.columns.map((col, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 text-[10px] rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                  >
                    {col.name}{" "}
                    <span className="text-slate-400 dark:text-slate-500">
                      ({col.type})
                    </span>
                  </span>
                ))}
              </div>
            </div>

            {preview.sample_rows.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Preview (first 5 rows)
                </p>
                <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-[10px]">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                      <tr>
                        {preview.columns.map((col, i) => (
                          <th
                            key={i}
                            className="px-2 py-1.5 text-left font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap"
                          >
                            {col.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.sample_rows.map((row, ri) => (
                        <tr
                          key={ri}
                          className="border-t border-slate-100 dark:border-slate-700/50"
                        >
                          {preview.columns.map((col, ci) => (
                            <td
                              key={ci}
                              className="px-2 py-1 text-slate-700 dark:text-slate-300 whitespace-nowrap font-mono max-w-[150px] truncate"
                            >
                              {row[col.name] != null
                                ? String(row[col.name])
                                : "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {uploading && (
              <div>
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span>
                    {uploadProgress < 100
                      ? "Uploading..."
                      : "Processing..."}
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => resetState()}
                disabled={uploading}
                className="flex-1 px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUpload}
                disabled={uploading}
                className="flex-1 px-4 py-2 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Confirm upload"}
              </button>
            </div>
          </div>
        )}

        {done && (
          <div className="text-center py-6">
            <svg className="w-10 h-10 mx-auto mb-3 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Upload complete
            </p>
          </div>
        )}

        {error && (
          <p className="mt-3 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/30 rounded-lg p-3">
            {error}
          </p>
        )}

        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    </div>
  );
}