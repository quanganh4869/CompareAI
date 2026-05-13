import { SCREEN_CONFIG } from "../../constants/navigation";

export function Stepper({ screens, active }) {
  return (
    <ol className="stepper" aria-label="Luồng chuẩn bị phỏng vấn">
      {screens.map((screen, index) => {
        const isActive = screen === active;
        const isDone = screens.indexOf(active) > index;
        return (
          <li
            key={screen}
            className={`step-item ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}
          >
            <span className="step-badge">{index + 1}</span>
            <span className="step-name">{SCREEN_CONFIG[screen].title}</span>
          </li>
        );
      })}
    </ol>
  );
}
