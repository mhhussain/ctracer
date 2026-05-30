/* global React, PScoreRing, PDomainBars, PracticeHub, ExamRunner, DomainChip */
// practice-flow.jsx — Results, History, Leaderboard + controller ScreenPractice.
const { useState: usesF, useEffect: useeF, useMemo: usemF, useRef: userF } = React;

const PE_LS = "ccaf_practice_v1";
function pLoad() { try { return JSON.parse(localStorage.getItem(PE_LS) || "{}"); } catch { return {}; } }
function pSave(s) { localStorage.setItem(PE_LS, JSON.stringify(s)); }

function usePracticeState() {
  const [state, setState] = usesF(() => {
    const s = pLoad();
    return {
      user: s.user || null,
      active: s.active || null,
      attempts: s.attempts || [],
      posted: s.posted || null, // {score, handle, anon, date}
    };
  });
  useeF(() => { pSave(state); }, [state]);

  const P = window.CCA_PRACTICE;
  const api = {
    state,
    signIn: (handle) => setState((s) => ({ ...s, user: { handle: handle || "you" } })),
    signOut: () => setState((s) => ({ ...s, user: null })),
    startAttempt: (mode) => setState((s) => ({ ...s, active: P.createAttempt(mode) })),
    discardActive: () => setState((s) => ({ ...s, active: null })),
    select: (i, pos) =>
      setState((s) => {
        if (!s.active || s.active.submitted) return s;
        if (s.active.mode === "practice" && s.active.answers[i] !== undefined) return s; // lock
        return { ...s, active: { ...s.active, answers: { ...s.active.answers, [i]: pos } } };
      }),
    flag: (i) =>
      setState((s) => {
        if (!s.active) return s;
        return { ...s, active: { ...s.active, flags: { ...s.active.flags, [i]: !s.active.flags[i] } } };
      }),
    submit: () =>
      setState((s) => {
        if (!s.active) return s;
        const score = P.scoreAttempt(s.active);
        const record = { ...s.active, submitted: true, submittedAt: Date.now(), score };
        return { ...s, active: null, attempts: [record, ...s.attempts] };
      }),
    postToLeaderboard: (handle, anon) =>
      setState((s) => {
        const best = bestTimed(s.attempts);
        if (!best) return s;
        return {
          ...s,
          posted: { score: best.score.pct, handle: anon ? "Anonymous" : handle || s.user?.handle || "you", anon, date: todayISO() },
        };
      }),
    unpost: () => setState((s) => ({ ...s, posted: null })),
    reset: () => setState({ user: null, active: null, attempts: [], posted: null }),
    seedDemo: () =>
      setState((s) => {
        const a1 = mkFakeAttempt("practice", 68, 6 * 86400000);
        const a2 = mkFakeAttempt("timed", 75, 3 * 86400000);
        const a3 = mkFakeAttempt("timed", 81, 1 * 86400000);
        return { ...s, user: { handle: "mohammed" }, attempts: [a3, a2, a1] };
      }),
  };
  return api;
}

function todayISO() { return new Date().toISOString().slice(0, 10); }
function bestTimed(attempts) {
  const timed = attempts.filter((a) => a.mode === "timed");
  if (!timed.length) return null;
  return timed.reduce((b, a) => (a.score.pct > b.score.pct ? a : b));
}
function mkFakeAttempt(mode, pct, agoMs) {
  const P = window.CCA_PRACTICE;
  const at = P.createAttempt(mode);
  // answer to hit ~pct
  const target = Math.round((pct / 100) * at.instances.length);
  at.instances.forEach((inst, i) => {
    const correctPos = inst.optOrder.findIndex((origIdx) => P.questionById(inst.qid).options[origIdx].correct);
    at.answers[i] = i < target ? correctPos : (correctPos + 1) % 4;
  });
  const score = P.scoreAttempt(at);
  return { ...at, submitted: true, submittedAt: Date.now() - agoMs, createdAt: Date.now() - agoMs - 3600000, score };
}

// ---------------- Results & Review ----------------

