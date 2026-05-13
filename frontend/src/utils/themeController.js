export const THEME_STORAGE_KEY = "aiia-theme";

const normalizeTheme = (value) => (value === "dark" ? "dark" : "light");

export function getStoredTheme() {
  if (typeof window === "undefined") return "light";
  return normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
}

export function setStoredTheme(theme, { emit = true } = {}) {
  if (typeof window === "undefined") return "light";
  const next = normalizeTheme(theme);
  window.localStorage.setItem(THEME_STORAGE_KEY, next);
  if (emit) {
    window.dispatchEvent(new CustomEvent("aiia:theme", { detail: { theme: next } }));
  }
  return next;
}

export function toggleStoredTheme() {
  const next = getStoredTheme() === "dark" ? "light" : "dark";
  return setStoredTheme(next);
}

export function subscribeTheme(handler) {
  if (typeof window === "undefined") return () => {};

  const syncFromEvent = (event) => {
    const fromDetail = event?.detail?.theme;
    if (fromDetail === "dark" || fromDetail === "light") {
      handler(fromDetail);
      return;
    }
    handler(getStoredTheme());
  };

  const onStorage = (event) => {
    if (event?.key !== THEME_STORAGE_KEY) return;
    handler(normalizeTheme(event?.newValue));
  };

  window.addEventListener("aiia:theme", syncFromEvent);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener("aiia:theme", syncFromEvent);
    window.removeEventListener("storage", onStorage);
  };
}
