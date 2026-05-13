import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { getStoredTheme, subscribeTheme, toggleStoredTheme } from "../../utils/themeController";

export function ThemeToggleButton({ className = "", compact = false }) {
  const [theme, setTheme] = useState(getStoredTheme);
  const isDark = theme === "dark";

  useEffect(() => {
    return subscribeTheme(setTheme);
  }, []);

  const toggle = () => {
    const next = toggleStoredTheme();
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={[
        "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-black shadow-sm transition",
        isDark
          ? "border-slate-700/60 bg-slate-950/40 text-slate-100 hover:bg-slate-950/55"
          : "border-slate-200 bg-white/90 text-slate-900 hover:bg-white",
        compact ? "h-10 px-3" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={isDark ? "Chuyển sang Light Mode" : "Chuyển sang Dark Mode"}
      title={isDark ? "Light Mode" : "Dark Mode"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className={compact ? "hidden sm:inline" : ""}>{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}
