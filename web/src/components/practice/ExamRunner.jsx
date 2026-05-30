import { useState } from 'react';
import { renderInstance } from '../../lib/practiceEngine';
import Timer from './Timer';
import OptionCard from './OptionCard';
import ProgressGrid from './ProgressGrid';
import DomainChip from './DomainChip';

export default function ExamRunner({ attempt, current, secondsLeft, onSelect, onFlag, onNav, onPrev, onNext, onSubmit, onExit, defaultNavOpen }) {
  const [navOpen, setNavOpen] = useState(!!defaultNavOpen);
  const inst = attempt.instances[current];
  const r = renderInstance(inst);
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
          <Timer secondsLeft={secondsLeft} />
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
              <OptionCard
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
          <ProgressGrid attempt={attempt} current={current} onNav={(i) => { onNav(i); setNavOpen(false); }} />
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
