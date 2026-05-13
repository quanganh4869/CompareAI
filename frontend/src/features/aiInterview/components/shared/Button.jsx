import { Children, isValidElement } from "react";

function collectText(node, out) {
  if (node == null || typeof node === "boolean") {
    return;
  }
  if (typeof node === "string" || typeof node === "number") {
    out.push(String(node));
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((child) => collectText(child, out));
    return;
  }
  if (isValidElement(node)) {
    collectText(node.props?.children, out);
  }
}

function extractTooltip(children) {
  const parts = [];
  collectText(children, parts);
  const text = parts.join(" ").replace(/\s+/g, " ").trim();
  return text || "";
}

export function Button({
  children,
  variant = "primary",
  onClick,
  className = "",
  disabled = false,
  comingSoon = false,
  soonTitle,
  soonMessage,
  type = "button",
  dataTip,
  ...rest
}) {
  const autoTip = extractTooltip(children);
  const resolvedTip = dataTip ?? (autoTip ? autoTip : undefined);
  const isBlocked = Boolean(comingSoon);

  const dispatchNotice = (detail) => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.dispatchEvent(new CustomEvent("aiia:notice", { detail }));
    } catch {
      // ignore
    }
  };

  const handleClick = (event) => {
    if (isBlocked) {
      event.preventDefault();
      event.stopPropagation();
      dispatchNotice({
        tone: "info",
        title: soonTitle || "Coming soon",
        message: soonMessage || "Tính năng này đang được phát triển. Bạn quay lại sau nhé.",
      });
      return;
    }
    onClick?.(event);
  };

  return (
    <button
      type={type}
      className={`btn btn-${variant} ${className} ${isBlocked ? "is-disabled" : ""}`}
      onClick={handleClick}
      disabled={disabled && !isBlocked}
      aria-disabled={isBlocked ? "true" : undefined}
      data-tip={resolvedTip}
      {...rest}
    >
      {children}
    </button>
  );
}
