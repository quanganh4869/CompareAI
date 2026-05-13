export function Pill({ children, tone = "default", className = "" }) {
  const toneClass = `pill-${tone}`;

  return (
    <span className={`pill ${toneClass} ${className}`.trim()}>
      {children}
    </span>
  );
}
