import { useParams, useNavigate } from 'react-router-dom'
import { DOMAINS, COURSES, PROJECTS } from '../data/index'

export default function DomainDeepDive() {
  const { id } = useParams()
  const navigate = useNavigate()

  const domain = DOMAINS.find(d => d.id === id) ?? DOMAINS[0]
  const idx = DOMAINS.findIndex(d => d.id === domain.id)
  const prev = DOMAINS[(idx - 1 + 5) % 5]
  const next = DOMAINS[(idx + 1) % 5]

  return (
    <div className="screen-container">
      {/* 1. Domain hero */}
      <div className="dom-hero">
        <div className={`dom-hero-stripe dtag-${domain.color}`} />
        <div className="dom-hero-content">
          <div className="dom-hero-left">
            <div className="dom-eyebrow">
              <span className={`dtag dtag-${domain.color}`}>D{domain.num}</span>
              <span>Domain {domain.num} of 5</span>
              {domain.difficulty === 'Hardest' && (
                <span className="pill pill-warn">Hardest domain</span>
              )}
            </div>
            <h2 className="dom-hero-name">{domain.name}</h2>
            <p className="dom-hero-blurb">{domain.blurb}</p>
          </div>
          <div className="dom-hero-right">
            <div className="dom-stats">
              <div className="dom-stat">
                <span className="dom-stat-val">{domain.weight}%</span>
                <span className="dom-stat-label">Exam weight</span>
              </div>
              <div className="dom-stat">
                <span className="dom-stat-val">{domain.questions}</span>
                <span className="dom-stat-label">Questions</span>
              </div>
              <div className="dom-stat">
                <span className="dom-stat-val">Phase {domain.phase}</span>
                <span className="dom-stat-label">Study phase</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Four-card body grid */}
      <div className="dom-grid">
        {/* Key topics card */}
        <div className="dom-card dom-topics">
          <h3>Key topics</h3>
          <p className="dom-card-sub">Every bullet below is fair game on the exam…</p>
          <ul className="dom-topic-list">
            {domain.topics.map(t => (
              <li key={t.name}>
                <strong>{t.name}</strong> — {t.desc}
              </li>
            ))}
          </ul>
        </div>

        {/* What to build card */}
        <div className="dom-card dom-build">
          <h3>What to build</h3>
          <ol className="dom-build-list">
            {domain.build.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ol>
        </div>

        {/* Anti-patterns card */}
        <div className="dom-card dom-anti">
          <h3>Anti-patterns to know</h3>
          <ul className="dom-anti-list">
            {domain.antiPatterns.map((ap, i) => (
              <li key={i}>
                <span className="ref-x">✕</span>{ap}
              </li>
            ))}
          </ul>
        </div>

        {/* Where to study card */}
        <div className="dom-card dom-links">
          <h3>Where to study</h3>
          <div className="dom-links-group">
            <div className="dom-links-heading">Phase</div>
            <button className="dom-link-row" onClick={() => navigate('/plan')}>
              Phase {domain.phase} — study plan →
            </button>
          </div>
          <div className="dom-links-group">
            <div className="dom-links-heading">Courses</div>
            {COURSES.filter(c => c.domains.includes(domain.id)).map(c => (
              <button key={c.id} className="dom-link-row" onClick={() => navigate('/courses')}>
                {c.name} →
              </button>
            ))}
          </div>
          <div className="dom-links-group">
            <div className="dom-links-heading">Projects</div>
            {PROJECTS.filter(p => p.domains.includes(domain.id)).map(p => (
              <button key={p.id} className="dom-link-row" onClick={() => navigate('/projects')}>
                {p.name} →
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Domain navigation */}
      <div className="dom-nav">
        <button className="dom-nav-btn" onClick={() => navigate(`/domain/${prev.id}`)}>
          ← <span className="dom-nav-eyebrow">D{prev.num}</span> {prev.short}
        </button>
        <button className="dom-nav-btn dom-nav-next" onClick={() => navigate(`/domain/${next.id}`)}>
          {next.short} <span className="dom-nav-eyebrow">D{next.num}</span> →
        </button>
      </div>
    </div>
  )
}
