"use client";
import { Download, Image } from "lucide-react";
import { toPng } from "html-to-image";
import { RefObject } from "react";

interface Props {
  chartRef: RefObject<HTMLDivElement | null>;
  data: Record<string, unknown>[];
  title: string;
}

export default function ExportButtons({ chartRef, data, title }: Props) {
  const safeName = title.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 50);

  const exportPNG = async () => {
    if (!chartRef.current) return;
    try {
      const url = await toPng(chartRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeName}.png`;
      a.click();
    } catch (err) {
      console.error("PNG export failed:", err);
    }
  };

  const exportCSV = () => {
    if (!data.length) return;
    const cols = Object.keys(data[0]);
    const header = cols.join(",");
    const rows = data.map((r) =>
      cols
        .map((c) => {
          const v = r[c];
          if (v == null) return "";
          const s = String(v);
          return s.includes(",") || s.includes('"')
            ? `"${s.replace(/"/g, '""')}"`
            : s;
        })
        .join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${safeName}.csv`;
    a.click();
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={exportPNG}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
      >
        <Image className="w-3.5 h-3.5" /> PNG
      </button>
      <button
        onClick={exportCSV}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
      >
        <Download className="w-3.5 h-3.5" /> CSV
      </button>
    </div>
  );
}