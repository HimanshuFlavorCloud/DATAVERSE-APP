import type { ChatMessage } from "../../types/chat";
import { MessageLayout } from "./MessageLayout";

type AssistantMessageProps = {
  message: ChatMessage;
  isSelected: boolean;
  onSelect: (message: ChatMessage) => void;
};

export function AssistantMessage({ message, isSelected, onSelect }: AssistantMessageProps) {
  return (
    <MessageLayout
      message={message}
      onSelect={onSelect}
      orientation="left"
    />
  );
}
