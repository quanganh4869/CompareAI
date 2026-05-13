export function SectionCard({ title, subtitle, children, action, className = "" }) {
  return (
    <article className={`section-card ${className}`.trim()}>
      <header className="section-card-head">
        <div>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {action}
      </header>
      <div className="min-w-0">{children}</div>
    </article>
  );
}
