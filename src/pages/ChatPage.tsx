import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ResponsePanel } from "../components/ResponsePanel";
import { AssistantMessage } from "../components/chat/AssistantMessage";
import { AssistantTypingIndicator } from "../components/chat/AssistantTypingIndicator";
import { ChatHeader } from "../components/chat/ChatHeader";
import { UserMessage } from "../components/chat/UserMessage";
import { useAuth } from "../contexts/AuthContext";
import type { ChatMessage, ChatResponse } from "../types/chat";
import { createId } from "../utils/id";
import { combineClasses } from "../utils/classes";
import { CHAT_ENDPOINT, EXECUTE_QUERY_ENDPOINT } from "../config";

const now = () => new Date().toISOString();

const initialMessages: ChatMessage[] = [
	{
		id: createId(),
		role: "assistant",
		createdAt: now(),
		tokens: 386,
		title: "Welcome to DataVerse Chat",
		content: "Hi there! Ask me anything about your data pipelines.\n\nI can help you explore datasets, generate SQL, or summarize experiments."
	}
];

const STREAM_INTERVAL_MS = 50;
const CONTENT_CHUNK_SIZE = 10;
const DETAIL_CHUNK_SIZE = 10;
const RESULT_CHUNK_SIZE = 60;

function chunkByWhitespace(text: string, size: number): string[] {
	if (!text) {
		return [];
	}

	if (text.length <= size) {
		return [text];
	}

	const tokens = text.split(/(\s+)/);
	const chunks: string[] = [];
	let current = "";

	for (const token of tokens) {
		const nextCandidate = current + token;
		if (current && nextCandidate.length > size) {
			chunks.push(current);
			const trimmedToken = token.replace(/^\s+/, "");
			current = trimmedToken.length ? trimmedToken : token;
			continue;
		}

		current = nextCandidate;
	}

	if (current) {
		chunks.push(current);
	}

	return chunks;
}

function chunkPreservingNewlines(text: string, size: number): string[] {
	const lines = text.split(/(?<=\n)/);
	const chunks: string[] = [];
	let current = "";

	for (const line of lines) {
		if ((current + line).length > size && current) {
			chunks.push(current);
			current = line;
		} else {
			current += line;
		}
	}

	if (current) {
		chunks.push(current);
	}

	return chunks;
}

function buildMarkdownTable(rows: Array<Record<string, unknown>>): string {
	if (!Array.isArray(rows) || rows.length === 0) {
		return "No rows returned.";
	}

	const headers = Object.keys(rows[0] ?? {});
	if (headers.length === 0) {
		return "No fields available.";
	}

	const headerLine = `| ${headers.join(" | ")} |`;
	const separatorLine = `| ${headers.map(() => "---").join(" | ")} |`;
	const bodyLines = rows.map((row) => {
		const values = headers.map((header) => {
			const value = row?.[header];
			if (value === null || value === undefined) {
				return "";
			}
			if (typeof value === "object") {
				return JSON.stringify(value);
			}
			return String(value);
		});
		return `| ${values.join(" | ")} |`;
	});

	return [headerLine, separatorLine, ...bodyLines].join("\n");
}

