import { useState } from 'react';
import { PASS_PCT } from '../../lib/practiceEngine';
import { DOMAINS } from '../../data/index';
import ScoreRing from './ScoreRing';
import DomainBars from './DomainBars';
import DomainChip from './DomainChip';

export default function ResultsReview({ attempt, posted, onPost, onRetake, onHome, onLeaderboard }) {
  const [filter, setFilter] = useState("all");
  const score = attempt.score;
  const isTimed = attempt.mode === "timed";
  const letters = ["A", "B", "C", "D"];

  // Timed attempts persisted to Firestore store only the score summary (the
  // question instances carry the answer key and are intentionally not saved), so
  // a timed attempt reopened from History has no per-question detail to rebuild.
  const instances = attempt.instances ?? [];
  const hasDetail = instances.length > 0;

  const rows = instances.map((inst, i) => {
    if (isTimed) {
      // Timed: answer key + result come from the server review payload.
      const rev = attempt.review?.[i] ?? {};
      const sel = rev.selectedPos == null ? undefined : rev.selectedPos;
      return {
        i, inst,
        r: { stem: inst.stem, opts: inst.opts, explanation: rev.explanation },
        sel, correctPos: rev.correctDisplayPos, isCorrect: !!rev.isCorrect, skipped: sel === undefined,
      };
    }
    // Practice: instance carries opts[].correct + explanation (answers are public).
    const sel = attempt.answers[i];
    const correctPos = inst.opts.findIndex((o) => o.correct);
    const isCorrect = sel === correctPos;
    return {
      i, inst,
      r: { stem: inst.stem, opts: inst.opts, explanation: inst.explanation },
      sel, correctPos, isCorrect, skipped: sel === undefined,
    };
  });
  const shown = rows.filter((row) => (filter === "all" ? true : filter === "incorrect" ? !row.isCorrect : row.skipped));

  return (
    <div className="pe-results">
      <div className={`pe-res-hero ${score.pass ? "is-pass" : "is-fail"}`}>
        <div className="pe-res-hero-l">
          <div className="pe-res-eyebrow">{isTimed ? "Timed exam" : "Practice"} · {score.total} questions</div>
          <h2 className="pe-res-title">{score.pass ? "You passed" : "Not yet — keep going"}</h2>
          <p className="pe-res-sub">
            {score.correct} of {score.total} correct. Pass line is {PASS_PCT}%.
            {score.pass ? " Strong work — review the misses and lock it in." : " Focus your next session on the weakest domains below."}
          </p>
          <div className="pe-res-actions">
            <button className="ghost-btn" onClick={onRetake}>Retake</button>
            <button className="ghost-btn" onClick={onHome}>Back to hub</button>
            {isTimed && !posted ? (
              <button className="primary-btn" onClick={onPost}>Post to leaderboard →</button>
            ) : isTimed && posted ? (
              <button className="ghost-btn is-done" onClick={onLeaderboard}>✓ Posted · view board</button>
            ) : null}
          </div>
          {!isTimed ? <div className="pe-res-note">Practice runs aren't eligible for the leaderboard — run a timed exam to compete.</div> : null}
        </div>
        <div className="pe-res-hero-r">
          <ScoreRing pct={score.pct} pass={score.pass} size={150} />
        </div>
      </div>

      <div className="pe-res-grid">
        <div className="card pe-res-dom">
          <div className="card-head"><h3>Per-domain breakdown</h3></div>
          <DomainBars perDomain={score.perDomain} />
        </div>
        <div className="card pe-res-summary">
          <div className="card-head"><h3>At a glance</h3></div>
          <div className="pe-res-stats">
            <div><div className="pe-res-stat-v">{score.correct}</div><div className="pe-res-stat-l">correct</div></div>
            <div><div className="pe-res-stat-v">{score.total - score.correct}</div><div className="pe-res-stat-l">wrong / skipped</div></div>
            <div><div className="pe-res-stat-v">{Math.max(...DOMAINS.map((d) => { const r = score.perDomain[d.id]; return r.total ? Math.round(r.correct / r.total * 100) : 0; }))}%</div><div className="pe-res-stat-l">best domain</div></div>
          </div>
        </div>
      </div>

      <div className="card pe-review">
        <div className="card-head">
          <h3>Question-by-question review</h3>
          <div className="filter-row">
            <button className={`chip ${filter === "all" ? "is-active" : ""}`} onClick={() => setFilter("all")}>All 60</button>
            <button className={`chip ${filter === "incorrect" ? "is-active" : ""}`} onClick={() => setFilter("incorrect")}>Incorrect</button>
            <button className={`chip ${filter === "skipped" ? "is-active" : ""}`} onClick={() => setFilter("skipped")}>Skipped</button>
          </div>
        </div>
        <div className="pe-review-list">
          {!hasDetail ? (
            <div className="pe-empty pe-empty-sm"><div className="pe-empty-title">Question breakdown unavailable</div><div className="pe-empty-sub">Per-question review is available right after you submit. This past timed attempt kept only its score summary.</div></div>
          ) : shown.length === 0 ? (
            <div className="pe-empty pe-empty-sm"><div className="pe-empty-title">Nothing here</div><div className="pe-empty-sub">No questions match this filter.</div></div>
          ) : shown.map((row) => (
            <div key={row.i} className={`pe-rev-item ${row.isCorrect ? "is-correct" : "is-wrong"}`}>
              <div className="pe-rev-top">
                <span className="pe-rev-num">Q{row.i + 1}</span>
                <DomainChip domainId={row.inst.domain} />
                <span className={`pe-rev-badge ${row.isCorrect ? "ok" : row.skipped ? "skip" : "bad"}`}>
                  {row.isCorrect ? "✓ Correct" : row.skipped ? "— Skipped" : "✕ Incorrect"}
                </span>
              </div>
              <div className="pe-rev-stem">{row.r.stem}</div>
              <div className="pe-rev-opts">
                {row.r.opts.map((o, pos) => {
                  const cls = pos === row.correctPos ? "correct" : pos === row.sel ? "chosen-wrong" : "idle";
                  return (
                    <div key={pos} className={`pe-rev-opt ${cls}`}>
                      <span className="pe-rev-letter">{letters[pos]}</span>
                      <span>{o.text}</span>
                      {pos === row.correctPos ? <span className="pe-rev-tag ok">correct</span> : null}
                      {pos === row.sel && pos !== row.correctPos ? <span className="pe-rev-tag bad">your answer</span> : null}
                    </div>
                  );
                })}
              </div>
              <div className="pe-rev-exp">{row.r.explanation}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
