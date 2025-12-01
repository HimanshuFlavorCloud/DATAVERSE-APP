import classNames from "classnames";
import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownMessageProps = {
  content: string;
  className?: string;
};

type CodeBlockProps = ComponentPropsWithoutRef<"code"> & { inline?: boolean };
type TableProps = ComponentPropsWithoutRef<"table">;

const markdownComponents: Components = {
  code({ inline, className: codeClassName, children, ...props }: CodeBlockProps) {
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

    return (
      <pre
        className={classNames(
          "overflow-x-auto rounded-2xl border border-slate-200 bg-slate-900/95 p-4 text-xs",
          "shadow-inner dark:border-slate-700 dark:bg-slate-900",
          codeClassName
        )}
      >
        <code className="font-mono" {...props}>
          {children}
        </code>
      </pre>
    );
  },
  table({ className: tableClassName, ...props }: TableProps) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
        <table
          className={classNames(
            "min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700",
            tableClassName
          )}
          {...props}
        />
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
