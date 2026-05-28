import React, { useState } from 'react'
import { DOMAINS, PHASES } from '../data/index'
import { useProgress } from '../hooks/useProgress'
import Card from '../components/Card'
import ProgressBar from '../components/ProgressBar'
import Checkbox from '../components/Checkbox'
import DomainTag from '../components/DomainTag'

const DOMAIN_MAP = Object.fromEntries(DOMAINS.map((d) => [d.id, d]))

export default function StudyPlan() {
  const { progress, loading, toggleTask } = useProgress()

  const phaseProgress = (phase) => {
    if (phase.tasks.length === 0) return 0
    const done = phase.tasks.filter((t) => progress.tasks[t.id]).length
    return Math.round((done / phase.tasks.length) * 100)
  }

  const isPhaseDone = (phase) => phaseProgress(phase) === 100

  const searchParams = new URLSearchParams(window.location.search)
  const urlPhase = searchParams.get('phase')

  const [openPhase, setOpenPhase] = useState(() => {
    if (urlPhase && PHASES.find((p) => p.id === urlPhase)) return urlPhase
    return PHASES.find((p) => !isPhaseDone(p))?.id ?? PHASES[0].id
  })

  if (loading) {
    return (
      <div className="screen-container">
        <section className="sec">
          <header className="sec-head">
            <div>
              <h2 className="sec-title">Study plan</h2>
              <p className="sec-desc">A 3–5 week track for the CCA-F. Click any phase to expand its tasks.</p>
            </div>
          </header>
        </section>
        <p>Loading…</p>
      </div>
    )
  }

  return (
    <div className="screen-container">
      <section className="sec">
        <header className="sec-head">
          <div>
            <h2 className="sec-title">Study plan</h2>
            <p className="sec-desc">A 3–5 week track for the CCA-F. Click any phase to expand its tasks.</p>
          </div>
        </header>
      </section>

      {/* Roadmap card */}
      <Card className="roadmap">
        <div className="roadmap-meta">
          <div>
            <div className="rm-label">Total timeline</div>
            <div className="rm-value">5 weeks · ~47.5 hours</div>
          </div>
          <div>
            <div className="rm-label">Track</div>
            <div className="rm-value">CCA-F</div>
          </div>
          <div>
            <div className="rm-label">Approach</div>
            <div className="rm-value">Sequential phases</div>
          </div>
        </div>
        <div className="rm-line">
          {PHASES.map((phase, i) => (
            <React.Fragment key={phase.id}>
              <button
                className={`rm-stop${openPhase === phase.id ? ' is-open' : ''}${isPhaseDone(phase) ? ' is-done' : ''}`}
                onClick={() => setOpenPhase(phase.id)}
              >
                <div className="rm-stop-dot">{isPhaseDone(phase) ? '✓' : phase.num}</div>
                <div className="rm-stop-name">{phase.name}</div>
                <div className="rm-stop-week">{phase.week} · {phase.hours}h</div>
                <div className="rm-stop-bar">
                  <ProgressBar value={phaseProgress(phase)} color={isPhaseDone(phase) ? 'ok' : 'accent'} height={3} />
                </div>
              </button>
              {i < PHASES.length - 1 && <div className="rm-link" />}
            </React.Fragment>
          ))}
        </div>
      </Card>

      {/* Phase accordion stack */}
      <div className="phase-stack">
        {PHASES.map((phase) => {
          const done = phase.tasks.filter((t) => progress.tasks[t.id]).length
          const isOpen = openPhase === phase.id
          return (
            <Card key={phase.id} className={`phase-card${isOpen ? ' is-open' : ''}`}>
              <button
                className="phase-head"
                onClick={() => setOpenPhase(isOpen ? null : phase.id)}
              >
                <span className="phase-num">Phase {phase.num}</span>
                <span className="phase-name">{phase.name}</span>
                <span className="phase-week">{phase.week}</span>
                <span className="phase-goal">{phase.goal}</span>
                <span className="pill pill-dim">{done}/{phase.tasks.length} tasks</span>
                <span className="pill pill-dim">{phase.hours}h</span>
                <span className="exp-chev">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && (
                <div className="phase-body">
                  <div className="phase-tasks">
                    {phase.tasks.map((task) => (
                      <div key={task.id} className="task-row">
                        <Checkbox
                          checked={!!progress.tasks[task.id]}
                          onChange={() => toggleTask(task.id)}
                          label={task.label}
                        />
                        <div className="task-meta">
                          <span className={`pill ${task.kind === 'project' ? 'pill-accent' : 'pill-dim'}`}>
                            {task.kind}
                          </span>
                          {task.domain && <DomainTag domain={DOMAIN_MAP[task.domain]} />}
                          <span className="task-hours">{task.hours}h</span>
                        </div>
                      </div>
                    ))}
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
