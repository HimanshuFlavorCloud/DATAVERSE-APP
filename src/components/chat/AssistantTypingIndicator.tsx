export function AssistantTypingIndicator() {
	return (
		<svg width="48" height="24" viewBox="0 0 48 24" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Loading">
			<title>Loading</title>
			<circle cx="12" cy="12" r="4" fill="#6b7280">
				<animate attributeName="cy" dur="0.9s" values="12;6;12" keyTimes="0;0.5;1" repeatCount="indefinite" />
			</circle>
			<circle cx="24" cy="12" r="4" fill="#6b7280">
				<animate attributeName="cy" dur="0.9s" values="12;6;12" keyTimes="0;0.5;1" begin="0.3s" repeatCount="indefinite" />
			</circle>
			<circle cx="36" cy="12" r="4" fill="#6b7280">
				<animate attributeName="cy" dur="0.9s" values="12;6;12" keyTimes="0;0.5;1" begin="0.6s" repeatCount="indefinite" />
			</circle>
		</svg>
	);
}
