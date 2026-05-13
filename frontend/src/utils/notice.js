export function dispatchNotice(detail) {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent("aiia:notice", { detail }));
  } catch {
    // ignore
  }
}

