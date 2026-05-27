import { NavLink } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/blueprint', label: 'Exam Blueprint' },
  { to: '/plan', label: 'Study Plan' },
  { to: '/courses', label: 'Courses' },
  { to: '/projects', label: 'Projects' },
  { to: '/concepts', label: 'Key Concepts' },
  { to: '/exam-day', label: 'Exam Day' },
  { to: '/profile', label: 'Profile' },
  { to: '/mobile', label: 'Mobile App' },
]

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme()

  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-logo">ctracer</span>
        <span className="sidebar-cert">CCA-F</span>
      </div>
      <div className="sidebar-nav">
        {NAV_ITEMS.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}
          >
            {label}
          </NavLink>
        ))}
      </div>
      <div className="sidebar-footer">
        <button
          className="sidebar-theme-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? '☀' : '🌙'}
        </button>
      </div>
    </nav>
  )
}
