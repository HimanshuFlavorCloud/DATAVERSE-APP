import { MarkdownMessage } from "./MarkdownMessage";
import type { ChatMessage } from "../types/chat";
import { combineClasses } from "../utils/classes";

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
    "flex h-full flex-col gap-6 border-l border-slate-200 bg-white/90 p-6 shadow-card backdrop-blur overflow-y-auto dark:border-slate-800 dark:bg-slate-900/85",
    className
  );

  return (
    <aside className={panelClass}>
      <header className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="space-y-1">
          <h2 className="text-base font-semibold tracking-tight">Response details</h2>
          {message ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Insights for the selected reply.
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 transition hover:border-sky-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-sky-500 dark:hover:text-white"
          onClick={onClose}
        >
          Close
        </button>
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
            {message.tokens ? (
              <>
                <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span className="text-slate-600 dark:text-slate-300">{message.tokens} tokens</span>
              </>
            ) : null}
          </div>
          <MarkdownMessage content={message.content} />
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/40 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
          Select a reply in the thread to see its full context here.
        </div>
      )}
    </aside>
  );
}