export function ChatPage() {
	const { logout } = useAuth();
	const navigate = useNavigate();
	const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
	const [draft, setDraft] = useState("");
	const [isResponding, setIsResponding] = useState(false);
	const [selectedMessage, setSelectedMessage] = useState<ChatMessage | undefined>(undefined);
	const bottomRef = useRef<HTMLDivElement | null>(null);
	const streamTimersRef = useRef<Map<string, number>>(new Map());
	
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages.length]);

	useEffect(() => {
		if (!selectedMessage) {
			return;
		}

		// Keep the details panel synced with streaming updates.
		const refreshedSelection = messages.find((message) => message.id === selectedMessage.id);
		if (refreshedSelection && refreshedSelection !== selectedMessage) {
			setSelectedMessage(refreshedSelection);
		}
	}, [messages, selectedMessage]);

	useEffect(() => () => {
		streamTimersRef.current.forEach((timeoutId) => {
			window.clearTimeout(timeoutId);
		});
		streamTimersRef.current.clear();
	}, []);

	// Simulate assistant streaming by appending message content and details together on a timer.
	const streamAssistantMessage = useCallback(
		(messageId: string, contentChunks: string[], detailChunks: string[], resultChunks: string[] = []) => {
			if (contentChunks.length === 0 && detailChunks.length === 0 && resultChunks.length === 0) {
				return Promise.resolve();
			}

			const timers = streamTimersRef.current;
			const clearTimer = () => {
				const timeoutId = timers.get(messageId);
				if (timeoutId) {
					window.clearTimeout(timeoutId);
					timers.delete(messageId);
				}
			};

			return new Promise<void>((resolve) => {
				let contentIndex = 0;
				let detailIndex = 0;
				let resultIndex = 0;
				let finished = false;

				const complete = () => {
					if (finished) {
						return;
					}
					finished = true;
					clearTimer();
					resolve();
				};

				const tick = () => {
					const nextContentChunk = contentChunks[contentIndex];
					const nextDetailChunk = detailChunks[detailIndex];
					const nextResultChunk = resultChunks[resultIndex];
					const hasContent = typeof nextContentChunk === "string";
					const hasDetail = typeof nextDetailChunk === "string";
					const hasResult = typeof nextResultChunk === "string";

					if (!hasContent && !hasDetail && !hasResult) {
						complete();
						return;
					}

					setMessages((previousMessages) =>
						previousMessages.map((message) => {
							if (message.id !== messageId) {
								return message;
							}

							let nextMessage = message;

							if (hasContent) {
								nextMessage = {
									...nextMessage,
									content: `${nextMessage.content ?? ""}${nextContentChunk ?? ""}`
								};
							}

							if (hasDetail) {
								nextMessage = {
									...nextMessage,
									details: `${nextMessage.details ?? ""}${nextDetailChunk ?? ""}`
								};
							}

							if (hasResult) {
								nextMessage = {
									...nextMessage,
									result: `${nextMessage.result ?? ""}${nextResultChunk ?? ""}`
								};
							}

							return nextMessage;
						})
					);

					if (hasContent) {
						contentIndex += 1;
					}

					if (hasDetail) {
						detailIndex += 1;
					}

					if (hasResult) {
						resultIndex += 1;
					}

					window.requestAnimationFrame(() => {
						bottomRef.current?.scrollIntoView({ behavior: "smooth" });
					});

					const hasRemaining =
						contentIndex < contentChunks.length ||
						detailIndex < detailChunks.length ||
						resultIndex < resultChunks.length;
					if (!hasRemaining) {
						complete();
						return;
					}

					clearTimer();
					const timeoutId = window.setTimeout(tick, STREAM_INTERVAL_MS);
					timers.set(messageId, timeoutId);
				};

				clearTimer();
				tick();
			});
		},
		[bottomRef, setMessages]
	);

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
		setIsResponding(true);

		try {
			const reply = await fetch(CHAT_ENDPOINT, {
				method: "POST",
				body: JSON.stringify({
					question: userMessage.content
				}),
				credentials: "include"
			});
			setIsResponding(false);
			const data: ChatResponse = await reply.json();
			const assistantMessage: ChatMessage = {
				id: createId(),
				role: "assistant",
				content: "",
				details: data.sql ? "" : undefined,
				createdAt: now()
			};
			const summaryText = typeof data.md_summary === "string" ? data.md_summary : "";
			const rawSql = typeof data.sql === "string" ? data.sql : "";
			const normalizedSummary = summaryText.replace(/\r\n/g, "\n");
			const normalizedSql = rawSql.replace(/\r\n/g, "\n");

			const contentChunks = chunkByWhitespace(normalizedSummary, CONTENT_CHUNK_SIZE);
			const detailChunks = normalizedSql ? chunkPreservingNewlines(normalizedSql, DETAIL_CHUNK_SIZE) : [];

			setMessages((prev) => [...prev, assistantMessage]);
			if (rawSql.trim()) {
				setSelectedMessage(assistantMessage);
			}

			await streamAssistantMessage(assistantMessage.id, contentChunks, detailChunks);
			await handleQueryResult(data, assistantMessage.id);
		} catch (error) {
			console.error("Failed to fetch assistant response", error);
			setIsResponding(false);
		}
	};

	const handleQueryResult = async (data: ChatResponse, messageId: string) => {
		if (!data.sql) {
			return;
		}

		setMessages((previous) =>
			previous.map((message) =>
				message.id === messageId
					? {
						...message,
						result: ""
					}
					: message
			)
		);

		setIsResponding(true);

		try {
			const response = await fetch(EXECUTE_QUERY_ENDPOINT, {
				method: "POST",
				credentials: "include",
				body: JSON.stringify({ sql: data.sql })
			});
			setIsResponding(false);
			const fetchedData: unknown = await response.json();
			const resultPayload = fetchedData as { data?: unknown; row_count?: number };
			const rows = Array.isArray(resultPayload.data)
				? (resultPayload.data as Array<Record<string, unknown>>)
				: [];

			const tableMarkdown = buildMarkdownTable(rows);
			const infoLines: string[] = ["\n\n### Query Results"];
			if (typeof resultPayload.row_count === "number") {
				infoLines.push(`Rows returned: ${resultPayload.row_count}`);
			}
			infoLines.push(tableMarkdown);
			const tableSection = infoLines.join("\n");
			const tableChunks = chunkPreservingNewlines(tableSection, RESULT_CHUNK_SIZE);
			await streamAssistantMessage(messageId, [], [], tableChunks);
		} catch (error) {
			console.error("Failed to execute query", error);
			setMessages((previous) =>
				previous.map((message) =>
					message.id === messageId
						? {
							...message,
							result: "Failed to execute query. Please try again."
						}
						: message
				)
			);
			setIsResponding(false);
		}
	}

	const handleSend = async (event: FormEvent) => {
		event.preventDefault();
		await submitMessage();
	};

	const isPanelOpen = Boolean(selectedMessage);

	const handleNewChat = () => {
		setMessages(initialMessages);
		setSelectedMessage(undefined);
		setDraft("");
	};

	return (
		<div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
			<ChatHeader onLogout={handleLogout} onNewChat={handleNewChat} />

			{isPanelOpen ? (
				<div
					className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm lg:hidden"
					onClick={() => setSelectedMessage(undefined)}
				/>
			) : null}

			<div
				className={combineClasses(
					"flex flex-1 justify-center overflow-hidden transition-[padding] duration-300 ease-out",
					isPanelOpen ? "lg:pr-[32rem]" : ""
				)}
			>
				<main className="relative flex w-full max-w-[clamp(40rem,80%,80rem)] flex-1 overflow-hidden">
					<section aria-label="Chat thread" className="flex flex-1 flex-col">
						<div className="flex-1 scrollbar-none overflow-y-auto px-6 py-8 lg:px-10">
							<div className="flex flex-col gap-5">
								{messages.map((message) =>
									message.role === "assistant" ? (
										<AssistantMessage
											key={message.id}
											message={message}
											onSelect={setSelectedMessage}
										/>
									) : (
										<UserMessage
											key={message.id}
											message={message}
										/>
									)
								)}
								{isResponding ? <AssistantTypingIndicator /> : null}
								<div ref={bottomRef} />
							</div>
						</div>
						<form
							className="sticky bottom-6 mx-auto flex w-full items-end gap-4 rounded-3xl border border-slate-200 bg-white/95 px-4 py-4 shadow-card backdrop-blur dark:border-slate-700 dark:bg-slate-900/80"
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
							"pointer-events-none fixed bottom-0 right-0 z-40 flex h-[calc(100dvh-6rem)] w-full max-w-full transform transition-transform duration-300 ease-out sm:right-6 sm:w-[28rem] sm:max-w-[30rem] sm:rounded-3xl lg:right-10 lg:w-[30rem] xl:w-[32rem]",
							isPanelOpen ? "translate-x-0 pointer-events-auto" : "translate-x-full sm:translate-x-[calc(100%+1.5rem)]"
						)}
						aria-hidden={!isPanelOpen}
					>
						{selectedMessage ? (
							<ResponsePanel
								className="h-full w-full rounded-none border border-slate-200 bg-white/95 shadow-card dark:border-slate-800 dark:bg-slate-900/85 sm:rounded-3xl"
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
