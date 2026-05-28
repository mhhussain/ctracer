import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { DOMAINS } from '../data/index'

const ROUTE_META = {
  '/': { title: 'Dashboard', sub: 'Your CCA-F prep at a glance' },
  '/blueprint': { title: 'Exam Blueprint', sub: '60 questions · 90 minutes · pass at 70%' },
  '/plan': { title: 'Study Plan', sub: 'A 3–5 week track for the CCA-F' },
  '/courses': { title: 'Courses', sub: 'Free courses at anthropic.skilljar.com' },
  '/projects': { title: 'Projects', sub: 'Hands-on builds that reinforce each domain' },
  '/concepts': { title: 'Key Concepts', sub: 'Quick reference for exam day' },
  '/exam-day': { title: 'Exam Day Checklist', sub: 'One last gut-check before you sit the exam' },
  '/profile': { title: 'Profile', sub: 'Account & settings' },
  '/mobile': { title: 'Mobile App', sub: 'Download the iOS & Android companion' },
}

function daysUntil(dateStr) {
  return Math.ceil((new Date(dateStr) - new Date()) / 86_400_000)
}

export default function PageTopbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { progress, setExamDate } = useProgress()
  const [modalOpen, setModalOpen] = useState(false)
  const [dateInput, setDateInput] = useState(progress.examDate ?? '')

  // Derive title/sub from path, including dynamic /domain/:id
  let meta = ROUTE_META[location.pathname]
  if (!meta) {
    const domainMatch = location.pathname.match(/^\/domain\/(.+)$/)
    if (domainMatch) {
      const d = DOMAINS.find((x) => x.id === domainMatch[1])
      meta = d
        ? { title: d.name, sub: `D${d.num} of 5 · ${d.weight}% of exam` }
        : { title: 'Domain', sub: '' }
    } else {
      meta = { title: '', sub: '' }
    }
  }

  const examDays = progress.examDate ? daysUntil(progress.examDate) : null
  const examBtnLabel =
    examDays !== null
      ? examDays > 0
        ? `Exam: ${examDays}d`
        : 'Exam: Today!'
      : 'Exam day'

  function handleSave() {
    if (dateInput) setExamDate(dateInput)
    setModalOpen(false)
  }

  function handleClear() {
    setExamDate(null)
    setDateInput('')
    setModalOpen(false)
  }

  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="topbar-title">{meta.title}</h1>
          {meta.sub && <div className="topbar-sub">{meta.sub}</div>}
        </div>
        <div className="topbar-right">
          <button className="top-btn" onClick={() => navigate('/concepts')}>
            ✦ Reference
          </button>
          <button className="top-btn primary" onClick={() => { setDateInput(progress.examDate ?? ''); setModalOpen(true) }}>
            📅 {examBtnLabel}
          </button>
        </div>
      </header>

      {modalOpen && (
        <div className="modal-veil" onClick={() => setModalOpen(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="modal-eyebrow">Exam date</div>
                <h2 className="modal-title">Set your exam date</h2>
              </div>
              <button className="x-btn" onClick={() => setModalOpen(false)} aria-label="Close">×</button>
            </div>
            <div style={{ padding: '24px 28px' }}>
              <input
                type="date"
                className="input"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div className="modal-foot">
              <button className="primary-btn" onClick={handleSave} disabled={!dateInput}>
                Save date
              </button>
              {progress.examDate && (
                <button className="ghost-btn" onClick={handleClear}>
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
