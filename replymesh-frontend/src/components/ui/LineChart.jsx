import { useLayoutEffect, useRef, useState } from "react";

export function LineChart({ data, height = 250, format = (v) => v }) {
  const [hover, setHover] = useState(null);
  const [w, setW] = useState(0);
  const wrapRef = useRef(null);
  const pad = { l: 38, r: 14, t: 16, b: 28 };

  useLayoutEffect(() => {
    const measure = () => {
      if (wrapRef.current) setW(wrapRef.current.clientWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  if (w === 0) return <div ref={wrapRef} style={{ width: "100%", height }} />;

  const max = Math.max(...data.map((d) => d.v), 1) * 1.12;
  const iw = w - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const xs = (i) => pad.l + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const ys = (v) => pad.t + ih - (v / max) * ih;
  const pts = data.map((d, i) => [xs(i), ys(d.v)]);
  let path = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i += 1) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    path += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  const area = `${path} L ${pts[pts.length - 1][0]} ${pad.t + ih} L ${pts[0][0]} ${pad.t + ih} Z`;

  const onMove = (event) => {
    const rect = wrapRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    let best = 0;
    let distance = Infinity;
    pts.forEach((p, i) => {
      const d = Math.abs(p[0] - x);
      if (d < distance) {
        distance = d;
        best = i;
      }
    });
    setHover(best);
  };

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%", overflow: "hidden" }} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <svg width={w} height={height} style={{ display: "block", overflow: "hidden" }}>
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#18181b" stopOpacity="0.09" />
            <stop offset="100%" stopColor="#18181b" stopOpacity="0" />
          </linearGradient>
        </defs>
        {Array.from({ length: 6 }).map((_, i) => {
          const v = (max / 5) * i;
          const y = ys(v);
          return (
            <g key={i}>
              <line x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="#f0f0f1" strokeWidth="1" />
              <text x={pad.l - 8} y={y + 3.5} textAnchor="end" fontSize="11" fill="#a1a1aa" className="mono">
                {v >= 1000 ? `${Math.round(v / 1000)}k` : Math.round(v)}
              </text>
            </g>
          );
        })}
        <path d={area} fill="url(#lg)" />
        <path d={path} fill="none" stroke="#18181b" strokeWidth="2.4" />
        {data.map((d, i) => (
          <text key={d.l} x={xs(i)} y={height - 6} textAnchor="middle" fontSize="11.5" fill="#a1a1aa">
            {d.l}
          </text>
        ))}
        {hover !== null && (
          <g>
            <line x1={pts[hover][0]} y1={pad.t} x2={pts[hover][0]} y2={pad.t + ih} stroke="#d4d4d8" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx={pts[hover][0]} cy={pts[hover][1]} r="5.5" fill="#18181b" stroke="#fff" strokeWidth="2.5" />
          </g>
        )}
      </svg>
      {hover !== null && (
        <div className="chart-tip" style={{ left: pts[hover][0], top: pts[hover][1] }}>
          <div className="d">{data[hover].l}</div>
          <div className="v">{format(data[hover].v)}</div>
        </div>
      )}
    </div>
  );
}
