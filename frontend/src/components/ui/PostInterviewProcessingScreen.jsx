import { useEffect, useMemo, useRef, useState } from "react";
import { AudioLines, BrainCircuit, CheckCircle2, LoaderCircle, Video } from "lucide-react";
import "./PostInterviewProcessingScreen.css";
import { ThemeToggleButton } from "./ThemeToggleButton";

const DEFAULT_TASKS = [
  {
    id: "audio-processing",
    title: "Audio Processing",
    subtext: "Đang chuyển đổi giọng nói thành văn bản (Speech-to-Text)...",
    icon: AudioLines,
  },
  {
    id: "video-analysis",
    title: "Video Analysis",
    subtext: "Đang phân tích biểu cảm và thái độ...",
    icon: Video,
  },
  {
    id: "logic-evaluation",
    title: "Logic Evaluation",
    subtext: "Đang chấm điểm chuyên môn và độ logic...",
    icon: BrainCircuit,
  },
];

const COMPLETE_DELAY_MS = 650;

export function PostInterviewProcessingScreen({
  isOpen,
  onComplete,
  tasks = DEFAULT_TASKS,
  taskDuration = 1800,
}) {
  const [completedCount, setCompletedCount] = useState(0);
  const onCompleteRef = useRef(onComplete);
  const completionTimeoutRef = useRef(null);

  const resolvedTasks = useMemo(() => {
    if (!Array.isArray(tasks) || !tasks.length) {
      return DEFAULT_TASKS;
    }
    return tasks;
  }, [tasks]);

  const tasksKey = useMemo(() => resolvedTasks.map((task) => task.id).join("|"), [resolvedTasks]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    return () => {
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (completionTimeoutRef.current) {
      clearTimeout(completionTimeoutRef.current);
      completionTimeoutRef.current = null;
    }

    if (!isOpen) {
      setCompletedCount(0);
      return;
    }

    let nextCompleted = 0;
    setCompletedCount(0);

    const taskTimer = setInterval(() => {
      nextCompleted += 1;
      setCompletedCount(nextCompleted);

      if (nextCompleted >= resolvedTasks.length) {
        clearInterval(taskTimer);
        completionTimeoutRef.current = setTimeout(() => {
          onCompleteRef.current?.();
        }, COMPLETE_DELAY_MS);
      }
    }, taskDuration);

    return () => clearInterval(taskTimer);
  }, [isOpen, taskDuration, tasksKey, resolvedTasks.length]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="post-processing-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="AI đang tổng hợp kết quả phỏng vấn"
    >
      <div className="fixed right-6 top-6 z-[1000]">
        <ThemeToggleButton compact />
      </div>
      <section className="post-processing-card">
        <h2 className="post-processing-title">AI đang tổng hợp kết quả phỏng vấn của bạn...</h2>

        <div className="post-processing-grid">
          {resolvedTasks.map((task, index) => {
            const Icon = task.icon;
            const isDone = index < completedCount;
            const isActive = index === completedCount && completedCount < resolvedTasks.length;
            return (
              <article
                key={task.id}
                className={`post-processing-task ${isDone ? "done" : ""} ${isActive ? "active" : ""}`}
              >
                <header>
                  <span className="post-processing-task-icon">
                    <Icon className="h-4 w-4" />
                  </span>
                  <strong>{task.title}</strong>
                  <span className="post-processing-task-state">
                    {isDone ? (
                      <CheckCircle2 className="state-check" />
                    ) : (
                      <LoaderCircle className="state-spinner" />
                    )}
                  </span>
                </header>
                <p>{task.subtext}</p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
