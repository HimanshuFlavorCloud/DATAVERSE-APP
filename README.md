# DataVerse Chat

A React + Vite playground that mimics a ChatGPT-style experience with gated login and a response inspector panel.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:5173. You must sign in before accessing the chat. Credentials are not validated against a backend; any email/password pair will work.

## Key features

- **Login gate** via context + protected routes; session is persisted in `localStorage`.
- **Chat interface** inspired by ChatGPT with markdown rendering and typing indicator.
- **Inspector panel** on the right that expands when you select an assistant reply.
- **Tailwind-powered theming** that defaults to the system preference with a quick toggle for Light or Dark modes.
- **Responsive layout** that turns the inspector into an overlay on smaller screens.
- **Mock AI replies** generated locally so you can iterate without an API key yet.

## Next steps

- Replace the mock reply generator with your backend or OpenAI API call.
- Wire up conversation persistence and history list.
- Add streaming UI by progressively appending assistant tokens.
