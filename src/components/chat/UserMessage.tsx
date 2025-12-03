import type { ChatMessage } from "../../types/chat";
import { MessageLayout } from "./MessageLayout";

type UserMessageProps = {
  message: ChatMessage;
};

export function UserMessage({ message }: UserMessageProps) {
  return (
    <MessageLayout
      message={message}
      orientation="right"
    />
  );
}
