"use client";
import { useState, useMemo } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Table2,
} from "lucide-react";

interface Props {
  data: Record<string, unknown>[];
  visible: boolean;
  onToggle: () => void;
}

const PAGE = 20;

export default function DataTable({ data, visible, onToggle }: Props) {
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  const columns = useMemo(
    () => (data.length ? Object.keys(data[0]) : []),
    [data]
  );

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va).localeCompare(String(vb));
      return sortAsc ? cmp : -cmp;
    });
  }, [data, sortKey, sortAsc]);

  const paged = sorted.slice(page * PAGE, (page + 1) * PAGE);
  const total = Math.ceil(sorted.length / PAGE);

  const toggleSort = (col: string) => {
    if (sortKey === col) setSortAsc(!sortAsc);
    else {
      setSortKey(col);
      setSortAsc(true);
    }
    setPage(0);
  };

  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-3"
      >
        <Table2 className="w-4 h-4" />
        {visible ? "Hide" : "Show"} Raw Data ({data.length.toLocaleString()}{" "}
        rows)
      </button>

      {visible && data.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col}
                      onClick={() => toggleSort(col)}
                      className="px-3 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 select-none whitespace-nowrap"
                    >
                      <span className="flex items-center gap-1">
                        {col}
                        {sortKey === col ? (
                          sortAsc ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-3 h-3 opacity-30" />
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((row, ri) => (
                  <tr
                    key={ri}
                    className="border-t border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    {columns.map((col) => (
                      <td
                        key={col}
                        className="px-3 py-2 text-slate-700 dark:text-slate-300 whitespace-nowrap font-mono"
                      >
                        {row[col] != null ? String(row[col]) : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > 1 && (
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-500">
                Page {page + 1} of {total}
              </span>
              <div className="flex gap-1">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                  className="px-2 py-1 text-[10px] rounded bg-slate-200 dark:bg-slate-700 disabled:opacity-30 hover:bg-slate-300 dark:hover:bg-slate-600 transition"
                >
                  Prev
                </button>
                <button
                  disabled={page >= total - 1}
                  onClick={() => setPage(page + 1)}
                  className="px-2 py-1 text-[10px] rounded bg-slate-200 dark:bg-slate-700 disabled:opacity-30 hover:bg-slate-300 dark:hover:bg-slate-600 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}