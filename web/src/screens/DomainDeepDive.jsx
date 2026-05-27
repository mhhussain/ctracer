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
        <div>
          <p className="dom-hero-eyebrow">D{domain.num} · {domain.weight}%</p>
          <h1 className="dom-hero-title">{domain.name}</h1>
          <p>{domain.blurb}</p>
        </div>
        <div className="dom-hero-r">
          <div className="dh-stat">
            <span className="dh-stat-v">{domain.weight}%</span>
            <span className="dh-stat-l">Weight</span>
          </div>
          <div className="dh-stat">
            <span className="dh-stat-v">{domain.questions}</span>
            <span className="dh-stat-l">Questions</span>
          </div>
        </div>
      </div>

      {/* 2. Four-card body grid */}
      <div className="dom-grid">
        {/* Key topics card */}
        <div className="card dom-topics">
          <h3>Key topics</h3>
          <p>Every bullet below is fair game on the exam…</p>
          <ul className="topic-list">
            {domain.topics.map(t => (
              <li key={t.name}>
                <strong>{t.name}</strong> — {t.desc}
              </li>
            ))}
          </ul>
        </div>

        {/* What to build card */}
        <div className="card dom-build">
          <h3>What to build</h3>
          <ol className="build-list">
            {domain.build.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ol>
        </div>

        {/* Anti-patterns card */}
        <div className="card dom-anti">
          <h3>Anti-patterns to know</h3>
          <ul className="anti-list">
            {domain.antiPatterns.map((ap, i) => (
              <li key={i}>
                <span className="anti-x">✕</span>{ap}
              </li>
            ))}
          </ul>
        </div>

        {/* Where to study card */}
        <div className="card dom-links">
          <h3>Where to study</h3>
          <div className="link-block">
            <div className="lb-head">Phase</div>
            <button className="lb-row" onClick={() => navigate('/plan')}>
              Phase {domain.phase} — study plan →
            </button>
          </div>
          <div className="link-block">
            <div className="lb-head">Courses</div>
            {COURSES.filter(c => c.domains.includes(domain.id)).map(c => (
              <button key={c.id} className="lb-row" onClick={() => navigate('/courses')}>
                {c.name} →
              </button>
            ))}
          </div>
          <div className="link-block">
            <div className="lb-head">Projects</div>
            {PROJECTS.filter(p => p.domains.includes(domain.id)).map(p => (
              <button key={p.id} className="lb-row" onClick={() => navigate('/projects')}>
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
        <button className="dom-nav-btn dom-nav-r" onClick={() => navigate(`/domain/${next.id}`)}>
          {next.short} <span className="dom-nav-eyebrow">D{next.num}</span> →
        </button>
      </div>
    </div>
  )
}
