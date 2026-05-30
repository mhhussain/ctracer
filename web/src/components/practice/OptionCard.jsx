export default function OptionCard({ letter, text, state, disabled, onClick }) {
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
