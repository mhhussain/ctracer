/* global React */
// practice-core.jsx — shared atoms + Hub + Runner (presentational, prop-driven).
const { useState: usePS, useEffect: usePE, useRef: usePR } = React;

// ---------------- shared atoms ----------------

function fmtClock(totalSec) {
  if (totalSec == null) return "--:--";
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

function PScoreRing({ pct, pass, size = 132, label = true }) {
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

function PTimer({ secondsLeft, durationSec }) {
  const low = secondsLeft != null && secondsLeft <= 300; // < 5 min
  const crit = secondsLeft != null && secondsLeft <= 60; // < 1 min
  return (
    <div className={`pe-timer ${low ? "is-low" : ""} ${crit ? "is-crit" : ""}`}>
      <span className="pe-timer-dot" />
      <span className="pe-timer-clock">{fmtClock(secondsLeft)}</span>
      <span className="pe-timer-cap">{crit ? "time almost up" : low ? "time running low" : "remaining"}</span>
    </div>
  );
}

function PDomainBars({ perDomain, compact = false }) {
  const { DOMAINS } = window.CCA_DATA;
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

function POptionCard({ letter, text, state, disabled, onClick }) {
  // state: idle | selected | correct | incorrect | reveal
  return (
    <button
      className={`pe-opt state-${state}`}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="pe-opt-letter">{letter}</span>
      <span className="pe-opt-text">{text}</span>
      {state === "correct" || state === "reveal" ? <span className="pe-opt-mark ok">✓</span> : null}
      {state === "incorrect" ? <span className="pe-opt-mark bad">✕</span> : null}
      {state === "reveal" ? <span className="pe-opt-flag">Correct answer</span> : null}
    </button>
  );
}

function PProgressGrid({ attempt, current, onNav }) {
  return (
    <div className="pe-grid">
      {attempt.instances.map((inst, i) => {
        const answered = attempt.answers[i] !== undefined;
        const flagged = attempt.flags[i];
        const isCur = i === current;
        return (
          <button
            key={i}
            className={`pe-grid-cell ${answered ? "is-answered" : ""} ${flagged ? "is-flagged" : ""} ${isCur ? "is-current" : ""}`}
            onClick={() => onNav(i)}
            title={`Question ${i + 1}${flagged ? " (flagged)" : ""}`}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}

// ---------------- Hub ----------------

function PracticeHub({ stats, signedIn, user, onStart, onSignIn, onGoto }) {
  const { PASS_PCT } = window.CCA_PRACTICE;
  const hasHistory = stats.attempts > 0;
  return (
    <div className="pe-hub">
      {/* mode cards */}
      <div className="pe-modes">
        <div className="pe-mode pe-mode-timed">
          <div className="pe-mode-head">
            <div className="pe-mode-eyebrow">Mode 01</div>
            <h3 className="pe-mode-title">Timed Exam</h3>
            {!signedIn ? <span className="pe-lock">🔒 Sign-in required</span> : <span className="pe-mode-badge">Leaderboard eligible</span>}
          </div>
          <p className="pe-mode-desc">
            60 questions, a 120-minute countdown, and no feedback until you submit —
            the closest thing to the real exam. Score posts to the leaderboard if you opt in.
          </p>
          <ul className="pe-mode-facts">
            <li><span>60</span> questions</li>
            <li><span>120</span> minutes</li>
            <li><span>{PASS_PCT}%</span> to pass</li>
          </ul>
          {signedIn ? (
            <button className="primary-btn pe-mode-cta" onClick={() => onStart("timed")}>Start timed exam →</button>
          ) : (
            <button className="primary-btn pe-mode-cta" onClick={onSignIn}>Sign in to start →</button>
          )}
        </div>

        <div className="pe-mode pe-mode-practice">
          <div className="pe-mode-head">
            <div className="pe-mode-eyebrow">Mode 02</div>
            <h3 className="pe-mode-title">Practice</h3>
            <span className="pe-mode-badge ghost">No sign-in needed</span>
          </div>
          <p className="pe-mode-desc">
            60 questions, untimed, with instant feedback and an explanation after every
            answer. Learn as you go. Not eligible for the leaderboard.
          </p>
          <ul className="pe-mode-facts">
            <li><span>60</span> questions</li>
            <li><span>∞</span> untimed</li>
            <li><span>★</span> instant feedback</li>
          </ul>
          <button className="ghost-btn pe-mode-cta" onClick={() => onStart("practice")}>Start practice →</button>
        </div>
      </div>

      {/* stats snapshot */}
      <div className="pe-snap">
        <div className="card-head">
          <h3>Your stats</h3>
          <div className="pe-snap-actions">
            <button className="ghost-btn-sm" onClick={() => onGoto("history")}>History →</button>
            <button className="ghost-btn-sm" onClick={() => onGoto("leaderboard")}>Leaderboard →</button>
          </div>
        </div>

        {hasHistory ? (
          <>
            <div className="pe-snap-stats">
              <div className="pe-snap-stat">
                <div className="pe-snap-v" style={{ color: stats.bestPass ? "var(--ok)" : "var(--text)" }}>{stats.best}%</div>
                <div className="pe-snap-l">Best score</div>
              </div>
              <div className="pe-snap-stat">
                <div className="pe-snap-v">{stats.attempts}</div>
                <div className="pe-snap-l">Attempts</div>
              </div>
              <div className="pe-snap-stat">
                <div className="pe-snap-v">{stats.last != null ? `${stats.last}%` : "—"}</div>
                <div className="pe-snap-l">Last result</div>
              </div>
            </div>
            <div className="pe-snap-strength">
              <div className="col-head">Per-domain strengths (best attempt)</div>
              <PDomainBars perDomain={stats.perDomain} compact />
            </div>
          </>
        ) : (
          <div className="pe-empty">
            <div className="pe-empty-glyph">◎</div>
            <div className="pe-empty-title">No attempts yet</div>
            <div className="pe-empty-sub">Take a practice run or a timed exam to start tracking your scores and per-domain strengths.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- Runner ----------------

function ExamRunner({ attempt, current, secondsLeft, onSelect, onFlag, onNav, onPrev, onNext, onSubmit, onExit, defaultNavOpen }) {
  const P = window.CCA_PRACTICE;
  const [navOpen, setNavOpen] = usePS(!!defaultNavOpen);
  const inst = attempt.instances[current];
  const r = P.renderInstance(inst);
  const total = attempt.instances.length;
  const selected = attempt.answers[current];
  const answered = selected !== undefined;
  const isPractice = attempt.mode === "practice";
  const showFeedback = isPractice && answered;
  const flagged = !!attempt.flags[current];
  const answeredCount = Object.keys(attempt.answers).length;
  const isLast = current === total - 1;

  const letters = ["A", "B", "C", "D"];
  const correctPos = r.opts.findIndex((o) => o.correct);
  const chosenCorrect = showFeedback && selected === correctPos;

  function optState(pos) {
    if (!showFeedback) return selected === pos ? "selected" : "idle";
    if (pos === correctPos) return "correct";
    if (pos === selected) return "incorrect";
    return "idle";
  }

  return (
    <div className="pe-runner">
      {/* runner header */}
      <div className="pe-run-head">
        <button className="pe-run-exit" onClick={onExit}>← Exit</button>
        <div className="pe-run-progress">
          <span className="pe-run-q">Q{current + 1}</span>
          <span className="pe-run-of">of {total}</span>
          <div className="pe-run-bar">
            <div className="pe-run-bar-fill" style={{ width: `${((current + 1) / total) * 100}%` }} />
          </div>
          <span className="pe-run-answered">{answeredCount} answered</span>
        </div>
        {attempt.mode === "timed" ? (
          <PTimer secondsLeft={secondsLeft} />
        ) : (
          <div className="pe-untimed">Practice · untimed</div>
        )}
      </div>

      <div className="pe-run-body">
        {/* question */}
        <div className="pe-qcard">
          <div className="pe-q-meta">
            <DomainChip domainId={inst.domain} />
            <button className={`pe-flag ${flagged ? "is-on" : ""}`} onClick={onFlag}>
              {flagged ? "⚑ Flagged" : "⚐ Flag"}
            </button>
          </div>
          <h2 className="pe-q-stem">{r.stem}</h2>
          <div className="pe-opts">
            {r.opts.map((o, pos) => (
              <POptionCard
                key={pos}
                letter={letters[pos]}
                text={o.text}
                state={optState(pos)}
                disabled={showFeedback}
                onClick={() => onSelect(pos)}
              />
            ))}
          </div>

          {showFeedback ? (
            <div className={`pe-feedback ${chosenCorrect ? "is-correct" : "is-incorrect"}`}>
              <div className="pe-feedback-head">
                {chosenCorrect ? "✓ Correct" : "✕ Not quite"}
              </div>
              <p className="pe-feedback-text">{r.explanation}</p>
            </div>
          ) : null}

          {/* footer nav */}
          <div className="pe-run-foot">
            <button className="ghost-btn-sm" onClick={onPrev} disabled={current === 0}>← Prev</button>
            <button className="ghost-btn-sm pe-nav-toggle" onClick={() => setNavOpen((v) => !v)}>
              {navOpen ? "Hide map" : "Question map"} ({answeredCount}/{total})
            </button>
            {isLast ? (
              <button className="primary-btn-sm" onClick={onSubmit}>Submit exam</button>
            ) : showFeedback || !isPractice ? (
              <button className="primary-btn-sm" onClick={onNext}>Next →</button>
            ) : (
              <button className="ghost-btn-sm" onClick={onNext}>Skip →</button>
            )}
          </div>
        </div>

        {/* navigator (desktop sidebar / mobile sheet) */}
        <div className={`pe-nav ${navOpen ? "is-open" : ""}`}>
          <div className="pe-nav-head">
            <span>Question map</span>
            <button className="pe-nav-close" onClick={() => setNavOpen(false)}>×</button>
          </div>
          <PProgressGrid attempt={attempt} current={current} onNav={(i) => { onNav(i); setNavOpen(false); }} />
          <div className="pe-nav-legend">
            <span><i className="lg lg-ans" /> answered</span>
            <span><i className="lg lg-flag" /> flagged</span>
            <span><i className="lg lg-cur" /> current</span>
          </div>
          <button className="primary-btn-sm pe-nav-submit" onClick={onSubmit}>Submit exam</button>
        </div>
      </div>
    </div>
  );
}

function DomainChip({ domainId }) {
  const d = window.CCA_DATA.DOMAINS.find((x) => x.id === domainId);
  return (
    <span className={`dtag dtag-${d.color}`}>
      <span className="dtag-dot" />D{d.num} · {d.short}
    </span>
  );
}

Object.assign(window, {
  fmtClock,
  PScoreRing,
  PTimer,
  PDomainBars,
  POptionCard,
  PProgressGrid,
  PracticeHub,
  ExamRunner,
  DomainChip,
});
