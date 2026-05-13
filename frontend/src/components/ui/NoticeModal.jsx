import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef } from "react";
import { X, XCircle, Info, CheckCircle2, AlertTriangle } from "lucide-react";
import "./NoticeModal.css";

export function NoticeModal({ isOpen, tone = "info", title, message, onClose }) {
  const closeButtonRef = useRef(null);

  const toneMeta = useMemo(() => {
    const normalized = String(tone || "info").toLowerCase();
    switch (normalized) {
      case "success":
        return { tone: "success", Icon: CheckCircle2, fallbackTitle: "Thành công" };
      case "warning":
        return { tone: "warning", Icon: AlertTriangle, fallbackTitle: "Cảnh báo" };
      case "danger":
      case "error":
        return { tone: "danger", Icon: XCircle, fallbackTitle: "Không thể thực hiện" };
      case "info":
      default:
        return { tone: "info", Icon: Info, fallbackTitle: "Thông báo" };
    }
  }, [tone]);

  const resolvedTitle = title || toneMeta.fallbackTitle;
  const resolvedMessage =
    message ||
    (toneMeta.tone === "danger"
      ? "Vui lòng kiểm tra lại điều kiện trước khi tiếp tục."
      : toneMeta.tone === "success"
        ? "Thao tác đã được thực hiện thành công."
        : toneMeta.tone === "warning"
          ? "Hãy kiểm tra lại thông tin trước khi tiếp tục."
          : "Tính năng này đang được phát triển. Bạn quay lại sau nhé.");

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus?.(), 0);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [isOpen, onClose]);

  const Icon = toneMeta.Icon;

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="notice-modal-overlay"
          role="presentation"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
        >
          <motion.section
            className={`notice-modal-card tone-${toneMeta.tone}`}
            role="dialog"
            aria-modal="true"
            aria-label={resolvedTitle}
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.985 }}
            transition={{ type: "spring", stiffness: 520, damping: 34, mass: 0.9 }}
          >
            <header className="notice-modal-head">
              <span className="notice-modal-icon" aria-hidden="true">
                <Icon className="h-5 w-5" />
              </span>
              <div className="notice-modal-title">
                <strong>{resolvedTitle}</strong>
                <p>{resolvedMessage}</p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                className="notice-modal-close"
                onClick={onClose}
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <footer className="notice-modal-footer">
              <button type="button" className="notice-modal-primary" onClick={onClose}>
                Đóng
              </button>
            </footer>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
