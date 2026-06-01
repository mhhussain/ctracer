import { PASS_PCT } from '../../lib/practiceEngine';
import DomainBars from './DomainBars';

export default function PracticeHub({ stats, signedIn, user, onStart, onSignIn, onGoto }) {
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
              <DomainBars perDomain={stats.perDomain} compact />
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
