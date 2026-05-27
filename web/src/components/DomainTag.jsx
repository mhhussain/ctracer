export default function DomainTag({ domain }) {
  return (
    <span
      className="domain-tag"
      style={{ '--domain-color': `var(--c-${domain.color})` }}
    >
      D{domain.num}
    </span>
  )
}
