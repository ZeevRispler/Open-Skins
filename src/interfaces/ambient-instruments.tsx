/** Decorative hardware follows agent activity without inventing telemetry. */
export function AmbientInstruments() {
  return (
    <aside className="ambient-instruments" aria-hidden="true">
      <div className="ambient-meter">
        <i />
        <span>◦ ◦ ◦</span>
      </div>
      <div className="ambient-compass">
        <i />
      </div>
      <div className="ambient-levels">
        {Array.from({ length: 8 }, (_, i) => (
          <i key={i} style={{ animationDelay: `${i * -0.15}s` }} />
        ))}
      </div>
      <div className="ambient-patch">
        <i />
        <i />
        <i />
      </div>
      <small>DECORATIVE</small>
    </aside>
  );
}
