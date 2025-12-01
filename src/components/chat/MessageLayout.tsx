import { MarkdownMessage } from "../MarkdownMessage";
import type { ChatMessage } from "../../types/chat";
import { combineClasses } from "../../utils/classes";

type MessageLayoutProps = {
  message: ChatMessage;
  onSelect: (message: ChatMessage) => void;
  orientation: "left" | "right";
};

export function MessageLayout({
  message,
  onSelect,
  orientation
}: MessageLayoutProps) {
  const containerClass = combineClasses(
    "group flex gap-4 rounded-3xl border border-transparent p-5 shadow-sm backdrop-blur transition flex-1",
    orientation === "left" ? "flex-row" : "flex-row-reverse text-right",
  );

  const bubbleClass = combineClasses(
    "flex min-w-0 flex-1 flex-col gap-3 rounded-2xl p-4 transition",
    orientation === "left" ? "items-start text-left" : "items-end text-right"
  );

	const markdownAlignment = combineClasses(
		message.role === 'user' ? "py-0 px-4 border border-white rounded-[1rem_1rem_0_1rem]" : "",
		orientation === "left" ? undefined : "text-right prose-headings:text-right prose-p:text-right prose-ul:text-right prose-ol:text-right prose-li:text-right")

  return (
    <article
      className={containerClass}
      onClick={() => onSelect(message)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          onSelect(message);
        }
      }}
    >
      <div className={bubbleClass}>
        <MarkdownMessage content={message.content} className={markdownAlignment} />
      </div>
    </article>
  );
}

export type { MessageLayoutProps };
