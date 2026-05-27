import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { COURSES, DOMAINS } from '../data/index'
import { useProgress } from '../hooks/useProgress'
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
      <h1 className="screen-title">Courses</h1>

      <div className="filter-chips">
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

      <div className="course-grid">
        {filtered.map(c => {
          const done = !!progress.courses[c.id]
          return (
            <div key={c.id} className={`course-card${c.partnerRequired ? ' is-required' : ''}${done ? ' is-done' : ''}`}>
              {c.partnerRequired && (
                <div className="course-flag">Partner Network · required</div>
              )}
              <div className="course-head">
                <h3 className="course-name">{c.name}</h3>
                <button
                  className={`btn ${done ? 'btn-done' : 'btn-secondary'}`}
                  onClick={() => toggleCourse(c.id)}
                >
                  {done ? '✓ Done' : 'Mark done'}
                </button>
              </div>
              <p className="course-blurb">{c.blurb}</p>
              <div className="course-pills">
                <span className="pill pill-neutral">{c.hours}h</span>
                <span className="pill pill-neutral">{c.level}</span>
              </div>
              <div className="course-tags">
                {c.domains.map(did => (
                  <span key={did} onClick={() => navigate(`/domain/${did}`)} style={{ cursor: 'pointer' }}>
                    <DomainTag domain={DOMAIN_MAP[did]} />
                  </span>
                ))}
              </div>
              <div className="course-actions">
                <button className="btn-link" onClick={() => setOpenCourseId(c.id)}>
                  Module list →
                </button>
                <a className="btn-link" href={c.url} target="_blank" rel="noopener noreferrer">
                  Open on Skilljar ↗
                </a>
              </div>
            </div>
          )
        })}
      </div>

      {openCourseId && modalCourse && (
        <>
          <div className="modal-veil" onClick={() => setOpenCourseId(null)} />
          <div className="modal" role="dialog">
            <div className="modal-head">
              <div className="modal-eyebrow">{modalCourse.level} · {modalCourse.hours}h</div>
              <h2 className="modal-title">{modalCourse.name}</h2>
              <p className="modal-blurb">{modalCourse.blurb}</p>
              <button className="modal-close" onClick={() => setOpenCourseId(null)} aria-label="Close">×</button>
            </div>
            <div className="modal-tags">
              {modalCourse.domains.map(did => (
                <DomainTag key={did} domain={DOMAIN_MAP[did]} />
              ))}
              {modalCourse.partnerRequired && <span className="pill pill-warn">Partner Network required</span>}
            </div>
            <div className="modal-modules">
              {modalCourse.modules.map((mod, mi) => (
                <div key={mi} className="modal-section">
                  <div className="modal-section-name">{mi + 1}. {mod.name}</div>
                  <ul className="modal-lessons">
                    {mod.lessons.map((lesson, li) => (
                      <li key={li}>{lesson}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="modal-foot">
              <a className="btn-link" href={modalCourse.url} target="_blank" rel="noopener noreferrer">
                Open course on Skilljar ↗
              </a>
              <button
                className={`btn ${!!progress.courses[modalCourse.id] ? 'btn-done' : 'btn-secondary'}`}
                onClick={() => toggleCourse(modalCourse.id)}
              >
                {!!progress.courses[modalCourse.id] ? '✓ Done' : 'Mark done'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
