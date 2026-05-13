import { useEffect, useMemo, useState } from "react";
import { FileText } from "lucide-react";
import "./LoadingModal.css";
import { ThemeToggleButton } from "./ThemeToggleButton";

const DEFAULT_STATUS_MESSAGES = [
  "Đang bóc tách dữ liệu CV của bạn...",
  "Đang đối chiếu với yêu cầu từ Job Description...",
  "Đang phân tích kỹ năng chuyên môn...",
  "Đang tính toán độ tương thích (Match Score)...",
];

export function LoadingModal({
  isOpen,
  statuses = DEFAULT_STATUS_MESSAGES,
  dismissible = false,
  onClose,
}) {
  const [statusIndex, setStatusIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [progress, setProgress] = useState(6);

  const currentStatus = useMemo(() => {
    if (!statuses.length) {
      return "";
    }
    return statuses[statusIndex % statuses.length];
  }, [statusIndex, statuses]);

  useEffect(() => {
    if (!isOpen) {
      setStatusIndex(0);
      setTypedText("");
      setProgress(6);
      return;
    }

    setStatusIndex(0);
    setProgress(6);

    const statusTimer = setInterval(() => {
      setStatusIndex((previous) => {
        if (!statuses.length) {
          return 0;
        }
        return (previous + 1) % statuses.length;
      });
    }, 2000);

    const progressTimer = setInterval(() => {
      setProgress((previous) => {
        if (previous >= 99) {
          return 99;
        }
        const remaining = 99 - previous;
        const delta = Math.max(0.08, remaining * 0.04);
        return Number(Math.min(99, previous + delta).toFixed(2));
      });
    }, 120);

    return () => {
      clearInterval(statusTimer);
      clearInterval(progressTimer);
    };
  }, [isOpen, statuses]);

  useEffect(() => {
    if (!isOpen) {
      setTypedText("");
      return;
    }

    let nextCharIndex = 0;
    setTypedText("");

    const typingTimer = setInterval(() => {
      nextCharIndex += 1;
      setTypedText(currentStatus.slice(0, nextCharIndex));
      if (nextCharIndex >= currentStatus.length) {
        clearInterval(typingTimer);
      }
    }, 26);

    return () => clearInterval(typingTimer);
  }, [currentStatus, isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="ai-loading-modal-overlay"
      onClick={() => {
        if (dismissible && onClose) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div className="fixed right-6 top-6 z-[1000]">
        <ThemeToggleButton compact />
      </div>
      <section
        className="ai-loading-modal-card"
        role="dialog"
        aria-modal="true"
        aria-label="Đang xử lý bằng AI"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="ai-loading-graphic">
          <div className="ai-loading-document">
            <FileText className="doc-icon" />
            <span className="doc-line first" />
            <span className="doc-line second" />
            <span className="doc-line third" />
            <span className="scan-line" />
          </div>
        </div>

        <p className="ai-loading-status">
          <span>{typedText}</span>
          <i className="typing-caret" />
        </p>

        <div className="ai-loading-progress">
          <span style={{ width: `${progress}%` }} />
        </div>
      </section>
    </div>
  );
}
