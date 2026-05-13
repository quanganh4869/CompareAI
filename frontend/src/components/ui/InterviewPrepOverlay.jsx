import { useEffect, useMemo, useRef, useState } from "react";
import { BrainCircuit, CheckCircle2, LoaderCircle } from "lucide-react";
import "./InterviewPrepOverlay.css";
import { ThemeToggleButton } from "./ThemeToggleButton";

const DEFAULT_PREP_STEPS = [
  "Đọc ngữ cảnh CV và Job Description...",
  "Xác định các kỹ năng cần đào sâu...",
  "Đang sinh (Generate) câu hỏi tình huống...",
  "Đang thiết lập phòng phỏng vấn...",
];

const COMPLETE_DELAY_MS = 420;

export function InterviewPrepOverlay({ isOpen, steps = DEFAULT_PREP_STEPS, stepDuration = 1900, onComplete }) {
  const [completedCount, setCompletedCount] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const onCompleteRef = useRef(onComplete);
  const completionTimeoutRef = useRef(null);

  const resolvedSteps = useMemo(() => {
    if (!Array.isArray(steps) || !steps.length) {
      return DEFAULT_PREP_STEPS;
    }
    return steps;
  }, [steps]);

  const stepsKey = useMemo(() => resolvedSteps.join("|"), [resolvedSteps]);

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
      setActiveStep(0);
      return;
    }

    let currentStep = 0;
    setCompletedCount(0);
    setActiveStep(0);

    const stepTimer = setInterval(() => {
      currentStep += 1;
      setCompletedCount(currentStep);

      if (currentStep >= resolvedSteps.length) {
        setActiveStep(-1);
        clearInterval(stepTimer);
        completionTimeoutRef.current = setTimeout(() => {
          onCompleteRef.current?.();
        }, COMPLETE_DELAY_MS);
        return;
      }

      setActiveStep(currentStep);
    }, stepDuration);

    return () => {
      clearInterval(stepTimer);
    };
  }, [isOpen, stepDuration, stepsKey, resolvedSteps.length]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="interview-prep-overlay" role="dialog" aria-modal="true" aria-label="Đang chuẩn bị phòng phỏng vấn AI">
      <div className="fixed right-6 top-6 z-[1000]">
        <ThemeToggleButton compact />
      </div>
      <section className="interview-prep-card">
        <div className="interview-prep-core-shell" aria-hidden="true">
          <span className="interview-prep-ring ring-1" />
          <span className="interview-prep-ring ring-2" />
          <span className="interview-prep-ring ring-3" />

          <span className="interview-prep-node node-1" />
          <span className="interview-prep-node node-2" />
          <span className="interview-prep-node node-3" />
          <span className="interview-prep-node node-4" />

          <div className="interview-prep-core">
            <BrainCircuit className="interview-prep-core-icon" />
          </div>
        </div>

        <ul className="interview-prep-steps">
          {resolvedSteps.map((stepLabel, index) => {
            const isDone = index < completedCount;
            const isActive = index === activeStep && completedCount < resolvedSteps.length;

            return (
              <li key={stepLabel} className={`interview-prep-step ${isDone ? "done" : ""} ${isActive ? "active" : ""}`}>
                <span className="interview-prep-step-status">
                  {isDone ? (
                    <CheckCircle2 className="prep-icon-check" />
                  ) : isActive ? (
                    <LoaderCircle className="prep-icon-spin" />
                  ) : (
                    <i className="prep-icon-pending" />
                  )}
                </span>
                <span>{stepLabel}</span>
              </li>
            );
          })}
        </ul>

        <p className="interview-prep-tip">
          <strong>Mẹo (Tip):</strong> Hãy hít thở sâu, nhìn thẳng vào camera và trả lời thật tự tin nhé!
        </p>
      </section>
    </div>
  );
}
