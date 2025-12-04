import { useEffect, useRef, useState } from "react";
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

type ScheduleOption = {
  label: string;
  cron: string;
};

// Map schedule labels to cron expressions for the scheduling menu.
const scheduleOptions: ScheduleOption[] = [
  { label: "Every day", cron: "cron(0 0 * * ? *)" },
  { label: "Every week", cron: "cron(0 0 ? * MON *)" },
  { label: "Every month", cron: "cron(0 0 1 * ? *)" },
  { label: "Every quarter", cron: "cron(0 0 1 1/3 ? *)" },
  { label: "Every half year", cron: "cron(0 0 1 1/6 ? *)" }
];

export function ResponsePanel({ message, onClose, className }: ResponsePanelProps) {
  const panelClass = combineClasses(
    "flex h-full min-w-0 flex-col gap-6 overflow-y-auto border-l border-slate-200 bg-white/90 p-6 shadow-card backdrop-blur dark:border-slate-800 dark:bg-slate-900/85 scrollbar-none",
    className
  );
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isQueryExpanded, setIsQueryExpanded] = useState(true);
  const scheduleMenuRef = useRef<HTMLDivElement>(null);
  const sqlText = message?.details ?? "";
  const normalizedSql = sqlText.replace(/\r\n/g, "\n");
  const sqlBody = normalizedSql.trim();
  const hasSql = sqlBody.length > 0;

  useEffect(() => {
    if (!isScheduleOpen) {
      return;
    }

    const handleClickAway = (event: MouseEvent) => {
      if (scheduleMenuRef.current && !scheduleMenuRef.current.contains(event.target as Node)) {
        setIsScheduleOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsScheduleOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClickAway);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handleClickAway);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isScheduleOpen]);

  const handleExport = async (frequencyCron?: string) => {
    const email = user?.email?.trim();
    const baseName = (message?.title ?? "DataVerse Export").trim() || "DataVerse Export";
    const uniqueName = `${baseName.slice(0, 200)}-${Date.now()}`.slice(0, 255);

    const payload = {
      name: uniqueName,
      description: "",
      query: sqlBody,
      format: "csv" as const,
      frequency_cron: frequencyCron ?? "",
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

  const handleScheduleSelect = (cron: string) => {
    setIsScheduleOpen(false);
    void handleExport(cron);
  };

  return (
    <aside className={panelClass}>
      <header className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="space-y-1">
          <h2 className="text-base font-semibold tracking-tight">Query details</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative" ref={scheduleMenuRef}>
            <button
              type="button"
              className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 transition hover:border-sky-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:border-sky-500 dark:hover:text-white"
              onClick={() => setIsScheduleOpen((prev) => !prev)}
              disabled={isExporting}
              aria-expanded={isScheduleOpen}
              aria-haspopup="menu"
            >
              Schedule
            </button>
            {isScheduleOpen ? (
              <div
                className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800"
                role="menu"
              >
                {scheduleOptions.map((option) => (
                  <button
                    key={option.cron}
                    type="button"
                    className="block w-full px-4 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-700"
                    onClick={() => handleScheduleSelect(option.cron)}
                    role="menuitem"
                    disabled={isExporting}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 transition hover:border-sky-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:border-sky-500 dark:hover:text-white"
            onClick={() => handleExport()}
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
          {hasSql ? (
            <div className="rounded-2xl border border-slate-200 bg-white/60 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:text-slate-200 dark:hover:text-white"
                onClick={() => setIsQueryExpanded((prev) => !prev)}
                aria-expanded={isQueryExpanded}
                aria-controls="response-panel-query"
              >
                <span>Query</span>
                <svg
                  className={combineClasses(
                    "h-4 w-4 text-slate-500 transition-transform duration-300 dark:text-slate-300",
                    isQueryExpanded ? "rotate-180" : ""
                  )}
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M5 8l5 5 5-5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <div
                id="response-panel-query"
                className={combineClasses(
                  "overflow-hidden transition-all duration-300 ease-out",
                  isQueryExpanded
                    ? "max-h-[80vh] border-t border-slate-200 opacity-100 dark:border-slate-800"
                    : "max-h-0 opacity-0"
                )}
                aria-hidden={!isQueryExpanded}
              >
                <div className="px-4 py-3">
                  <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-slate-700 dark:text-slate-200">{sqlBody}</pre>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/40 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
          Select a reply in the thread to see its full context here.
        </div>
      )}
    </aside>
  );
}
