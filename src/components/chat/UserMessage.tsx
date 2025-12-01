import type { ChatMessage } from "../../types/chat";
import { MessageLayout } from "./MessageLayout";

type UserMessageProps = {
  message: ChatMessage;
  isSelected: boolean;
  onSelect: (message: ChatMessage) => void;
  userInitial: string;
};

export function UserMessage({ message, isSelected, onSelect, userInitial }: UserMessageProps) {
  return (
    <MessageLayout
      message={message}
      onSelect={onSelect}
      orientation="right"
    />
  );
}
