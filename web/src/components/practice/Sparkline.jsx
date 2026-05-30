export default function Sparkline({ points, pass }) {
  const W = 640, H = 120, pad = 16;
  if (points.length < 2) {
    return <div className="pe-spark-single">Single attempt: <strong>{points[0]}%</strong> — take another to see a trend.</div>;
  }
  const max = 100, min = 0;
  const x = (i) => pad + (i / (points.length - 1)) * (W - pad * 2);
  const y = (v) => pad + (1 - (v - min) / (max - min)) * (H - pad * 2);
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p)}`).join(" ");
  const passY = y(pass);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="pe-spark" preserveAspectRatio="none">
      <line x1={pad} x2={W - pad} y1={passY} y2={passY} stroke="var(--warn)" strokeWidth="1" strokeDasharray="4 4" opacity="0.7" />
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p)} r="4" fill={p >= pass ? "var(--ok)" : "var(--fail)"} stroke="var(--bg)" strokeWidth="2" />
      ))}
    </svg>
  );
}
