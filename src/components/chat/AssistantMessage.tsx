import type { ChatMessage } from "../../types/chat";
import { MessageLayout } from "./MessageLayout";

type AssistantMessageProps = {
  message: ChatMessage;
  onSelect?: (message: ChatMessage) => void;
};

export function AssistantMessage({ message, onSelect }: AssistantMessageProps) {
  return (
    <MessageLayout
      message={message}
      orientation="left"
      onSelect={onSelect}
    />
  );
}
