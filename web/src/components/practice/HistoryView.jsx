import { PASS_PCT } from '../../data/practiceQuestions';
import Sparkline from './Sparkline';

export function fmtDate(ms) {
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function HistoryView({ attempts, onOpen, onStart }) {
  if (!attempts.length) {
    return (
      <div className="card pe-empty pe-empty-lg">
        <div className="pe-empty-glyph">≋</div>
        <div className="pe-empty-title">No attempts yet</div>
        <div className="pe-empty-sub">Your timed and practice runs will appear here with a score trend over time.</div>
        <button className="primary-btn" onClick={onStart}>Start your first run →</button>
      </div>
    );
  }
  const ordered = attempts.slice().sort((a, b) => a.submittedAt - b.submittedAt);
  const pts = ordered.map((a) => a.score.pct);
  return (
    <div className="pe-history">
      <div className="card pe-trend">
        <div className="card-head"><h3>Score trend</h3><span className="muted-xs">{attempts.length} attempts · pass line {PASS_PCT}%</span></div>
        <Sparkline points={pts} pass={PASS_PCT} />
      </div>
      <div className="card pe-hist-list">
        <div className="card-head"><h3>All attempts</h3></div>
        <div className="pe-hist-rows">
          <div className="pe-hist-headrow">
            <span>Mode</span><span>Score</span><span>Result</span><span>Date</span><span></span>
          </div>
          {attempts.slice().sort((a, b) => b.submittedAt - a.submittedAt).map((a, ri) => (
            <button key={a.id || ri} className="pe-hist-row" onClick={() => onOpen(a)}>
              <span className={`pe-hist-mode mode-${a.mode}`}>{a.mode === "timed" ? "Timed" : "Practice"}</span>
              <span className="pe-hist-score" style={{ color: a.score.pass ? "var(--ok)" : "var(--fail)" }}>{a.score.pct}%</span>
              <span><span className={`pe-pill ${a.score.pass ? "pass" : "fail"}`}>{a.score.pass ? "Pass" : "Fail"}</span></span>
              <span className="pe-hist-date">{fmtDate(a.submittedAt)}</span>
              <span className="pe-hist-go">Review →</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
