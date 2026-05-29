# Mobile Responsive Web Design — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the CCA-F Study Hub web app usable on 375–430px phone screens by adding a hamburger-driven sidebar drawer and a complete `@media (max-width: 480px)` CSS block covering every screen.

**Architecture:** Four files change — `App.jsx`, `Sidebar.jsx`, `PageTopbar.jsx`, and `index.css`. Tasks 1–4 each own exactly one file and are fully independent; run all four in parallel. Task 5 is an integration smoke-check that runs after all four complete.

**Tech Stack:** React 18, Vite, plain CSS, Vitest + React Testing Library (`@testing-library/react`, `@testing-library/user-event`), jsdom

---

## File Map

| File | Task | What changes |
|------|------|-------------|
| `web/src/App.jsx` | 1 | Add `sidebarOpen` state; pass `isOpen`/`onClose` to Sidebar; render backdrop div; pass `onMenuClick` to PageTopbar |
| `web/src/components/Sidebar.jsx` | 2 | Accept `isOpen`/`onClose` props; apply `is-open` class; call `onClose` on NavLink clicks |
| `web/src/components/PageTopbar.jsx` | 3 | Add hamburger button; add `topbar-ref-btn` class to Reference button; split exam label into long/short spans |
| `web/src/index.css` | 4 | Add `.topbar-left`, `.topbar-hamburger`, `.topbar-exam-short` base rules; append complete `@media (max-width: 480px)` block |

Tests live in existing files:
- `web/src/App.test.jsx` — add one test (Task 1)
- `web/src/components/components.test.jsx` — add Sidebar and PageTopbar describe blocks (Tasks 2 & 3)

---

## Task 1: App.jsx — Sidebar State Wiring

**Files:**
- Modify: `web/src/App.jsx`
- Test: `web/src/App.test.jsx`

**Context:** `App.jsx` is the root component. It renders `<Sidebar>` and `<PageTopbar>` inside a `<div className="app-layout">`. There is no Router in this file — `BrowserRouter` lives in `main.jsx`; tests wrap with `MemoryRouter`.

- [ ] **Step 1: Write the failing test**

Open `web/src/App.test.jsx` and add this test inside the existing `describe('App routing', ...)` block:

```jsx
it('renders sidebar-backdrop element', () => {
  const { container } = render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>)
  expect(container.querySelector('.sidebar-backdrop')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
cd web && npm test -- --reporter=verbose 2>&1 | grep -A 3 "sidebar-backdrop"
```

Expected: `AssertionError: expected null to be in the document`

- [ ] **Step 3: Implement the changes**

Replace the entire `web/src/App.jsx` with:

