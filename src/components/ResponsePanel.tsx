import { useState } from "react";
import { MarkdownMessage } from "./MarkdownMessage";
import type { ChatMessage } from "../types/chat";
import { combineClasses } from "../utils/classes";
import { SCHEDULE_REPORTS_ENDPOINT } from "../config";
import { useAuth } from "../contexts/AuthContext";

const formatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short"
});

type ResponsePanelProps = {
  message?: ChatMessage;
  onClose: () => void;
  className?: string;
};

export function ResponsePanel({ message, onClose, className }: ResponsePanelProps) {
  const panelClass = combineClasses(
    "flex h-full min-w-0 flex-col gap-6 overflow-y-auto border-l border-slate-200 bg-white/90 p-6 shadow-card backdrop-blur dark:border-slate-800 dark:bg-slate-900/85 scrollbar-none",
    className
  );
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const sqlText = message?.details ?? "";
  const normalizedSql = sqlText.replace(/\r\n/g, "\n");
  const sqlBody = normalizedSql.trim();
  const sqlMarkdown = sqlBody.length
    ? ["```sql", sqlBody, "```"].join("\n")
    : "";
  const resultMarkdown = (message?.result ?? "").trim();
  const showResultLoader = Boolean(message?.isResultLoading) && !resultMarkdown;

  const handleExport = async () => {
    const email = user?.email?.trim();
    const baseName = (message?.title ?? "DataVerse Export").trim() || "DataVerse Export";
    const uniqueName = `${baseName.slice(0, 200)}-${Date.now()}`.slice(0, 255);

    const payload = {
      name: uniqueName,
      description: "",
      query: sqlBody,
      format: "csv" as const,
      frequency_cron: "",
      recipients: [email],
      enabled: true,
      report_type: "download" as const
    };

    setIsExporting(true);

    try {
      const response = await fetch(SCHEDULE_REPORTS_ENDPOINT, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Export failed with status ${response.status}`);
      }

    } catch (error) {
      console.error("Failed to export report", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <aside className={panelClass}>
      <header className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="space-y-1">
          <h2 className="text-base font-semibold tracking-tight">Query details</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 transition hover:border-sky-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-sky-500 dark:hover:text-white"
          >
            Schedule
          </button>
          <button
            type="button"
            className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 transition hover:border-sky-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:border-sky-500 dark:hover:text-white"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? "Exporting…" : "Export"}
          </button>
          <button
            type="button"
            className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 transition hover:border-sky-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-sky-500 dark:hover:text-white"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </header>

      {message ? (
        <div className="flex flex-1 flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <span
              className="rounded-full border border-sky-200 px-3 py-1 text-xs font-semibold capitalize text-sky-700 dark:border-sky-700 dark:text-sky-300"
            >
              {message.role}
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            <time className="text-slate-600 dark:text-slate-300" dateTime={message.createdAt}>
              {formatter.format(new Date(message.createdAt))}
            </time>
          </div>
          {sqlMarkdown ? <MarkdownMessage content={sqlMarkdown} /> : null}
          {showResultLoader ? (
            <div className="flex h-32 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-white/40 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
              <span className="inline-flex h-7 w-7 animate-spin rounded-full border-2 border-slate-300 border-t-sky-500 dark:border-slate-600 dark:border-t-sky-400" aria-hidden="true" />
              <p className="text-xs font-semibold uppercase tracking-wide">Fetching query result...</p>
            </div>
          ) : null}
          {resultMarkdown ? <MarkdownMessage content={resultMarkdown} /> : null}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/40 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
          Select a reply in the thread to see its full context here.
        </div>
      )}
    </aside>
  );
}