function ResultsReview({ attempt, posted, onPost, onRetake, onHome, onLeaderboard }) {
  const P = window.CCA_PRACTICE;
  const { DOMAINS } = window.CCA_DATA;
  const [filter, setFilter] = usesF("all");
  const score = attempt.score;
  const isTimed = attempt.mode === "timed";
  const letters = ["A", "B", "C", "D"];

  const rows = attempt.instances.map((inst, i) => {
    const r = P.renderInstance(inst);
    const sel = attempt.answers[i];
    const correctPos = r.opts.findIndex((o) => o.correct);
    const isCorrect = sel === correctPos;
    return { i, inst, r, sel, correctPos, isCorrect, skipped: sel === undefined };
  });
  const shown = rows.filter((row) => (filter === "all" ? true : filter === "incorrect" ? !row.isCorrect : row.skipped));

  return (
    <div className="pe-results">
      <div className={`pe-res-hero ${score.pass ? "is-pass" : "is-fail"}`}>
        <div className="pe-res-hero-l">
          <div className="pe-res-eyebrow">{isTimed ? "Timed exam" : "Practice"} · {score.total} questions</div>
          <h2 className="pe-res-title">{score.pass ? "You passed" : "Not yet — keep going"}</h2>
          <p className="pe-res-sub">
            {score.correct} of {score.total} correct. Pass line is {P.PASS_PCT}%.
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
          <PScoreRing pct={score.pct} pass={score.pass} size={150} />
        </div>
      </div>

      <div className="pe-res-grid">
        <div className="card pe-res-dom">
          <div className="card-head"><h3>Per-domain breakdown</h3></div>
          <PDomainBars perDomain={score.perDomain} />
        </div>
        <div className="card pe-res-summary">
          <div className="card-head"><h3>At a glance</h3></div>
          <div className="pe-res-stats">
            <div><div className="pe-res-stat-v">{score.correct}</div><div className="pe-res-stat-l">correct</div></div>
            <div><div className="pe-res-stat-v">{score.total - score.correct}</div><div className="pe-res-stat-l">wrong / skipped</div></div>
            <div><div className="pe-res-stat-v">{Math.max(...DOMAINS.map((d)=>{const r=score.perDomain[d.id];return r.total?Math.round(r.correct/r.total*100):0;}))}%</div><div className="pe-res-stat-l">best domain</div></div>
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
          {shown.length === 0 ? (
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

// ---------------- History ----------------

function HistoryView({ attempts, onOpen, onStart }) {
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
        <div className="card-head"><h3>Score trend</h3><span className="muted-xs">{attempts.length} attempts · pass line {window.CCA_PRACTICE.PASS_PCT}%</span></div>
        <Sparkline points={pts} pass={window.CCA_PRACTICE.PASS_PCT} />
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

function fmtDate(ms) {
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function Sparkline({ points, pass }) {
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

// ---------------- Leaderboard ----------------

function LeaderboardView({ board, you, yourBest, onOpenPost, onUnpost }) {
  // board: merged+sorted [{handle, score, date, anon, isYou}]
  const yourRank = yourBest != null
    ? board.filter((e) => e.score > yourBest).length + 1
    : null;

  return (
    <div className="pe-leaderboard">
      {/* opt-in / status banner */}
      {yourBest == null ? (
        <div className="card pe-lb-banner">
          <div>
            <div className="pe-lb-banner-title">No timed score yet</div>
            <div className="pe-lb-banner-sub">Finish a timed exam to earn a leaderboard-eligible score, then choose whether to post it.</div>
          </div>
        </div>
      ) : !you ? (
        <div className="card pe-lb-banner is-cta">
          <div>
            <div className="pe-lb-banner-title">You're not on the board — yet</div>
            <div className="pe-lb-banner-sub">
              Your best timed score is <strong>{yourBest}%</strong>. That would rank <strong>#{yourRank}</strong> right now.
              Posting is opt-in; pick a handle or stay anonymous.
            </div>
          </div>
          <button className="primary-btn" onClick={onOpenPost}>Post my score →</button>
        </div>
      ) : (
        <div className="card pe-lb-banner is-posted">
          <div>
            <div className="pe-lb-banner-title">You're on the board as {you.anon ? "Anonymous" : you.handle}</div>
            <div className="pe-lb-banner-sub">Best timed score <strong>{you.score}%</strong> · posted {fmtDate2(you.date)}.</div>
          </div>
          <div className="pe-lb-banner-actions">
            <button className="ghost-btn-sm" onClick={onOpenPost}>Edit</button>
            <button className="ghost-btn-sm" onClick={onUnpost}>Remove</button>
          </div>
        </div>
      )}

      <div className="card pe-lb-table">
        <div className="card-head">
          <h3>Global leaderboard</h3>
          <span className="muted-xs">Best timed score per user</span>
        </div>
        {board.length === 0 ? (
          <div className="pe-empty pe-empty-sm"><div className="pe-empty-title">Empty board</div><div className="pe-empty-sub">Be the first to post a timed score.</div></div>
        ) : (
          <div className="pe-lb-rows">
            {board.map((e, i) => (
              <div key={i} className={`pe-lb-row ${e.isYou ? "is-you" : ""}`}>
                <span className={`pe-lb-rank ${i < 3 ? `top-${i + 1}` : ""}`}>{i + 1}</span>
                <span className="pe-lb-handle">
                  {e.anon ? <span className="pe-lb-anon">Anonymous</span> : e.handle}
                  {e.isYou ? <span className="pe-lb-you">YOU</span> : null}
                </span>
                <span className="pe-lb-score">{e.score}%</span>
                <span className="pe-lb-date">{fmtDate2(e.date)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function fmtDate2(iso) {
  try { return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" }); }
  catch { return iso; }
}

Object.assign(window, {
  usePracticeState,
  bestTimed,
  ResultsReview,
  HistoryView,
  LeaderboardView,
  Sparkline,
});
