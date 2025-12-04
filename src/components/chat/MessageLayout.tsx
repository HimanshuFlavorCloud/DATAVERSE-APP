import { MarkdownMessage } from "../MarkdownMessage";
import type { ChatMessage } from "../../types/chat";
import { combineClasses } from "../../utils/classes";

type MessageLayoutProps = {
  message: ChatMessage;
  orientation: "left" | "right";
  onSelect?: (message: ChatMessage) => void
};

export function MessageLayout({
  message,
  orientation,
  onSelect
}: MessageLayoutProps) {
  const containerClass = combineClasses(
    "group flex flex-col gap-4 rounded-3xl border border-transparent p-5 shadow-sm backdrop-blur transition flex-1",
    orientation === "left" ? "flex-row" : "flex-row-reverse text-right",
  );

  const bubbleClass = combineClasses(
    "flex min-w-0 flex-1 flex-col gap-3 rounded-2xl p-4 transition max-w-full sm:max-w-2xl lg:max-w-3xl",
    orientation === "left"
      ? "items-start self-start text-left"
      : "items-end self-end text-right"
  );

  const markdownAlignment = combineClasses(
    message.role === 'user' ? "py-0 px-4 border border-white rounded-[1rem_1rem_0_1rem]" : "",
    orientation === "left" ? undefined : "text-right prose-headings:text-right prose-p:text-right prose-ul:text-right prose-ol:text-right prose-li:text-right")

  const hasContent = Boolean(message.content?.trim());
  const hasResult = Boolean(message.result?.trim());

  return (
    <article
      className={containerClass}
      role="button"
      tabIndex={0}
      onClick={()=>onSelect?.(message)}
    >
      <div className={bubbleClass}>
        {hasContent ? (
          <MarkdownMessage content={message.content} className={markdownAlignment} />
        ) : null}
        {hasResult ? (
          <div className="w-full max-w-full">
            <MarkdownMessage
              content={message.result ?? ""}
              className={combineClasses(
                "!max-w-full text-xs leading-relaxed",
                orientation === "right"
                  ? "text-right prose-headings:text-right prose-p:text-right prose-ul:text-right prose-ol:text-right prose-li:text-right"
                  : undefined
              )}
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}

export type { MessageLayoutProps };
