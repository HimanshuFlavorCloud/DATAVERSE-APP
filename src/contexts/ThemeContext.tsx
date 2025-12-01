import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "system" | "light" | "dark";

type ThemeContextValue = {
  mode: Theme;
  resolvedMode: "light" | "dark";
  setMode: (mode: Theme) => void;
  cycleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "dataverse-chat-theme";

function resolveMode(mode: Theme, systemPrefersDark: boolean): "light" | "dark" {
  if (mode === "system") {
    return systemPrefersDark ? "dark" : "light";
  }
  return mode;
}

function getStoredMode(): Theme | null {
  if (typeof window === "undefined") {
    return null;
  }
  const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (!stored || !["system", "light", "dark"].includes(stored)) {
    return null;
  }
  return stored;
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<Theme>(() => getStoredMode() ?? "system");
  const [isDarkPreferred, setIsDarkPreferred] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)").matches : false
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (event: MediaQueryListEvent) => setIsDarkPreferred(event.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  const resolvedMode = useMemo(() => resolveMode(mode, isDarkPreferred), [mode, isDarkPreferred]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const root = document.documentElement;
    root.classList.toggle("dark", resolvedMode === "dark");
    root.setAttribute("data-theme", resolvedMode);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, mode);
    }
  }, [mode, resolvedMode]);

  const value = useMemo<ThemeContextValue>(() => {
    const cycleMode = () => {
      setMode((current) => {
        if (current === "system") return "light";
        if (current === "light") return "dark";
        return "system";
      });
    };

    const updateMode = (next: Theme) => setMode(next);

    return {
      mode,
      resolvedMode,
      setMode: updateMode,
      cycleMode
    };
  }, [mode, resolvedMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
