import { useMemo } from "react";
import { useTheme } from "../contexts/ThemeContext";

const LABELS: Record<"system" | "light" | "dark", string> = {
  system: "System",
  light: "Light",
  dark: "Dark"
};

export function ThemeToggle() {
  const { mode, resolvedMode, cycleMode } = useTheme();

  const hint = useMemo(() => {
    if (mode === "system") {
      return `System (${resolvedMode})`;
    }
    return LABELS[mode];
  }, [mode, resolvedMode]);

  return (
    <button
      type="button"
      onClick={cycleMode}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-sky-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-sky-500 dark:hover:text-white"
      title="Toggle theme"
      aria-label="Toggle theme"
    >
      <span
        className={
          resolvedMode === "dark"
            ? "h-2 w-2 rounded-full bg-slate-200"
            : "h-2 w-2 rounded-full bg-slate-500"
        }
        aria-hidden
      />
      {hint}
    </button>
  );
}
