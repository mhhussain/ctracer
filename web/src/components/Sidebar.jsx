import { NavLink } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import { useProgress } from '../hooks/useProgress'
import ProgressBar from './ProgressBar'
import { DOMAINS, PHASES } from '../data/index'

const GENERAL_ITEMS = [
  { to: '/', label: 'Dashboard', glyph: '◉', end: true },
  { to: '/blueprint', label: 'Exam Blueprint', glyph: '◐' },
  { to: '/plan', label: 'Study Plan', glyph: '▤' },
  { to: '/courses', label: 'Courses', glyph: '▦' },
  { to: '/projects', label: 'Projects', glyph: '▣' },
]

const PREP_ITEMS = [
  { to: '/concepts', label: 'Key Concepts', glyph: '≡' },
  { to: '/exam-day', label: 'Exam Day', glyph: '★' },
]

function SidebarExamBar({ examDate }) {
  const daysLeft = Math.ceil((new Date(examDate) - new Date()) / 86_400_000)
  const totalDays = 42
  const elapsed = totalDays - Math.max(daysLeft, 0)
  const pct = Math.min(Math.round((elapsed / totalDays) * 100), 100)
  const color = daysLeft > 14 ? 'accent' : 'amber'
  const label = daysLeft > 0 ? `${daysLeft}d` : 'Today!'
  return (
    <>
      <div className="sb-foot-row">
        <span>Exam in</span>
        <span className="sb-foot-pct">{label}</span>
      </div>
      <ProgressBar value={pct} color={color} height={4} />
    </>
  )
}

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme()
  const { progress, stats } = useProgress()

  const activePhase =
    PHASES.find((p) => p.tasks.some((t) => !progress.tasks[t.id])) ??
    PHASES[PHASES.length - 1]
  const hoursLeft = Math.round((stats.hoursTotal - stats.hoursDone) * 10) / 10

  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <div className="sb-logo">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <rect x="2" y="2" width="20" height="20" rx="5" fill="var(--accent)" opacity="0.16" />
            <path
              d="M7 12.5 L10 16 L17 8"
              stroke="var(--accent)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="sb-brand-text">
          <div className="sb-brand-1">Study Plan</div>
          <div className="sb-brand-2">Claude Certified Architect – Foundations</div>
        </div>
      </div>

      <nav className="sb-nav">
        <div className="sb-group-label">General</div>
        {GENERAL_ITEMS.map(({ to, label, glyph, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `sb-item${isActive ? ' is-active' : ''}`}
          >
            <span className="sb-glyph">{glyph}</span>
            <span>{label}</span>
          </NavLink>
        ))}

        <div className="sb-group-label">Domain deep dives</div>
        {DOMAINS.map((d) => (
          <NavLink
            key={d.id}
            to={`/domain/${d.id}`}
            className={({ isActive }) => `sb-item sb-item-sub${isActive ? ' is-active' : ''}`}
          >
            <span className={`sb-domain-dot dtag-${d.color}`} />
            <span className="sb-domain-num">D{d.num}</span>
            <span>{d.short}</span>
            <span className="sb-domain-w">{d.weight}%</span>
          </NavLink>
        ))}

        <div className="sb-group-label">Prep finish</div>
        {PREP_ITEMS.map(({ to, label, glyph }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sb-item${isActive ? ' is-active' : ''}`}
          >
            <span className="sb-glyph">{glyph}</span>
            <span>{label}</span>
          </NavLink>
        ))}

        <NavLink
          to="/profile"
          className={({ isActive }) => `sb-item${isActive ? ' is-active' : ''}`}
          style={{ marginTop: 'auto' }}
        >
          <span className="sb-glyph">👤</span>
          <span>Profile</span>
        </NavLink>
      </nav>

      <div className="sb-foot">
        <div className="sb-foot-row">
          <span>Overall</span>
          <span className="sb-foot-pct">{stats.overall}%</span>
        </div>
        <ProgressBar value={stats.overall} color="accent" height={4} />
        {progress.examDate && <SidebarExamBar examDate={progress.examDate} />}
        <div className="sb-foot-meta">
          <span>Phase {activePhase.num}</span>
          <span>·</span>
          <span>{activePhase.name}</span>
          <span>·</span>
          <span>{hoursLeft}h left</span>
        </div>
        <button
          className="sidebar-theme-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? '☀' : '🌙'}
        </button>
      </div>
    </aside>
  )
}
