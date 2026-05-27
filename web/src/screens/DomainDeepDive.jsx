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
      <section className="sec">
        <header className="sec-head">
          <div>
            <h2 className="sec-title">{domain.name}</h2>
            <p className="sec-desc">D{domain.num} of 5 · {domain.weight}% of exam</p>
          </div>
        </header>
      </section>

      {/* 1. Domain hero */}
      <div className="dom-hero">
        <div className={`dom-hero-stripe dtag-${domain.color}`} />
        <div className="dom-hero-l">
          <div className="dom-hero-eyebrow">
            <span className={`legend-sw dtag-${domain.color}`} />
            <span>Domain {domain.num} of 5</span>
            {domain.difficulty === 'Hardest' && (
              <span className="pill pill-warn">Hardest domain</span>
            )}
          </div>
          <h1 className="dom-hero-title">{domain.name}</h1>
          <p className="dom-hero-blurb">{domain.blurb}</p>
        </div>
        <div className="dom-hero-r">
          <div className="dh-stat">
            <div className="dh-stat-v">
              {domain.weight}<span className="dh-stat-u">%</span>
            </div>
            <div className="dh-stat-l">of exam</div>
          </div>
          <div className="dh-stat">
            <div className="dh-stat-v">{domain.questions}</div>
            <div className="dh-stat-l">questions</div>
          </div>
          <div className="dh-stat">
            <div className="dh-stat-v">P{domain.phase}</div>
            <div className="dh-stat-l">study phase</div>
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
                <span className="topic-name">{t.name}</span>
                <span className="topic-desc"> — {t.desc}</span>
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
              <span className="lb-row-l">Phase {domain.phase} — study plan</span>
              <span className="lb-row-r">→</span>
            </button>
          </div>
          <div className="link-block">
            <div className="lb-head">Courses</div>
            {COURSES.filter(c => c.domains.includes(domain.id)).map(c => (
              <button key={c.id} className="lb-row" onClick={() => navigate('/courses')}>
                <span className="lb-row-l">{c.name}</span>
                <span className="lb-row-r">{c.hours}h →</span>
              </button>
            ))}
          </div>
          <div className="link-block">
            <div className="lb-head">Projects</div>
            {PROJECTS.filter(p => p.domains.includes(domain.id)).map(p => (
              <button key={p.id} className="lb-row" onClick={() => navigate('/projects')}>
                <span className="lb-row-l">{p.name}</span>
                <span className="lb-row-r">{p.complexity} →</span>
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
