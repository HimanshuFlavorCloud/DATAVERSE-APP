import classNames from "classnames";
import {
  type ComponentPropsWithoutRef,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownMessageProps = {
  content: string;
  className?: string;
};

type CodeBlockProps = ComponentPropsWithoutRef<"code"> & {
  inline?: boolean;
  lang?: string;
};
type TableProps = ComponentPropsWithoutRef<"table">;

const MarkdownCodeBlock = ({ inline, className: codeClassName, children, lang, ...props }: CodeBlockProps) => {
  if (inline) {
    return (
      <code
        className={classNames(
          "rounded-md bg-slate-200 px-1.5 py-0.5 font-mono text-[0.8rem] font-medium",
          "dark:bg-slate-800",
          codeClassName
        )}
        {...props}
      >
        {children}
      </code>
    );
  }

  const [copied, setCopied] = useState(false);
  const resetCopyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const codeContent = Array.isArray(children)
    ? children.join("")
    : typeof children === "string"
    ? children
    : String(children ?? "");
  const codeText = codeContent.replace(/\n$/, "");
  const languageMatch = codeClassName?.match(/language-([\w-]+)/);
  const language = lang ?? languageMatch?.[1] ?? "plaintext";

  const handleCopy = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);

      if (resetCopyTimeout.current) {
        clearTimeout(resetCopyTimeout.current);
      }

      resetCopyTimeout.current = setTimeout(() => {
        setCopied(false);
        resetCopyTimeout.current = null;
      }, 2000);
    } catch (error) {
      console.error("Failed to copy code snippet", error);
    }
  }, [codeText]);

  useEffect(() => {
    return () => {
      if (resetCopyTimeout.current) {
        clearTimeout(resetCopyTimeout.current);
      }
    };
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900/95 shadow-inner dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200/20 bg-slate-900/80 px-3 py-2 text-[0.7rem] font-medium uppercase tracking-wide text-slate-300">
        <span>{language}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded-md border border-slate-500/40 px-2 py-1 text-[0.65rem] text-slate-200 transition hover:border-sky-500/60 hover:text-sky-200 active:scale-95"
          aria-label="Copy code to clipboard"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className={classNames("overflow-x-auto p-4 text-xs", codeClassName)}>
        <code className="font-mono" {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
};

const markdownComponents: Components = {
  code: MarkdownCodeBlock,
  table({ className: tableClassName, ...props }: TableProps) {
    return (
      <div className="overflow-x-auto">
        <div className="min-w-full rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <table
            className={classNames(
              "min-w-full divide-y divide-slate-200 text-xs sm:text-sm dark:divide-slate-700",
              "[&>thead>tr>th]:bg-slate-50 [&>thead>tr>th]:px-4 [&>thead>tr>th]:py-3 [&>thead>tr>th]:text-left [&>thead>tr>th]:font-semibold [&>thead>tr>th]:uppercase [&>thead>tr>th]:tracking-wide [&>thead>tr>th]:text-slate-500 dark:[&>thead>tr>th]:bg-slate-900 dark:[&>thead>tr>th]:text-slate-300",
              "[&>tbody>tr]:odd:bg-slate-50/70 [&>tbody>tr]:even:bg-white [&>tbody>tr>td]:px-4 [&>tbody>tr>td]:py-2 [&>tbody>tr>td]:text-slate-600 dark:[&>tbody>tr]:odd:bg-slate-900/60 dark:[&>tbody>tr]:even:bg-slate-900/30 dark:[&>tbody>tr>td]:text-slate-200",
              "[&>tbody>tr:hover]:bg-sky-50/70 dark:[&>tbody>tr:hover]:bg-slate-800/50 transition-colors",
              tableClassName
            )}
            {...props}
          />
        </div>
      </div>
    );
  },
  a({ children, ...props }) {
    return (
      <a
        className="font-medium text-sky-600 hover:text-sky-500 dark:text-sky-400"
        rel="noreferrer"
        target="_blank"
        {...props}
      >
        {children}
      </a>
    );
  }
};

export function MarkdownMessage({ content, className }: MarkdownMessageProps) {
  return (
    <ReactMarkdown
      className={classNames(
        "prose prose-slate max-w-none text-sm leading-relaxed dark:prose-invert",
        "prose-headings:mt-4 prose-headings:font-semibold prose-p:my-3",
        "prose-ul:my-3 prose-ol:my-3 prose-pre:bg-slate-900/90 dark:prose-pre:bg-slate-900",
        className
      )}
      remarkPlugins={[remarkGfm]}
      components={markdownComponents}
    >
      {content}
    </ReactMarkdown>
  );
}
