import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { COURSES, DOMAINS } from '../data/index'
import { useProgress } from '../hooks/useProgress'
import Card from '../components/Card'
import DomainTag from '../components/DomainTag'

const DOMAIN_MAP = Object.fromEntries(DOMAINS.map(d => [d.id, d]))

export default function Courses() {
  const { progress, toggleCourse } = useProgress()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [openCourseId, setOpenCourseId] = useState(null)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setOpenCourseId(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const filtered = COURSES.filter(c => {
    if (filter === 'partner') return c.partnerRequired === true
    if (filter === 'other') return c.partnerRequired === false
    return true
  })

  const modalCourse = COURSES.find(c => c.id === openCourseId)

  return (
    <div className="screen-container">
      <section className="sec">
        <header className="sec-head">
          <div>
            <h2 className="sec-title">Courses</h2>
            <p className="sec-desc">Free at anthropic.skilljar.com. The four Partner Network courses are the official pre-cert sequence.</p>
          </div>
          <div className="filter-row">
            {[
              { key: 'all', label: 'All' },
              { key: 'partner', label: 'Partner Network (required)' },
              { key: 'other', label: 'Recommended' },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`chip${filter === key ? ' is-active' : ''}`}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </header>
      </section>

      <div className="course-grid">
        {filtered.map(c => {
          const done = !!progress.courses[c.id]
          return (
            <Card key={c.id} className={`course-card${c.partnerRequired ? ' is-required' : ''}${done ? ' is-done' : ''}`}>
              {c.partnerRequired && (
                <div className="card-flag">Partner Network · required</div>
              )}
              <div className="course-top">
                <h3 className="course-name">{c.name}</h3>
                <button
                  className={done ? 'btn-done is-done' : 'btn btn-secondary'}
                  onClick={() => toggleCourse(c.id)}
                >
                  {done ? '✓ Done' : 'Mark done'}
                </button>
              </div>
              <p className="course-blurb">{c.blurb}</p>
              <div className="course-meta">
                <span className="pill pill-dim">{c.hours}h</span>
                <span className="pill pill-dim">{c.level}</span>
              </div>
              <div className="course-doms">
                {c.domains.map(did => (
                  <span key={did} onClick={() => navigate(`/domain/${did}`)} style={{ cursor: 'pointer' }}>
                    <DomainTag domain={DOMAIN_MAP[did]} />
                  </span>
                ))}
              </div>
              <div className="course-actions">
                <button className="ghost-btn-sm" onClick={() => setOpenCourseId(c.id)}>
                  Module list →
                </button>
                <a className="ghost-btn-sm" href={c.url} target="_blank" rel="noopener noreferrer">
                  Open on Skilljar ↗
                </a>
              </div>
            </Card>
          )
        })}
      </div>

      {openCourseId && modalCourse && (
        <div className="modal-veil" onClick={() => setOpenCourseId(null)}>
          <div className="modal" role="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="modal-eyebrow">{modalCourse.level} · {modalCourse.hours}h</div>
                <h2 className="modal-title">{modalCourse.name}</h2>
                <p className="modal-blurb">{modalCourse.blurb}</p>
              </div>
              <button className="x-btn" onClick={() => setOpenCourseId(null)} aria-label="Close">×</button>
            </div>
            <div className="modal-doms">
              {modalCourse.domains.map(did => (
                <DomainTag key={did} domain={DOMAIN_MAP[did]} />
              ))}
              {modalCourse.partnerRequired && <span className="pill pill-warn">Partner Network required</span>}
            </div>
            <div className="modal-modules">
              {modalCourse.modules.map((mod, mi) => (
                <div key={mi}>
                  <div className="module-name">{mi + 1}. {mod.name}</div>
                  <ul className="module-lessons">
                    {mod.lessons.map((lesson, li) => (
                      <li key={li}>{lesson}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="modal-foot">
              <a className="link-btn" href={modalCourse.url} target="_blank" rel="noopener noreferrer">
                Open course on Skilljar ↗
              </a>
              <button
                className={!!progress.courses[modalCourse.id] ? 'btn-done is-done' : 'btn btn-secondary'}
                onClick={() => toggleCourse(modalCourse.id)}
              >
                {!!progress.courses[modalCourse.id] ? '✓ Done' : 'Mark done'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
