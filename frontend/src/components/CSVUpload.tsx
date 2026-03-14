"use client";
import { useState, useRef } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import { uploadCSV } from "@/services/api";

interface Props {
  onUploadDone: () => void;
}

export default function CSVUpload({ onUploadDone }: Props) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      await uploadCSV(
        file,
        file.name.replace(/\.csv$/i, "").replace(/\W/g, "_")
      );
      setDone(true);
      setTimeout(() => {
        onUploadDone();
        setOpen(false);
        setDone(false);
      }, 1500);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Upload failed";
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Upload className="w-3.5 h-3.5" /> Upload CSV
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800 dark:text-white">
            Upload Dataset
          </h3>
          <button
            onClick={() => {
              setOpen(false);
              setError("");
            }}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
        >
          {done ? (
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
          ) : uploading ? (
            <Loader2 className="w-12 h-12 mx-auto text-indigo-500 animate-spin mb-3" />
          ) : (
            <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          )}
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {done
              ? "Upload complete!"
              : uploading
              ? "Processing..."
              : "Click to select a CSV file"}
          </p>
        </div>

        {error && (
          <p className="mt-3 text-xs text-rose-500">{error}</p>
        )}

        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFile}
        />
      </div>
    </div>
  );
}