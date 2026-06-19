"use client";

import { useCallback, useEffect, useState } from "react";

type Theme = "light" | "dark";

/** Light/dark toggle. The pre-paint class is set by an inline script in the
 *  root layout; this hook keeps it in sync and persists the choice. */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    setThemeState(
      document.documentElement.classList.contains("dark") ? "dark" : "light",
    );
  }, []);

  const setTheme = useCallback((t: Theme) => {
    document.documentElement.classList.toggle("dark", t === "dark");
    try {
      localStorage.setItem("pos-theme", t);
    } catch {
      // ignore storage errors
    }
    setThemeState(t);
  }, []);

  const toggle = useCallback(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "light" : "dark");
  }, [setTheme]);

  return { theme, setTheme, toggle };
}
