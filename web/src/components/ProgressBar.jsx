export default function ProgressBar({ value, color = 'accent', height = 5 }) {
  const bg =
    color === 'accent' ? 'var(--accent)'
    : color === 'muted' ? 'var(--muted-2)'
    : `var(--c-${color})`
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div className="progress-track" style={{ height }}>
      <div className="progress-fill" style={{ width: `${pct}%`, background: bg, height }} />
    </div>
  )
}
