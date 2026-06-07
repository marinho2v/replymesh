export function Badge({ tone = "gray", children, dot = true }) {
  return (
    <span className={`badge ${tone}`}>
      {dot && <span className="bd" />}
      {children}
    </span>
  );
}
