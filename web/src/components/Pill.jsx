export default function Pill({ tone = 'neutral', dim = false, children }) {
  return (
    <span className={`pill pill-${tone}${dim ? ' pill-dim' : ''}`}>
      {children}
    </span>
  )
}