```jsx
import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import PageTopbar from './components/PageTopbar'
import Dashboard from './screens/Dashboard'
import ExamBlueprint from './screens/ExamBlueprint'
import StudyPlan from './screens/StudyPlan'
import Courses from './screens/Courses'
import Projects from './screens/Projects'
import DomainDeepDive from './screens/DomainDeepDive'
import KeyConcepts from './screens/KeyConcepts'
import ExamDayChecklist from './screens/ExamDayChecklist'
import Profile from './screens/Profile'
import MobileDownload from './screens/MobileDownload'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div
        className={`sidebar-backdrop${sidebarOpen ? ' is-open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <main className="app-main">
        <PageTopbar onMenuClick={() => setSidebarOpen(true)} />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/blueprint" element={<ExamBlueprint />} />
          <Route path="/plan" element={<StudyPlan />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/domain/:id" element={<DomainDeepDive />} />
          <Route path="/concepts" element={<KeyConcepts />} />
          <Route path="/exam-day" element={<ExamDayChecklist />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/mobile" element={<MobileDownload />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Run all tests**

```bash
cd web && npm test
```

Expected: all tests pass including the new sidebar-backdrop test.

- [ ] **Step 5: Commit**

```bash
git add web/src/App.jsx web/src/App.test.jsx
git commit -m "feat: add sidebarOpen state and backdrop to App"
```

---

## Task 2: Sidebar.jsx — Drawer Mode

**Files:**
- Modify: `web/src/components/Sidebar.jsx`
- Test: `web/src/components/components.test.jsx`

**Context:** `Sidebar.jsx` is a self-contained component using `useTheme` and `useProgress` hooks (both read from localStorage — they work fine in jsdom). It renders an `<aside className="sidebar">` with nav links via `NavLink` from react-router-dom. Currently it takes no props.

- [ ] **Step 1: Write the failing tests**

Open `web/src/components/components.test.jsx`. Add this import at the top alongside the existing imports:

```jsx
import { MemoryRouter } from 'react-router-dom'
import Sidebar from './Sidebar'
```

Then append this describe block at the bottom of the file:

```jsx
describe('Sidebar', () => {
  it('does not have is-open class by default', () => {
    const { container } = render(
      <MemoryRouter><Sidebar /></MemoryRouter>
    )
    expect(container.querySelector('.sidebar')).not.toHaveClass('is-open')
  })

  it('has is-open class when isOpen prop is true', () => {
    const { container } = render(
      <MemoryRouter><Sidebar isOpen={true} onClose={() => {}} /></MemoryRouter>
    )
    expect(container.querySelector('.sidebar')).toHaveClass('is-open')
  })

  it('calls onClose when a nav link is clicked', async () => {
    const onClose = vi.fn()
    render(
      <MemoryRouter>
        <Sidebar isOpen={true} onClose={onClose} />
      </MemoryRouter>
    )
    await userEvent.click(document.querySelector('.sb-item'))
    expect(onClose).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd web && npm test -- --reporter=verbose 2>&1 | grep -A 3 "Sidebar"
```

Expected: `is-open` class test fails; `onClose` test fails.

- [ ] **Step 3: Implement the changes**

Replace `web/src/components/Sidebar.jsx` with:

```jsx
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

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const { theme, toggleTheme } = useTheme()
  const { progress, stats } = useProgress()

  const activePhase =
    PHASES.find((p) => p.tasks.some((t) => !progress.tasks[t.id])) ??
    PHASES[PHASES.length - 1]
  const hoursLeft = Math.round((stats.hoursTotal - stats.hoursDone) * 10) / 10

  return (
    <aside className={`sidebar${isOpen ? ' is-open' : ''}`}>
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
            onClick={onClose}
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
            onClick={onClose}
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
            onClick={onClose}
          >
            <span className="sb-glyph">{glyph}</span>
            <span>{label}</span>
          </NavLink>
        ))}

        <NavLink
          to="/profile"
          className={({ isActive }) => `sb-item${isActive ? ' is-active' : ''}`}
          style={{ marginTop: 'auto' }}
          onClick={onClose}
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
```

- [ ] **Step 4: Run all tests**

```bash
cd web && npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/Sidebar.jsx web/src/components/components.test.jsx
git commit -m "feat: add drawer mode to Sidebar (isOpen/onClose props)"
```

---

## Task 3: PageTopbar.jsx — Hamburger Button + Mobile Labels

**Files:**
- Modify: `web/src/components/PageTopbar.jsx`
- Test: `web/src/components/components.test.jsx`

**Context:** `PageTopbar.jsx` renders a sticky `<header className="topbar">` with page title on the left and two buttons on the right. On mobile, the hamburger replaces the left gap, the Reference button is hidden (accessible via sidebar), and the exam button label is shortened. The component uses `useProgress`, `useLocation`, and `useNavigate` — all work in jsdom with `MemoryRouter`.

- [ ] **Step 1: Write the failing tests**

Open `web/src/components/components.test.jsx`. Add this import at the top:

```jsx
import PageTopbar from './PageTopbar'
```

Append this describe block at the bottom:

```jsx
describe('PageTopbar', () => {
  it('renders a hamburger menu button', () => {
    render(<MemoryRouter><PageTopbar onMenuClick={() => {}} /></MemoryRouter>)
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument()
  })

  it('calls onMenuClick when hamburger button is clicked', async () => {
    const onMenuClick = vi.fn()
    render(<MemoryRouter><PageTopbar onMenuClick={onMenuClick} /></MemoryRouter>)
    await userEvent.click(screen.getByRole('button', { name: /open menu/i }))
    expect(onMenuClick).toHaveBeenCalledTimes(1)
  })

  it('renders short exam label span', () => {
    const { container } = render(<MemoryRouter><PageTopbar onMenuClick={() => {}} /></MemoryRouter>)
    expect(container.querySelector('.topbar-exam-short')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd web && npm test -- --reporter=verbose 2>&1 | grep -A 3 "PageTopbar"
```

Expected: all three PageTopbar tests fail.

- [ ] **Step 3: Implement the changes**

Replace `web/src/components/PageTopbar.jsx` with:

```jsx
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { DOMAINS } from '../data/index'

const ROUTE_META = {
  '/': { title: 'Dashboard', sub: 'Your Claude Certified Architect – Foundations prep at a glance' },
  '/blueprint': { title: 'Exam Blueprint', sub: '5 domains · 60 questions · 120 minutes' },
  '/plan': { title: 'Study Plan', sub: '4-phase roadmap, ~47.5 hours hands-on' },
  '/courses': { title: 'Courses', sub: 'Anthropic Academy · free via Skilljar' },
  '/projects': { title: 'Projects', sub: 'Hands-on builds that reinforce each domain' },
  '/concepts': { title: 'Key Concepts', sub: 'Quick reference for exam day' },
  '/exam-day': { title: 'Exam Day Checklist', sub: 'One last gut-check before you sit the exam' },
  '/profile': { title: 'Profile', sub: 'Account & settings' },
  '/mobile': { title: 'Mobile App', sub: 'Download the iOS & Android companion' },
}

function daysUntil(dateStr) {
  return Math.ceil((new Date(dateStr) - new Date()) / 86_400_000)
}

export default function PageTopbar({ onMenuClick }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { progress, setExamDate } = useProgress()
  const [modalOpen, setModalOpen] = useState(false)
  const [dateInput, setDateInput] = useState(progress.examDate ?? '')

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
  const examBtnShort =
    examDays !== null
      ? examDays > 0
        ? `${examDays}d`
        : 'Today!'
      : '—'

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
        <div className="topbar-left">
          <button
            className="topbar-hamburger"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <rect y="3" width="18" height="2" rx="1" fill="currentColor" />
              <rect y="8" width="18" height="2" rx="1" fill="currentColor" />
              <rect y="13" width="14" height="2" rx="1" fill="currentColor" />
            </svg>
          </button>
          <div>
            <h1 className="topbar-title">{meta.title}</h1>
            {meta.sub && <div className="topbar-sub">{meta.sub}</div>}
          </div>
        </div>
        <div className="topbar-right">
          <button className="top-btn topbar-ref-btn" onClick={() => navigate('/concepts')}>
            ✦ Reference
          </button>
          <button
            className="top-btn primary"
            onClick={() => { setDateInput(progress.examDate ?? ''); setModalOpen(true) }}
          >
            📅{' '}
            <span className="topbar-exam-long">{examBtnLabel}</span>
            <span className="topbar-exam-short">{examBtnShort}</span>
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
```

- [ ] **Step 4: Run all tests**

```bash
cd web && npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/PageTopbar.jsx web/src/components/components.test.jsx
git commit -m "feat: add hamburger button and mobile label variants to PageTopbar"
```

---

## Task 4: index.css — Complete Mobile Media Query Block

**Files:**
- Modify: `web/src/index.css`

**Context:** All CSS changes live in `index.css`. This task has two parts: (a) add base rules for new classes outside any media query, and (b) append the full `@media (max-width: 480px)` block at the very end of the file. There are no unit tests for CSS — verification is visual in the browser.

- [ ] **Step 1: Add base rules for new classes**

Open `web/src/index.css`. Find the `/* =================== Topbar =================== */` section (around line 261). After the last topbar rule in that section (`.top-btn .kbd { ... }`), add:

```css
/* Topbar — hamburger + label split (desktop defaults) */
.topbar-left {
  display: flex;
  align-items: flex-end;
  gap: 10px;
}

.topbar-hamburger {
  display: none; /* shown only on mobile */
  align-items: center;
  justify-content: center;
  padding: 6px;
  color: var(--text);
  border-radius: 6px;
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  transition: color .12s, background .12s;
}
.topbar-hamburger:hover {
  color: var(--text);
  background: var(--surface-2);
}

.topbar-exam-short { display: none; } /* shown only on mobile */
```

- [ ] **Step 2: Append the mobile media query block**

At the very end of `web/src/index.css`, append:

```css
/* =================== Mobile (≤480px) =================== */

@media (max-width: 480px) {

  /* ── Global spacing ── */
  :root {
    --pad: 16px;
    --gap: 12px;
  }

  .screen,
  .screen-container {
    padding: 16px 16px 80px;
  }

  /* ── Topbar ── */
  .topbar {
    padding: 12px 16px;
    align-items: center;
  }
  .topbar-left {
    align-items: center;
    gap: 8px;
  }
  .topbar-hamburger {
    display: flex;
  }
  .topbar-sub {
    display: none;
  }
  .topbar-ref-btn {
    display: none;
  }
  .topbar-exam-long {
    display: none;
  }
  .topbar-exam-short {
    display: inline;
  }

  /* ── Sidebar drawer ── */
  /* NOTE: the 960px media query sets .sidebar { display: none }.
     We must override it here or the drawer is invisible even when open. */
  .sidebar {
    display: flex; /* override display:none from the 960px query */
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 100;
    transform: translateX(-100%);
    transition: transform 0.22s ease;
  }
  .sidebar.is-open {
    transform: translateX(0);
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.4);
  }
  .sidebar-backdrop {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 99;
    backdrop-filter: blur(2px);
  }
  .sidebar-backdrop.is-open {
    display: block;
  }

  /* ── Dashboard ── */
  .hero {
    grid-template-columns: 1fr;
  }
  .hero-r {
    display: none;
  }
  .hero-title {
    font-size: 22px;
  }
  .hero-meta {
    gap: 14px;
  }
  .dom-row {
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto;
    gap: 6px 8px;
  }
  .dom-row-l  { grid-area: 1 / 1; }
  .dom-row-r  { grid-area: 1 / 2; }
  .dom-row-bar { grid-area: 2 / 1 / 3 / 3; }
  .dom-row-q  { display: none; }

  /* ── Exam Blueprint ── */
  .bp-donut {
    grid-template-columns: 1fr;
    justify-items: center;
  }
  .donut-legend {
    width: 100%;
  }
  .exp-cols {
    grid-template-columns: 1fr;
  }

  /* ── Study Plan ── */
  .phase-head {
    grid-template-columns: auto 1fr auto;
    grid-template-rows: auto auto;
    gap: 4px 14px;
  }
  .phase-num  { grid-area: 1 / 1; }
  .phase-name { grid-area: 1 / 2; }
  .phase-head .exp-chev { grid-area: 1 / 3; }
  .phase-week { grid-area: 2 / 1 / 3 / 4; font-size: 11px; }
  .phase-goal { display: none; }
  .phase-head .pill { display: none; }

  /* ── Courses ── */
  .filter-row {
    flex-wrap: wrap;
  }
  .modal-veil {
    padding: 0;
    align-items: flex-end;
  }
  .modal {
    border-radius: 14px 14px 0 0;
    max-height: 90vh;
    width: 100%;
    max-width: 100%;
  }

  /* ── Projects ── */
  .proj-grid {
    grid-template-columns: 1fr;
  }

  /* ── Domain Deep Dive ── */
  .dom-hero-r {
    display: none;
  }

  /* ── Key Concepts ── */
  .ref-grid {
    grid-template-columns: 1fr;
  }
  .ref-api,
  .ref-models,
  .ref-mcp,
  .ref-cc,
  .ref-patt,
  .ref-anti {
    grid-column: 1;
    grid-row: auto;
  }
  .ref-dl-row {
    grid-template-columns: 1fr;
  }
  .cc-grid {
    grid-template-columns: 1fr;
  }

  /* ── Exam Day ── */
  .exam-hero {
    grid-template-columns: 1fr;
  }
  .exam-ready {
    display: none;
  }
  .exam-meta {
    grid-template-columns: repeat(2, 1fr);
  }

}
```

- [ ] **Step 3: Run the dev server and verify visually**

```bash
cd web && npm run dev
```

Open `http://localhost:5173` in a browser. Open DevTools → toggle device toolbar → set to iPhone SE (375 × 667) or custom 375px width.

Check each screen at 375px:

| Screen | What to verify |
|--------|---------------|
| Any screen | Sidebar is hidden; hamburger appears in topbar left |
| Any screen | Tapping hamburger slides in the sidebar drawer from left |
| Any screen | Tapping backdrop or a nav link closes the drawer |
| Dashboard | Ring chart hidden; cert info spans full width; domain rows show name+pct on row 1, progress bar on row 2 |
| Exam Blueprint | Donut SVG stacks above legend; expanded domain body shows topics above anti-patterns |
| Study Plan | Phase header shows num+name+chevron on row 1, week range on row 2; goal text hidden in header |
| Courses | Filter chips wrap; course cards single column; module modal opens as bottom sheet |
| Projects | Project cards single column |
| Domain Deep Dive | Stats panel (right side of hero) hidden |
| Key Concepts | All cards single column; definition rows stack dt above dd |
| Exam Day | 4 meta cells become 2×2; big readiness % hidden |
| Profile | No visible change — already single column |

- [ ] **Step 4: Commit**

```bash
git add web/src/index.css
git commit -m "feat: add mobile CSS — drawer, topbar, and per-screen layouts at ≤480px"
```

---

## Task 5: Integration Smoke Check

**Depends on:** Tasks 1, 2, 3, and 4 all merged to the branch.

**Context:** This task verifies everything works together end-to-end after all four parallel tasks are integrated.

- [ ] **Step 1: Run the full test suite**

```bash
cd web && npm test
```

Expected: all tests pass with no failures.

- [ ] **Step 2: Start dev server and verify the hamburger open/close flow**

```bash
cd web && npm run dev
```

In a browser at 375px width:

1. Load `/` (Dashboard) — sidebar should be hidden, hamburger visible in topbar
2. Click hamburger — sidebar drawer slides in from left, backdrop appears
3. Click any nav link (e.g. Exam Blueprint) — drawer closes, screen changes
4. Open drawer again — click the backdrop — drawer closes without navigating
5. Open drawer, press Escape — drawer does NOT close (no keyboard shortcut needed; acceptable)
6. Resize to 800px — sidebar should be back in its normal sticky position, hamburger hidden

- [ ] **Step 3: Verify desktop is unchanged**

At full desktop width (1280px):

1. Sidebar visible, sticky, no `is-open` class in DOM
2. Topbar shows title + subtitle + Reference button + full exam label
3. All screen layouts match pre-mobile state

- [ ] **Step 4: Push the branch**

```bash
git push
```
