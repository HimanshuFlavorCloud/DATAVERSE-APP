import { FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ResponsePanel } from "../components/ResponsePanel";
import { AssistantMessage } from "../components/chat/AssistantMessage";
import { AssistantTypingIndicator } from "../components/chat/AssistantTypingIndicator";
import { ChatHeader } from "../components/chat/ChatHeader";
import { UserMessage } from "../components/chat/UserMessage";
import { useAuth } from "../contexts/AuthContext";
import type { ChatMessage } from "../types/chat";
import { createId } from "../utils/id";
import { combineClasses } from "../utils/classes";

const now = () => new Date().toISOString();

const seededReplies = [
	"Sure! Here's a quick walkthrough of how to structure your dataset.\n\n1. **Collect** the raw files and keep them in a `/raw` folder.\n2. **Normalize** each record so that the fields match what your downstream model expects.\n3. **Version** the cleaned set and store the metadata in a small JSON manifest.\n\nLet me know if you want the manifest template as well!",
	"Absolutely! Here's the SQL query you asked for:\n\n```sql\nSELECT country, COUNT(*) as total_users\nFROM users\nWHERE created_at >= DATEADD(day, -30, CURRENT_DATE)\nGROUP BY country\nORDER BY total_users DESC;\n```\n\nThis groups the new users by country for the past 30 days.",
	"Here's a recap of the experiment run:\n\n- **Model:** gpt-4.1-mini\n- **Dataset:** curated/intent-detection-v5\n- **Outcome:** 92.4% accuracy on the holdout set\n- **Notes:** F1 dipped on the `transfer` intent; consider augmenting those examples.",
	"To containerize the service, add this Dockerfile snippet:\n\n```dockerfile\nFROM node:20-alpine\nWORKDIR /app\nCOPY package.json package-lock.json ./\nRUN npm ci\nCOPY . .\nCMD [ \"npm\", \"start\" ]\n```\n\nIt keeps the image lightweight while using the pinned dependency tree.",
	"Here's the markdown summary you asked me to sanitize:\n\n> DataVerse pipelines orchestrate ingestion, validation, and enrichment.\n> Each stage streams telemetry, so you can observe drift in real time.\n> Schedules are declarative YAML, so everything lives in Git."
];

function getAssistantReply(prompt: string): Promise<ChatMessage> {
	const syntheticContent = seededReplies[Math.floor(Math.random() * seededReplies.length)];
	const stitched = `I processed your request:\n\n> ${prompt}\n\n${syntheticContent}`;

	return new Promise((resolve) => {
		setTimeout(() => {
			resolve({
				id: createId(),
				role: "assistant",
				content: stitched,
				createdAt: now(),
				tokens: 512,
				title: stitched.split("\n")[0]?.replace(/^#+\s*/, "").slice(0, 50) ?? "Assistant reply"
			});
		}, 750);
	});
}

const initialMessages: ChatMessage[] = [
	{
		id: createId(),
		role: "assistant",
		createdAt: now(),
		tokens: 386,
		title: "Welcome to DataVerse Chat",
		content:
			"Hi there! Ask me anything about your data pipelines.\n\nI can help you explore datasets, generate SQL, or summarize experiments."
	}
];

export function ChatPage() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
	const [draft, setDraft] = useState("");
	const [isResponding, setIsResponding] = useState(false);
	const [selectedMessage, setSelectedMessage] = useState<ChatMessage | undefined>(undefined);
	const bottomRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages.length]);

	const handleLogout = () => {
		logout();
		navigate("/login", { replace: true });
	};

	const submitMessage = async () => {
		if (!draft.trim() || isResponding) {
			return;
		}

		const userMessage: ChatMessage = {
			id: createId(),
			role: "user",
			content: draft.trim(),
			createdAt: now(),
			title: draft.trim().slice(0, 60)
		};

		setMessages((prev) => [...prev, userMessage]);
		setDraft("");
		setSelectedMessage(userMessage);
		setIsResponding(true);

		try {
			const reply = await getAssistantReply(userMessage.content);
			setMessages((prev) => [...prev, reply]);
			setSelectedMessage(reply);
		} finally {
			setIsResponding(false);
		}
	};

	const handleSend = async (event: FormEvent) => {
		event.preventDefault();
		await submitMessage();
	};

	const userInitial = user?.name?.[0]?.toUpperCase() ?? "U";
	const isPanelOpen = Boolean(selectedMessage);

	return (
		<div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
			<ChatHeader onLogout={handleLogout} />

			{isPanelOpen ? (
				<div
					className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm lg:hidden"
					onClick={() => setSelectedMessage(undefined)}
				/>
			) : null}

			<div className="flex flex-1 justify-center overflow-hidden">
				<main className="relative flex w-full max-w-[72rem] flex-1 overflow-hidden">
					<section
						aria-label="Chat thread"
						className={combineClasses(
							"flex flex-1 flex-col transition-[margin-right] duration-300 ease-out",
							isPanelOpen ? "lg:mr-[28rem]" : ""
						)}
					>
						<div className="flex-1 scrollbar-none overflow-y-auto px-6 py-8 lg:px-10">
							<div className="flex flex-col gap-5">
								{messages.map((message) =>
									message.role === "assistant" ? (
										<AssistantMessage
											key={message.id}
											message={message}
											isSelected={selectedMessage?.id === message.id}
											onSelect={setSelectedMessage}
										/>
									) : (
										<UserMessage
											key={message.id}
											message={message}
											isSelected={selectedMessage?.id === message.id}
											onSelect={setSelectedMessage}
											userInitial={userInitial}
										/>
									)
								)}
								{isResponding ? <AssistantTypingIndicator /> : null}
								<div ref={bottomRef} />
							</div>
						</div>
						<form
							className="sticky bottom-6 mx-6 flex items-end gap-4 rounded-3xl border border-slate-200 bg-white/95 px-4 py-4 shadow-card backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 lg:mx-10"
							onSubmit={handleSend}
						>
							<textarea
								placeholder="Send a message..."
								value={draft}
								onChange={(event) => setDraft(event.currentTarget.value)}
								rows={1}
								className="h-12 max-h-[36vh] flex-1 resize-none border-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 dark:text-slate-100"
								onKeyDown={(event) => {
									if (event.key === "Enter" && !event.shiftKey) {
										event.preventDefault();
										void submitMessage();
									}
								}}
							/>
							<button
								type="submit"
								className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-600 text-white shadow-lg transition hover:from-sky-400 hover:to-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60 dark:from-sky-500 dark:via-sky-600 dark:to-sky-700"
								disabled={isResponding || !draft.trim()}
							>
								<span className="sr-only">Send message</span>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 16 16"
									className="h-4 w-4"
									fill="currentColor"
								>
									<path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z" />
								</svg>
							</button>
						</form>
					</section>

					<div
						className={combineClasses(
							"pointer-events-none absolute inset-y-0 right-0 flex w-full max-w-full transform transition-transform duration-300 ease-out sm:max-w-[26rem]",
							isPanelOpen ? "translate-x-0 pointer-events-auto" : "translate-x-full"
						)}
						aria-hidden={!isPanelOpen}
					>
						{selectedMessage ? (
							<ResponsePanel
								className="h-full w-full"
								message={selectedMessage}
								onClose={() => setSelectedMessage(undefined)}
							/>
						) : null}
					</div>
				</main>
			</div>
		</div>
	);
}
