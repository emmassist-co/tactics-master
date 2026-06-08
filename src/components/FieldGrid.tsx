export function FieldGrid() {
  const columns = Array.from({ length: 13 }, (_, index) => index);
  const rows = Array.from({ length: 9 }, (_, index) => index);
  return (
    <div className="field-grid" aria-hidden="true">
      {columns.map((column) => (
        <span key={`column-${column}`} className="field-line vertical" style={{ left: `${(column / 12) * 100}%` }} />
      ))}
      {rows.map((row) => (
        <span key={`row-${row}`} className="field-line horizontal" style={{ top: `${(row / 8) * 100}%` }} />
      ))}
      <span className="center-circle" />
      <span className="goal-mouth goal-mouth-home" />
      <span className="goal-mouth goal-mouth-away" />
      <span className="penalty-box penalty-box-home" />
      <span className="penalty-box penalty-box-away" />
    </div>
  );
}
