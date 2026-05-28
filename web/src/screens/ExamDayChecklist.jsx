import { useNavigate } from 'react-router-dom'
import { CERT, COURSES, EXAM_DAY_CHECKLIST, PROJECTS } from '../data/index'
import Checkbox from '../components/Checkbox'
import Card from '../components/Card'
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
    <div className="screen-container">
      <section className="sec">
        <header className="sec-head">
          <div>
            <h2 className="sec-title">Exam day</h2>
            <p className="sec-desc">One last gut-check before you sit the exam.</p>
          </div>
        </header>
      </section>

      <Card className={`exam-hero${allDone ? ' is-ready' : ''}`}>
        <div className="exam-hero-l">
          <div className="exam-hero-eyebrow">Exam logistics</div>
          <div className="exam-meta">
            <div className="exam-meta-cell">
              <div className="emc-l">Duration</div>
              <div className="emc-v">120 min</div>
            </div>
            <div className="exam-meta-cell">
              <div className="emc-l">Questions</div>
              <div className="emc-v">60</div>
            </div>
            <div className="exam-meta-cell">
              <div className="emc-l">Passing</div>
              <div className="emc-v">720 / 1000</div>
            </div>
            <div className="exam-meta-cell">
              <div className="emc-l">Reference</div>
              <div className="emc-v">None allowed</div>
            </div>
          </div>
        </div>
        <div className="exam-hero-r">
          <div className="exam-ready">
            <div className="exam-ready-pct">
              {Math.round((doneCount / EXAM_DAY_CHECKLIST.length) * 100)}%
            </div>
            <div className="exam-ready-l">{doneCount} / {EXAM_DAY_CHECKLIST.length} ready</div>
          </div>
        </div>
      </Card>

      <div className="exam-cols">
        <Card className="exam-list">
          <h3>Pre-exam readiness</h3>
          <div className="exam-list-body">
            {EXAM_DAY_CHECKLIST.map((item) => {
              const isAuto = item.id === 'x1' || item.id === 'x2'
              const isChecked = checked(item)
              return (
                <div key={item.id} className={`exam-row${item.critical ? ' is-critical' : ''}`}>
                  <Checkbox
                    checked={isChecked}
                    onChange={isAuto ? undefined : () => toggleExamDay(item.id)}
                    disabled={isAuto}
                    label={item.label}
                    sub={isAuto ? 'auto-tracked from your progress' : null}
                  />
                  <div className="exam-row-r">
                    <span className={`pill ${item.critical ? 'pill-warn' : 'pill-dim'}`}>
                      {item.critical ? 'Required' : 'Recommended'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="exam-expect">
          <h3>What to expect</h3>
          <ul className="expect-list">
            <li>Questions are scenario-based — no simple recall</li>
            <li>Expect agentic architecture traps (the hardest domain)</li>
            <li>MCP primitives are tested heavily — know Tools vs Resources vs Prompts</li>
            <li>Anti-pattern recognition is a core test skill</li>
            <li>No reference materials allowed — study the Quick Reference beforehand</li>
            <li>High scores are achievable — most architects who prepare thoroughly pass on first attempt</li>
          </ul>
          <div className="expect-foot">
            <a
              className="primary-btn"
              href={CERT.registerUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Register at Skilljar ↗
            </a>
            <button className="ghost-btn" onClick={() => navigate('/concepts')}>
              Open quick reference →
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}
