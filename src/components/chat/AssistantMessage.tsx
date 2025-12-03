import type { ChatMessage } from "../../types/chat";
import { MessageLayout } from "./MessageLayout";

type AssistantMessageProps = {
  message: ChatMessage;
};

export function AssistantMessage({ message}: AssistantMessageProps) {
  return (
    <MessageLayout
      message={message}
      orientation="left"
    />
  );
}
