import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PROJECTS, DOMAINS } from '../data/index.js'
import DomainTag from '../components/DomainTag.jsx'
import Card from '../components/Card'
import { useProgress } from '../hooks/useProgress.js'

const DOMAIN_MAP = Object.fromEntries(DOMAINS.map(d => [d.id, d]))

const STATUS_LABELS = {
  not_started: 'Not started',
  in_progress: 'In progress',
  complete: 'Complete',
}

const STATUS_PILL = {
  not_started: 'pill-dim',
  in_progress: 'pill-accent',
  complete: 'pill-ok',
}

export default function Projects() {
  const navigate = useNavigate()
  const { progress, cycleProject, setProject } = useProgress()
  const [openProjectId, setOpenProjectId] = useState(null)

  return (
    <div className="screen-container">
      <section className="sec">
        <header className="sec-head">
          <div>
            <h2 className="sec-title">Projects</h2>
            <p className="sec-desc">Hands-on builds that reinforce each domain.</p>
          </div>
        </header>
      </section>
      <div className="proj-grid">
        {PROJECTS.map((p, i) => {
          const status = progress.projects[p.id] ?? 'not_started'
          const isOpen = openProjectId === p.id

          return (
            <Card key={p.id} className={`proj-card status-${status}`}>
              <div className="proj-top">
                <span className="proj-num">PROJECT {String(i + 1).padStart(2, '0')}</span>
                <button
                  className={`pill ${STATUS_PILL[status]} proj-status`}
                  onClick={() => cycleProject(p.id)}
                >
                  <span className="proj-dot" /> {STATUS_LABELS[status]}
                </button>
              </div>
              <h3 className="proj-name">{p.name}</h3>
              <p className="proj-summary">{p.summary}</p>
              <div className="proj-pills">
                <span className={`pill ${p.complexity === 'High' ? 'pill-warn' : 'pill-dim'}`}>
                  {p.complexity}
                </span>
                <span className="pill pill-dim">~{p.hours}h</span>
              </div>
              <div className="proj-tags">
                {p.domains.map(did => (
                  <span key={did} style={{ cursor: 'pointer' }} onClick={() => navigate(`/domain/${did}`)}>
                    <DomainTag domain={DOMAIN_MAP[did]} />
                  </span>
                ))}
              </div>
              {p.flag && (
                <div className="proj-flag">{p.flag}</div>
              )}
              <button className="btn-link" onClick={() => setOpenProjectId(isOpen ? null : p.id)}>
                {isOpen ? 'Hide build steps ↑' : 'Show build steps ↓'}
              </button>

              {isOpen && (
                <div className="proj-steps">
                  <div className="proj-teaches">
                    <h4>What it teaches</h4>
                    <p>{p.teaches}</p>
                  </div>
                  <div className="proj-build">
                    <h4>What to build</h4>
                    <ol>
                      {p.build.map((step, si) => <li key={si}>{step}</li>)}
                    </ol>
                  </div>
                  <div className="proj-actions">
                    <button className="btn btn-secondary" onClick={() => setProject(p.id, 'in_progress')}>Start</button>
                    <button className="btn btn-secondary" onClick={() => setProject(p.id, 'complete')}>Mark complete</button>
                    <button className="btn btn-secondary" onClick={() => setProject(p.id, 'not_started')}>Reset</button>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
