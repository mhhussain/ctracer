import React, { useState } from 'react'
import { DOMAINS, PHASES } from '../data/index'
import { useProgress } from '../hooks/useProgress'
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
        <h1 className="screen-title">Study Plan</h1>
        <p>Loading…</p>
      </div>
    )
  }

  return (
    <div className="screen-container">
      <h1 className="screen-title">Study Plan</h1>

      {/* Roadmap card */}
      <div className="roadmap">
        <div className="roadmap-meta">
          <span>5 weeks · ~47.5 hours</span>
          <span>Track: CCA-F</span>
          <span>Approach: Sequential phases</span>
        </div>
        <div className="rm-line">
          {PHASES.map((phase, i) => (
            <React.Fragment key={phase.id}>
              <button
                className={`rm-stop${openPhase === phase.id ? ' is-open' : ''}${isPhaseDone(phase) ? ' is-done' : ''}`}
                onClick={() => setOpenPhase(phase.id)}
              >
                <div className="rm-dot">{isPhaseDone(phase) ? '✓' : phase.num}</div>
                <div className="rm-stop-name">{phase.name}</div>
                <div className="rm-stop-meta">{phase.week} · {phase.hours}h</div>
                <ProgressBar value={phaseProgress(phase)} />
              </button>
              {i < PHASES.length - 1 && <div className="rm-link" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Phase accordion stack */}
      <div className="phase-stack">
        {PHASES.map((phase) => {
          const done = phase.tasks.filter((t) => progress.tasks[t.id]).length
          const isOpen = openPhase === phase.id
          return (
            <div key={phase.id} className={`phase-card${isOpen ? ' is-open' : ''}`}>
              <button
                className="phase-head"
                onClick={() => setOpenPhase(isOpen ? null : phase.id)}
              >
                <span className="phase-num">Phase {phase.num}</span>
                <span className="phase-name">{phase.name}</span>
                <span className="phase-week">{phase.week}</span>
                <span className="phase-goal">{phase.goal}</span>
                <span className="pill pill-neutral">{done}/{phase.tasks.length} tasks</span>
                <span className="pill pill-neutral">{phase.hours}h</span>
                <span className="phase-chevron">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && (
                <div className="phase-body">
                  <div className="phase-tasks">
                    {phase.tasks.map((task) => (
                      <div key={task.id} className="task-row">
                        <Checkbox
                          checked={!!progress.tasks[task.id]}
                          onChange={() => toggleTask(task.id)}
                        />
                        <span
                          className={`pill ${task.kind === 'project' ? 'pill-accent' : 'pill-neutral'}`}
                        >
                          {task.kind}
                        </span>
                        {task.domain && <DomainTag domain={DOMAIN_MAP[task.domain]} />}
                        <span className="task-label">{task.label}</span>
                        <span className="task-hours">{task.hours}h</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
