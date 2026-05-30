export function fmtClock(totalSec) {
  if (totalSec == null) return "--:--";
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export default function Timer({ secondsLeft, durationSec }) {
  const low = secondsLeft != null && secondsLeft <= 300;
  const crit = secondsLeft != null && secondsLeft <= 60;
  return (
    <div className={`pe-timer ${low ? "is-low" : ""} ${crit ? "is-crit" : ""}`}>
      <span className="pe-timer-dot" />
      <span className="pe-timer-clock">{fmtClock(secondsLeft)}</span>
      <span className="pe-timer-cap">{crit ? "time almost up" : low ? "time running low" : "remaining"}</span>
    </div>
  );
}
