export function Donut({ segments, total, size = 150, stroke = 18 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const arcs = segments.reduce((result, segment) => {
    const dash = (segment.value / total) * c;
    const offset = result.acc;
    result.acc += dash;
    result.items.push({ ...segment, dash, offset });
    return result;
  }, { acc: 0, items: [] }).items;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f0f0f1" strokeWidth={stroke} />
      {arcs.map((segment) => (
        <circle
          key={segment.color}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={segment.color}
          strokeWidth={stroke}
          strokeDasharray={`${segment.dash} ${c - segment.dash}`}
          strokeDashoffset={-segment.offset}
        />
      ))}
    </svg>
  );
}
