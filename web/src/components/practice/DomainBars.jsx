import { DOMAINS } from '../../data/index';

export default function DomainBars({ perDomain, compact = false }) {
  return (
    <div className={`pe-dbars ${compact ? "is-compact" : ""}`}>
      {DOMAINS.map((d) => {
        const r = perDomain[d.id] || { correct: 0, total: 0 };
        const pct = r.total ? Math.round((r.correct / r.total) * 100) : 0;
        return (
          <div key={d.id} className="pe-dbar-row">
            <span className={`pe-dbar-tag dtag-${d.color}`}>
              <span className="pe-dbar-dot" />D{d.num}
            </span>
            <span className="pe-dbar-name">{d.short}</span>
            <div className="pe-dbar-track">
              <div className={`pe-dbar-fill dtag-${d.color}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="pe-dbar-val">{r.correct}/{r.total}</span>
          </div>
        );
      })}
    </div>
  );
}
