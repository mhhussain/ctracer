export default function ProgressGrid({ attempt, current, onNav }) {
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
