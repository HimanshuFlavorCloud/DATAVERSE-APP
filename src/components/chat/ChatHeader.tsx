import { ThemeToggle } from "../ThemeToggle";
import { useAuth } from "../../contexts/AuthContext";

export type ChatHeaderProps = {
  onLogout: () => void;
};

export function ChatHeader({ onLogout }: ChatHeaderProps) {
  const { user } = useAuth();
  const userInitial = user?.name?.[0]?.toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white/70 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/15 text-xs font-semibold uppercase tracking-[0.18em] text-sky-600 dark:bg-sky-500/25 dark:text-sky-300">
          DV
        </div>
        <p className="text-sm font-semibold">DataVerse Chat</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <ThemeToggle />
        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/20 text-sm font-semibold text-sky-600 dark:bg-sky-500/30 dark:text-sky-200">
            {userInitial}
          </div>
          <div className="hidden min-w-[8rem] flex-col leading-tight sm:flex">
            <span className="font-medium text-slate-700 dark:text-slate-200">{user?.name ?? "User"}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</span>
          </div>
          <button
            type="button"
            className="rounded-full border border-transparent px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-sky-300 hover:text-slate-900 dark:text-slate-300 dark:hover:border-sky-600 dark:hover:text-white"
            onClick={onLogout}
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
