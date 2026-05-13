export function MetricCard({ label, value, delta, tone = "default" }) {
  const toneClass = tone === "good" ? "metric-good" : "";

  return (
    <article className="metric-card">
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
      <span className={`metric-delta ${toneClass}`.trim()}>{delta}</span>
    </article>
  );
}
