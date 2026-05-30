export default function ScoreRing({ pct, pass, size = 132, label = true }) {
  const r = (size - 20) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  const stroke = pass ? "var(--ok)" : "var(--fail)";
  return (
    <div className="pe-ring" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-2)" strokeWidth="10" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={stroke} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset .5s ease" }}
        />
      </svg>
      {label ? (
        <div className="pe-ring-lab">
          <div className="pe-ring-num" style={{ color: stroke }}>{pct}%</div>
          <div className={`pe-ring-tag ${pass ? "is-pass" : "is-fail"}`}>{pass ? "PASS" : "FAIL"}</div>
        </div>
      ) : null}
    </div>
  );
}
