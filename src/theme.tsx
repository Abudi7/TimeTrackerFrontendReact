import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Theme = "light" | "dark" | "system";
type Resolved = "light" | "dark";

type ThemeCtx = {
  theme: Theme;
  resolved: Resolved;
  setTheme: (t: Theme) => void;
  cycle: () => void;
};

const ThemeContext = createContext<ThemeCtx | null>(null);

function resolveTheme(t: Theme): Resolved {
  if (t !== "system") return t;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem("theme") as Theme) || "system");

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const r = resolveTheme(theme);
      document.documentElement.setAttribute("data-bs-theme", r);
    };
    apply();
    mql.addEventListener?.("change", apply);
    return () => mql.removeEventListener?.("change", apply);
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("theme", t);
    const r = resolveTheme(t);
    document.documentElement.setAttribute("data-bs-theme", r);
  };

  const cycle = () => {
    setTheme(theme === "light" ? "dark" : theme === "dark" ? "system" : "light");
  };

  const resolved = resolveTheme(theme);

  const value = useMemo(() => ({ theme, resolved, setTheme, cycle }), [theme, resolved]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
