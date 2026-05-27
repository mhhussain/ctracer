import { useNavigate } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { CERT, DOMAINS, PHASES, COURSES, PROJECTS } from '../data/index'
import Card from '../components/Card'
import ProgressBar from '../components/ProgressBar'
import Checkbox from '../components/Checkbox'
import DomainTag from '../components/DomainTag'
import StatTile from '../components/StatTile'
import Pill from '../components/Pill'

// Precompute per-domain course/project lookup for performance
const COURSES_BY_DOMAIN = COURSES.reduce((acc, c) => {
  c.domains.forEach((d) => { acc[d] = [...(acc[d] ?? []), c] })
  return acc
}, {})
const PROJECTS_BY_DOMAIN = PROJECTS.reduce((acc, p) => {
  p.domains.forEach((d) => { acc[d] = [...(acc[d] ?? []), p] })
  return acc
}, {})

function RingProgress({ pct }) {
  const r = 56
  const c = 2 * Math.PI * r
  const off = c - (pct / 100) * c
  return (
    <svg viewBox="0 0 140 140" width="140" height="140" className="ring">
      <circle cx="70" cy="70" r={r} fill="none" stroke="var(--border)" strokeWidth="10" />
      <circle
        cx="70" cy="70" r={r} fill="none" stroke="var(--accent)"
        strokeWidth="10" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={off}
        transform="rotate(-90 70 70)"
      />
    </svg>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { progress, loading, toggleTask, stats } = useProgress()
  if (loading) return null

  const activePhase =
    PHASES.find((p) => p.tasks.some((t) => !progress.tasks[t.id])) ??
    PHASES[PHASES.length - 1]

  const todayTasks = activePhase.tasks
    .filter((t) => !progress.tasks[t.id])
    .slice(0, 4)

  return (
    <div className="screen">
      <div className="dash-grid">

        {/* Hero */}
        <Card className="hero">
          <div className="hero-l">
            <div className="hero-eyebrow">Active certification track</div>
            <h2 className="hero-title">{CERT.name}</h2>
            <div className="hero-meta">
              <span><span className="meta-k">Cost</span>{CERT.cost}</span>
              <span><span className="meta-k">Format</span>{CERT.format}</span>
              <span><span className="meta-k">Duration</span>{CERT.duration}</span>
              <span><span className="meta-k">Pass</span>{CERT.passing}</span>
            </div>
            <div className="hero-tags">
              <Pill tone="accent">Launched {CERT.launched}</Pill>
              <Pill tone="neutral" dim>Proctored · no docs allowed</Pill>
              <Pill tone="neutral" dim>Partner Network required to sit</Pill>
            </div>
          </div>
          <div className="hero-r">
            <div className="hero-ring">
              <RingProgress pct={stats.overall} />
              <div className="hero-ring-label">
                <div className="hero-ring-num">{stats.overall}%</div>
                <div className="hero-ring-sub">overall ready</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Phase pipeline */}
        <Card className="phases">
          <div className="card-head">
            <h3>Study phase pipeline</h3>
            <button className="link-btn" onClick={() => navigate('/plan')}>View full plan →</button>
          </div>
          <div className="phase-pipe">
            {PHASES.map((p, i) => {
              const done = p.tasks.filter((t) => progress.tasks[t.id]).length
              const pct = Math.round((done / p.tasks.length) * 100)
              const isActive = activePhase.id === p.id
              const isDone = done === p.tasks.length
              return (
                <div key={p.id} style={{ display: 'contents' }}>
                  <button
                    className={`phase-node${isActive ? ' is-active' : ''}${isDone ? ' is-done' : ''}`}
                    onClick={() => navigate('/plan')}
                  >
                    <div className="phase-node-num">{isDone ? '✓' : `0${p.num}`}</div>
                    <div className="phase-node-name">{p.name}</div>
                    <div className="phase-node-week">{p.week}</div>
                    <div className="phase-node-bar">
                      <ProgressBar value={pct} color={isActive ? 'accent' : 'muted'} height={3} />
                    </div>
                    <div className="phase-node-prog">{done}/{p.tasks.length} tasks</div>
                  </button>
                  {i < PHASES.length - 1 && (
                    <div className={`phase-connector${isDone ? ' is-done' : ''}`} />
                  )}
                </div>
              )
            })}
          </div>
        </Card>

        {/* Stats row */}
        <div className="stat-row">
          <StatTile label="Total study hours" value={`${stats.hoursTotal}h`} sub={`${stats.hoursDone}h done`} />
          <StatTile label="Courses" value={`${stats.coursesDone}/${stats.coursesTotal}`} sub={`${stats.partnerDone}/${stats.partnerTotal} required`} />
          <StatTile label="Projects" value={`${stats.projectsDone}/${stats.projectsTotal}`} sub={`${stats.projectsWip} in progress`} />
          <StatTile label="Practice score" value={progress.practiceScore ?? '—'} sub="target 80%+" />
        </div>

        {/* Domain progress */}
        <Card className="dom-prog">
          <div className="card-head">
            <h3>Progress by exam domain</h3>
            <button className="link-btn" onClick={() => navigate('/blueprint')}>Exam blueprint →</button>
          </div>
          <div className="dom-prog-list">
            {DOMAINS.map((d) => {
              const relCourses = COURSES_BY_DOMAIN[d.id] ?? []
              const relProjects = PROJECTS_BY_DOMAIN[d.id] ?? []
              const done =
                relCourses.filter((c) => progress.courses[c.id]).length +
                relProjects.filter((p) => progress.projects[p.id] === 'complete').length
              const total = relCourses.length + relProjects.length
              const pct = total > 0 ? Math.round((done / total) * 100) : 0
              return (
                <button
                  key={d.id}
                  className="dom-row"
                  onClick={() => navigate(`/domain/${d.id}`)}
                >
                  <div className="dom-row-l">
                    <DomainTag domain={d} />
                    <span className="dom-row-name">{d.name}</span>
                  </div>
                  <div className="dom-row-bar">
                    <ProgressBar value={pct} color={d.color} height={5} />
                  </div>
                  <div className="dom-row-r">
                    <span className="dom-row-pct">{pct}%</span>
                    <span className="dom-row-q">{d.questions}q · {d.weight}%</span>
                  </div>
                </button>
              )
            })}
          </div>
        </Card>

        {/* Today panel */}
        <Card className="today">
          <div className="card-head">
            <h3>What to do today</h3>
            <Pill tone="accent">Phase {activePhase.num} · {activePhase.name}</Pill>
          </div>
          <p className="today-goal">{activePhase.goal}</p>
          <div className="today-list">
            {todayTasks.length === 0 ? (
              activePhase.num < PHASES.length ? (
                <div className="today-empty">
                  Phase {activePhase.num} complete — open the study plan to start phase{" "}
                  {activePhase.num + 1}.
                </div>
              ) : (
                <div className="today-empty">
                  All phases complete — you're fully prepared. Review or book the exam!
                </div>
              )
            ) : (
              todayTasks.map((t) => (
                <Checkbox
                  key={t.id}
                  checked={!!progress.tasks[t.id]}
                  onChange={() => toggleTask(t.id)}
                  label={t.label}
                  sub={`${t.hours}h · ${t.kind}`}
                />
              ))
            )}
          </div>
          <button className="ghost-btn" onClick={() => navigate('/plan')}>
            Open phase {activePhase.num} →
          </button>
        </Card>

      </div>
    </div>
  )
}
