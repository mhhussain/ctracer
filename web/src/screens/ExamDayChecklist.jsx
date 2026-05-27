import { useNavigate } from 'react-router-dom'
import { CERT, COURSES, EXAM_DAY_CHECKLIST, PROJECTS } from '../data/index'
import Checkbox from '../components/Checkbox'
import { useProgress } from '../hooks/useProgress'

export default function ExamDayChecklist() {
  const navigate = useNavigate()
  const { progress, toggleExamDay } = useProgress()

  const x1 = COURSES.filter((c) => c.partnerRequired).every((c) => !!progress.courses[c.id])
  const x2 = PROJECTS.every((p) => progress.projects[p.id] === 'complete')

  const checked = (item) => {
    if (item.id === 'x1') return x1
    if (item.id === 'x2') return x2
    return !!progress.exam_day[item.id]
  }

  const doneCount = EXAM_DAY_CHECKLIST.filter((c) => checked(c)).length
  const allDone = doneCount === EXAM_DAY_CHECKLIST.length

  return (
    <div className="screen-exam">
      <div className={`exam-hero${allDone ? ' is-ready' : ''}`}>
        <div className="exam-hero-left">
          <div className="exam-eyebrow">Exam logistics</div>
          <div className="exam-meta-grid">
            <div className="exam-meta-item">
              <span className="exam-meta-label">Duration</span>
              <span className="exam-meta-val">120 min</span>
            </div>
            <div className="exam-meta-item">
              <span className="exam-meta-label">Questions</span>
              <span className="exam-meta-val">60</span>
            </div>
            <div className="exam-meta-item">
              <span className="exam-meta-label">Passing</span>
              <span className="exam-meta-val">720 / 1000</span>
            </div>
            <div className="exam-meta-item">
              <span className="exam-meta-label">Reference</span>
              <span className="exam-meta-val">None allowed</span>
            </div>
          </div>
        </div>
        <div className="exam-hero-right">
          <div className="exam-ready-pct">
            {Math.round((doneCount / EXAM_DAY_CHECKLIST.length) * 100)}%
          </div>
          <div className="exam-ready-label">
            {doneCount} / {EXAM_DAY_CHECKLIST.length} ready
          </div>
        </div>
      </div>

      <div className="exam-body">
        <div className="exam-list">
          <h3>Pre-exam readiness</h3>
          {EXAM_DAY_CHECKLIST.map((item) => {
            const isAuto = item.id === 'x1' || item.id === 'x2'
            const isChecked = checked(item)
            return (
              <div key={item.id} className="exam-item">
                <Checkbox
                  checked={isChecked}
                  onChange={isAuto ? undefined : () => toggleExamDay(item.id)}
                  disabled={isAuto}
                />
                <div className="exam-item-content">
                  <span className="exam-item-label">{item.label}</span>
                  {isAuto && (
                    <span className="exam-item-sub">auto-tracked from your progress</span>
                  )}
                </div>
                <span className={`pill ${item.critical ? 'pill-warn' : 'pill-neutral'}`}>
                  {item.critical ? 'Required' : 'Recommended'}
                </span>
              </div>
            )
          })}
        </div>

        <div className="exam-expect">
          <h3>What to expect</h3>
          <ul>
            <li>Questions are scenario-based — no simple recall</li>
            <li>Expect agentic architecture traps (the hardest domain)</li>
            <li>MCP primitives are tested heavily — know Tools vs Resources vs Prompts</li>
            <li>Anti-pattern recognition is a core test skill</li>
            <li>No reference materials allowed — study the Quick Reference beforehand</li>
            <li>
              High scores are achievable — most architects who prepare thoroughly pass on first
              attempt
            </li>
          </ul>
          <div className="exam-expect-foot">
            <a
              className="btn btn-secondary"
              href={CERT.registerUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Register at Skilljar ↗
            </a>
            <button className="btn-link" onClick={() => navigate('/concepts')}>
              Open quick reference →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
