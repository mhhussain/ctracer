# Topbar, Exam Date & Bug Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared PageTopbar component with an exam date picker, display exam countdowns on Dashboard and Sidebar, rewrite the Sidebar to its full design, and implement ExamBlueprint/StudyPlan/Courses screens from their current stubs.

**Architecture:** All changes are in `web/src/`. The PageTopbar renders above `<Routes>` in App.jsx, reads the current path via `useLocation`, and manages the exam date modal. Exam date is stored in `progress.examDate` via localStorage (same pattern as other progress fields). Sidebar, ExamBlueprint, StudyPlan, and Courses are full rewrites from current stubs, using CSS classes already defined in `index.css`.

**Tech Stack:** React 18, React Router v6, Vite, Vitest, localStorage for persistence. All CSS classes already exist in `web/src/index.css` — no CSS changes except Task 1.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `web/src/index.css` | Modify | Sidebar width fix + checkbox double-border removal |
| `web/src/lib/storage.js` | Modify | Add `examDate: null` to `DEFAULT_PROGRESS` |
| `web/src/hooks/useProgress.js` | Modify | Add `setExamDate` action, expose `progress.examDate` |
| `web/src/hooks/useProgress.test.js` | Modify | Add test for `setExamDate` |
| `web/src/components/Sidebar.jsx` | Rewrite | Full sb-* class design with progress footer + exam bar |
| `web/src/components/PageTopbar.jsx` | Create | Route-aware title/subtitle, Reference + Exam day buttons, date modal |
| `web/src/App.jsx` | Modify | Render `<PageTopbar />` above `<Routes>` |
| `web/src/screens/ExamBlueprint.jsx` | Rewrite | Full implementation from stub |
| `web/src/screens/StudyPlan.jsx` | Rewrite | Full implementation from stub |
| `web/src/screens/Courses.jsx` | Rewrite | Full implementation from stub |
| `web/src/screens/Dashboard.jsx` | Modify | Add exam date countdown stat to hero-meta |

---

## Task 1: CSS fixes — sidebar width + checkbox double-border

**Files:**
- Modify: `web/src/index.css`

- [ ] **Step 1: Add sidebar fixed width**

Find the `.sidebar` rule (around line 139). Add two properties:

```css
.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-2);
  border-right: 1px solid var(--border);
  padding: 18px 14px 14px;
  width: 240px;        /* ADD */
  flex-shrink: 0;      /* ADD */
}
```

- [ ] **Step 2: Remove double-border from .checkbox-row**

Find `.checkbox-row` (around line 1808). Remove `border-bottom` and the `:last-child` override:

```css
/* BEFORE */
.checkbox-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 0;
  cursor: pointer;
  border-bottom: 1px solid var(--border);  ← REMOVE THIS LINE
}

.checkbox-row:last-child {
  border-bottom: none;                      ← REMOVE THIS ENTIRE RULE
}

/* AFTER */
.checkbox-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 0;
  cursor: pointer;
}
```

- [ ] **Step 3: Verify with dev server**

```bash
cd web && npm run dev
```

Open `http://localhost:5173`. Confirm:
- Sidebar is fixed width and does not expand when text in the footer changes
- No visible extra borders on rows in any checklist (check Dashboard's "What to do today" panel)

- [ ] **Step 4: Commit**

```bash
git add web/src/index.css
git commit -m "fix: sidebar static width and remove checkbox double-border"
```

---

## Task 2: Storage — add examDate field

**Files:**
- Modify: `web/src/lib/storage.js`

- [ ] **Step 1: Add examDate to DEFAULT_PROGRESS**

```js
const KEY = 'ctracer_progress'

const DEFAULT_PROGRESS = {
  courses: {},
  projects: {},
  tasks: {},
  exam_day: {},
  practiceScore: null,
  examDate: null,        // ← ADD: ISO date string "YYYY-MM-DD" or null
}
```

- [ ] **Step 2: Run tests to confirm nothing breaks**

```bash
cd web && npm test
```

Expected: all existing tests pass (the spread `{ ...DEFAULT_PROGRESS, ...JSON.parse(raw) }` means existing stored data without `examDate` will get `null` from DEFAULT_PROGRESS — safe).

- [ ] **Step 3: Commit**

```bash
git add web/src/lib/storage.js
git commit -m "feat: add examDate field to progress storage"
```

---

## Task 3: Hook — add setExamDate action

**Files:**
- Modify: `web/src/hooks/useProgress.js`
- Modify: `web/src/hooks/useProgress.test.js`

- [ ] **Step 1: Write the failing test first**

Open `web/src/hooks/useProgress.test.js` and add after the last existing `it(...)` block:

```js
it('setExamDate stores and returns exam date', () => {
  const { result } = renderHook(() => useProgress())
  act(() => result.current.setExamDate('2026-07-01'))
  expect(result.current.progress.examDate).toBe('2026-07-01')
})

it('setExamDate can be cleared with null', () => {
  const { result } = renderHook(() => useProgress())
  act(() => result.current.setExamDate('2026-07-01'))
  act(() => result.current.setExamDate(null))
  expect(result.current.progress.examDate).toBeNull()
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
cd web && npm test
```

Expected: 2 failures — `result.current.setExamDate is not a function`

- [ ] **Step 3: Add setExamDate to useProgress**

In `web/src/hooks/useProgress.js`, add the action after `setPracticeScore`:

```js
const setExamDate = useCallback(
  (date) => update((p) => ({ ...p, examDate: date ?? null })),
  [update]
)
```

And add it to the return object:

```js
return {
  progress,
  toggleCourse,
  toggleTask,
  setProject,
  toggleExamDay,
  setPracticeScore,
  setExamDate,    // ← ADD
  stats: { … },
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
cd web && npm test
```

Expected: all tests pass including the 2 new ones.

- [ ] **Step 5: Commit**

```bash
git add web/src/hooks/useProgress.js web/src/hooks/useProgress.test.js
git commit -m "feat: add setExamDate action to useProgress hook"
```

---

## Task 4: Sidebar rewrite

**Files:**
- Rewrite: `web/src/components/Sidebar.jsx`

The current Sidebar is a plain nav with `sidebar-*` CSS classes. Replace it entirely with the `sb-*` design that includes brand, domain deep dives section, progress footer, and optional exam countdown bar.

- [ ] **Step 1: Write the full Sidebar component**

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
          <div className="sb-brand-2">CCA-F</div>
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
```

- [ ] **Step 2: Verify in browser**

```bash
cd web && npm run dev
```

Check:
- Brand area shows checkmark logo + "Study Plan" / "CCA-F"
- Nav shows General, Domain deep dives (5 domains with colored dots), Prep finish sections
- Profile link is at the bottom of the nav
- Footer shows Overall % progress bar
- If no examDate set, no exam bar appears
- Theme toggle button works

- [ ] **Step 3: Commit**

```bash
git add web/src/components/Sidebar.jsx
git commit -m "feat: rewrite Sidebar with sb-* classes, domain nav, and progress footer"
```

---

## Task 5: PageTopbar component

**Files:**
- Create: `web/src/components/PageTopbar.jsx`

This component uses `useLocation()` (works because `<BrowserRouter>` wraps everything in `main.jsx`) to derive the page title and subtitle. It renders the shared topbar with Reference and Exam day buttons. The Exam day button opens an inline modal with a date input.

- [ ] **Step 1: Create PageTopbar.jsx**

Create `web/src/components/PageTopbar.jsx`:

```jsx
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
```

- [ ] **Step 2: Verify component renders (will wire into App next task)**

This task just creates the file. Proceed to Task 6 to wire it in.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/PageTopbar.jsx
git commit -m "feat: add PageTopbar component with route-aware title and exam date modal"
```

---

## Task 6: Wire PageTopbar into App.jsx

**Files:**
- Modify: `web/src/App.jsx`

- [ ] **Step 1: Add PageTopbar import and render**

Replace `web/src/App.jsx` with:

```jsx
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
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <PageTopbar />
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

- [ ] **Step 2: Verify in browser**

```bash
cd web && npm run dev
```

Check:
- Topbar shows "Dashboard" + "Your CCA-F prep at a glance" on the home route
- "Reference" button navigates to `/concepts`
- "Exam day" button opens the date picker modal
- Setting a date closes the modal; button label updates to "Exam: Nd"
- Sidebar exam countdown bar appears after setting a date
- Navigating to `/blueprint` updates the topbar title to "Exam Blueprint"
- Navigating to `/domain/d1` updates the topbar title to the domain name

- [ ] **Step 3: Commit**

```bash
git add web/src/App.jsx
git commit -m "feat: wire PageTopbar into app shell"
```

---

## Task 7: ExamBlueprint full implementation

**Files:**
- Rewrite: `web/src/screens/ExamBlueprint.jsx`

The current file is a stub (`return <div>Exam Blueprint</div>`). Replace with the full implementation. Key correctness points:
- SVG donut gets explicit `width={220} height={220}` (without these, the `auto` column collapses)
- Each expandable domain card uses `<Card className="exp-card">` (not a bare `<div>`)
- `.donut-center` is an HTML overlay on `.donut-wrap`, not SVG `<text>`

- [ ] **Step 1: Write the full ExamBlueprint screen**

Replace `web/src/screens/ExamBlueprint.jsx` with:

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DOMAINS } from '../data/index'
import Card from '../components/Card'

// Arc math for donut slices. Angles in degrees, -90 offset so first slice starts at top.
function arc(startDeg, endDeg) {
  const cx = 110, cy = 110, R = 88, r = 56
  const a1 = ((startDeg - 90) * Math.PI) / 180
  const a2 = ((endDeg - 90) * Math.PI) / 180
  const large = endDeg - startDeg > 180 ? 1 : 0
  const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1)
  const x2 = cx + R * Math.cos(a2), y2 = cy + R * Math.sin(a2)
  const x3 = cx + r * Math.cos(a2), y3 = cy + r * Math.sin(a2)
  const x4 = cx + r * Math.cos(a1), y4 = cy + r * Math.sin(a1)
  return `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${r} ${r} 0 ${large} 0 ${x4} ${y4} Z`
}

const totalWeight = DOMAINS.reduce((s, d) => s + d.weight, 0)
let acc = 0
const slices = DOMAINS.map((d) => {
  const start = acc
  const end = acc + d.weight
  acc = end
  return { ...d, startDeg: (start / totalWeight) * 360, endDeg: (end / totalWeight) * 360 }
})

export default function ExamBlueprint() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(null)
  const [expanded, setExpanded] = useState('d1')

  return (
    <div className="screen-container">
      <section className="sec">
        <div className="bp-grid">
          {/* Donut + legend */}
          <Card className="bp-donut">
            <div className="donut-wrap">
              <svg viewBox="0 0 220 220" width={220} height={220}>
                {slices.map((s) => (
                  <path
                    key={s.id}
                    d={arc(s.startDeg, s.endDeg)}
                    className={`donut-slice dtag-${s.color}${hovered === s.id ? ' is-hov' : hovered ? ' is-dim' : ''}`}
                    onMouseEnter={() => setHovered(s.id)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => setExpanded(s.id)}
                  />
                ))}
              </svg>
              <div className="donut-center">
                <div className="donut-c-1">60</div>
                <div className="donut-c-2">questions</div>
              </div>
            </div>
            <div className="donut-legend">
              {DOMAINS.map((d) => (
                <button
                  key={d.id}
                  className={`legend-row${hovered === d.id ? ' is-hov' : ''}`}
                  onClick={() => setExpanded(d.id)}
                  onMouseEnter={() => setHovered(d.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <span className={`legend-sw dtag-${d.color}`} />
                  <span className="legend-num">D{d.num}</span>
                  <span className="legend-name">{d.short}</span>
                  <span className="legend-w">{d.weight}%</span>
                  <span className="legend-q">{d.questions}q</span>
                </button>
              ))}
            </div>
          </Card>

          {/* Weight & difficulty bars */}
          <Card className="bp-bars">
            <h3>Weight & difficulty</h3>
            <p className="muted-sm">Domain 1 is the largest and the hardest — allocate time accordingly.</p>
            <div className="bars">
              {DOMAINS.map((d) => (
                <div
                  key={d.id}
                  className="bar-row"
                  onMouseEnter={() => setHovered(d.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div className="bar-row-head">
                    <span
                      className={`dtag dtag-${d.color}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/domain/${d.id}`)}
                    >
                      D{d.num}
                    </span>
                    <span className={`pill ${d.difficulty === 'Hardest' ? 'pill-warn' : 'pill-dim'}`}>
                      {d.difficulty}
                    </span>
                  </div>
                  <div className="bar-track">
                    <div
                      className={`bar-fill dtag-${d.color}`}
                      style={{ width: `${(d.weight / 27) * 100}%` }}
                    />
                    <span className="bar-lab">{d.weight}% · {d.questions} questions</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Expandable domain cards — Card wrapper gives border + background */}
        <div className="bp-expand">
          {DOMAINS.map((d) => {
            const isOpen = expanded === d.id
            return (
              <Card key={d.id} className={`exp-card${isOpen ? ' is-open' : ''}`}>
                <button className="exp-head" onClick={() => setExpanded(isOpen ? null : d.id)}>
                  <span className={`exp-stripe dtag-${d.color}`} />
                  <span className={`dtag dtag-${d.color}`}>D{d.num}</span>
                  <span className="exp-name">{d.name}</span>
                  <span className="exp-meta">
                    <span className="pill pill-dim">{d.questions}q</span>
                    <span className="pill pill-dim">{d.weight}%</span>
                    {d.difficulty === 'Hardest' && <span className="pill pill-warn">Hardest</span>}
                  </span>
                  <span className="exp-chev">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <div className="exp-body">
                    <p className="exp-blurb">{d.blurb}</p>
                    <div className="exp-cols">
                      <div>
                        <div className="col-head">Key topics</div>
                        <ul className="topic-list">
                          {d.topics.map((t) => (
                            <li key={t.name}>
                              <span className="topic-name">{t.name}</span>
                              <span className="topic-desc"> — {t.desc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="col-head">Anti-patterns to know</div>
                        <ul className="anti-list">
                          {d.antiPatterns.map((ap, i) => (
                            <li key={i}><span className="anti-x">✕</span>{ap}</li>
                          ))}
                        </ul>
                        <button
                          className="link-btn"
                          style={{ marginTop: 12, display: 'block' }}
                          onClick={() => navigate(`/domain/${d.id}`)}
                        >
                          Open domain deep dive →
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

```bash
cd web && npm run dev
```

Navigate to `/blueprint`. Check:
- Donut pie chart renders with 5 colored slices (all visible)
- Legend appears to the right of the donut with domain names and weights
- "Weight & difficulty" card shows colored horizontal bars
- Clicking a domain row in the donut legend expands that domain's card below
- Expanded accordion cards have a border and background (from `Card` wrapper)
- Accordion stripe (left edge color), domain tag, name, pills, and chevron render correctly
- Clicking the `D1` tag in the bars section navigates to `/domain/d1`

- [ ] **Step 3: Commit**

```bash
git add web/src/screens/ExamBlueprint.jsx
git commit -m "feat: implement ExamBlueprint screen with donut chart and domain accordions"
```

---

## Task 8: StudyPlan full implementation

**Files:**
- Rewrite: `web/src/screens/StudyPlan.jsx`

The current file is a stub. The domain tag in each task row is a navigable button (the bug fix is built in from the start).

- [ ] **Step 1: Write the full StudyPlan screen**

Replace `web/src/screens/StudyPlan.jsx` with:

```jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DOMAINS, PHASES } from '../data/index'
import { useProgress } from '../hooks/useProgress'
import Card from '../components/Card'
import ProgressBar from '../components/ProgressBar'
import Checkbox from '../components/Checkbox'
import DomainTag from '../components/DomainTag'

const DOMAIN_MAP = Object.fromEntries(DOMAINS.map((d) => [d.id, d]))

export default function StudyPlan() {
  const navigate = useNavigate()
  const { progress, loading, toggleTask } = useProgress()

  const phaseProgress = (phase) => {
    if (phase.tasks.length === 0) return 0
    const done = phase.tasks.filter((t) => progress.tasks[t.id]).length
    return Math.round((done / phase.tasks.length) * 100)
  }

  const isPhaseDone = (phase) => phaseProgress(phase) === 100

  const [openPhase, setOpenPhase] = useState(() => {
    return PHASES.find((p) => !isPhaseDone(p))?.id ?? PHASES[0].id
  })

  if (loading) {
    return (
      <div className="screen-container">
        <p>Loading…</p>
      </div>
    )
  }

  return (
    <div className="screen-container">
      <section className="sec">
        {/* Roadmap overview card */}
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
                            {task.domain && (
                              <button
                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                                onClick={() => navigate(`/domain/${task.domain}`)}
                              >
                                <DomainTag domain={DOMAIN_MAP[task.domain]} />
                              </button>
                            )}
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
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Navigate to `/plan`. Check:
- Roadmap card shows 4 phase stops with progress bars
- Clicking a phase stop opens that phase's accordion below
- Tasks show Checkbox + pill + domain tag + hours
- Clicking a domain tag (e.g., D1) navigates to `/domain/d1`
- Checking a task updates the progress bar on the phase stop
- No double horizontal line under each task row (only one border from `.task-row`)

- [ ] **Step 3: Commit**

```bash
git add web/src/screens/StudyPlan.jsx
git commit -m "feat: implement StudyPlan screen with navigable domain tags"
```

---

## Task 9: Courses full implementation

**Files:**
- Rewrite: `web/src/screens/Courses.jsx`

The mark-done button uses the `toggle-done` CSS class (purpose-built: `font-size: 11px; padding: 4px 9px; width: auto; flex-shrink: 0`), not the full-width `btn btn-secondary`. This is the bug fix, built in from the start.

- [ ] **Step 1: Write the full Courses screen**

Replace `web/src/screens/Courses.jsx` with:

```jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { COURSES, DOMAINS } from '../data/index'
import { useProgress } from '../hooks/useProgress'
import Card from '../components/Card'
import DomainTag from '../components/DomainTag'

const DOMAIN_MAP = Object.fromEntries(DOMAINS.map((d) => [d.id, d]))

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

  const filtered = COURSES.filter((c) => {
    if (filter === 'partner') return c.partnerRequired === true
    if (filter === 'other') return c.partnerRequired === false
    return true
  })

  const modalCourse = COURSES.find((c) => c.id === openCourseId)

  return (
    <div className="screen-container">
      <section className="sec">
        <header className="sec-head">
          <div>
            <h2 className="sec-title">Courses</h2>
            <p className="sec-desc">Free at anthropic.skilljar.com. The four Partner Network courses are the official pre-cert sequence.</p>
          </div>
          <div className="filter-row">
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
        </header>
      </section>

      <div className="course-grid">
        {filtered.map((c) => {
          const done = !!progress.courses[c.id]
          return (
            <Card
              key={c.id}
              className={`course-card${c.partnerRequired ? ' is-required' : ''}${done ? ' is-done' : ''}`}
            >
              {c.partnerRequired && (
                <div className="card-flag">Partner Network · required</div>
              )}
              <div className="course-top">
                <h3 className="course-name">{c.name}</h3>
                {/* toggle-done: purpose-built small button, not the full-width btn class */}
                <button
                  className={`toggle-done${done ? ' is-done' : ''}`}
                  onClick={() => toggleCourse(c.id)}
                >
                  {done ? '✓ Done' : 'Mark done'}
                </button>
              </div>
              <p className="course-blurb">{c.blurb}</p>
              <div className="course-meta">
                <span className="pill pill-dim">{c.hours}h</span>
                <span className="pill pill-dim">{c.level}</span>
              </div>
              <div className="course-doms">
                {c.domains.map((did) => (
                  <button
                    key={did}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                    onClick={() => navigate(`/domain/${did}`)}
                  >
                    <DomainTag domain={DOMAIN_MAP[did]} />
                  </button>
                ))}
              </div>
              <div className="course-actions">
                <button className="ghost-btn-sm" onClick={() => setOpenCourseId(c.id)}>
                  Module list →
                </button>
                <a className="ghost-btn-sm" href={c.url} target="_blank" rel="noopener noreferrer">
                  Open on Skilljar ↗
                </a>
              </div>
            </Card>
          )
        })}
      </div>

      {openCourseId && modalCourse && (
        <div className="modal-veil" onClick={() => setOpenCourseId(null)}>
          <div className="modal" role="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="modal-eyebrow">{modalCourse.level} · {modalCourse.hours}h</div>
                <h2 className="modal-title">{modalCourse.name}</h2>
                <p className="modal-blurb">{modalCourse.blurb}</p>
              </div>
              <button className="x-btn" onClick={() => setOpenCourseId(null)} aria-label="Close">×</button>
            </div>
            <div className="modal-doms">
              {modalCourse.domains.map((did) => (
                <DomainTag key={did} domain={DOMAIN_MAP[did]} />
              ))}
              {modalCourse.partnerRequired && (
                <span className="pill pill-warn">Partner Network required</span>
              )}
            </div>
            <div className="modal-modules">
              {modalCourse.modules.map((mod, mi) => (
                <div key={mi}>
                  <div className="module-head">
                    <span className="module-i">{String(mi + 1).padStart(2, '0')}</span>
                    <span className="module-name">{mod.name}</span>
                  </div>
                  <ul className="module-lessons">
                    {mod.lessons.map((lesson, li) => (
                      <li key={li}>{lesson}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="modal-foot">
              <a className="ghost-btn-sm" href={modalCourse.url} target="_blank" rel="noopener noreferrer">
                Open course on Skilljar ↗
              </a>
              <button
                className={`toggle-done${!!progress.courses[modalCourse.id] ? ' is-done' : ''}`}
                onClick={() => toggleCourse(modalCourse.id)}
              >
                {!!progress.courses[modalCourse.id] ? '✓ Done' : 'Mark done'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Navigate to `/courses`. Check:
- Course cards render with border/background (from `Card`)
- "Mark done" button is small and compact (not full-width) — roughly same height as the course name
- Clicking "Mark done" toggles the button to green "✓ Done"
- Filter chips (All / Partner Network / Recommended) work
- "Module list →" opens the course modal
- Domain tags in cards navigate to the domain page

- [ ] **Step 3: Commit**

```bash
git add web/src/screens/Courses.jsx
git commit -m "feat: implement Courses screen with compact toggle-done button"
```

---

## Task 10: Dashboard — exam date countdown stat

**Files:**
- Modify: `web/src/screens/Dashboard.jsx`

When `progress.examDate` is set, add a 5th stat to the `.hero-meta` row showing days until the exam.

- [ ] **Step 1: Add exam countdown to hero-meta**

In `web/src/screens/Dashboard.jsx`, find the `hero-meta` div (around line 59). Add the exam countdown stat after the existing 4 stats:

```jsx
<div className="hero-meta">
  <span><span className="meta-k">Cost</span>{CERT.cost}</span>
  <span><span className="meta-k">Format</span>{CERT.format}</span>
  <span><span className="meta-k">Duration</span>{CERT.duration}</span>
  <span><span className="meta-k">Pass</span>{CERT.passing}</span>
  {progress.examDate && (() => {
    const days = Math.ceil((new Date(progress.examDate) - new Date()) / 86_400_000)
    return (
      <span>
        <span className="meta-k">Exam in</span>
        {days > 0 ? `${days} days` : 'Today!'}
      </span>
    )
  })()}
</div>
```

- [ ] **Step 2: Verify in browser**

Set an exam date via the topbar modal. Navigate to `/`. Check:
- The hero card now shows a 5th stat "Exam in N days" next to Pass
- The Sidebar footer also shows the exam countdown bar
- Clearing the exam date (via topbar modal "Clear") removes both the hero stat and the sidebar bar

- [ ] **Step 3: Commit**

```bash
git add web/src/screens/Dashboard.jsx
git commit -m "feat: add exam date countdown to Dashboard hero"
```

---

## Final Verification

- [ ] **Run full test suite**

```bash
cd web && npm test
```

Expected: all tests pass.

- [ ] **Full browser walkthrough**

Start dev server and check every modified screen:

| Route | What to verify |
|---|---|
| `/` | Topbar "Dashboard" title + subtitle. Hero meta shows exam date stat if set. Sidebar has domain section and progress footer. |
| `/blueprint` | Donut chart visible. Domain legend to right. Bars card visible. Accordion cards have borders. |
| `/plan` | Roadmap card. Phase accordions open/close. Domain tag buttons navigate. No double borders on task rows. |
| `/courses` | Small compact "Mark done" button. Filter chips. Modal opens/closes. |
| Any domain page | Topbar shows domain name + D-number/weight subtitle. |
| Topbar | "Reference" navigates to `/concepts`. "Exam day" opens date picker. After setting date, button shows "Exam: Nd". |
| Sidebar | Fixed width. Domain deep dives section. Exam countdown bar appears after setting date. |

- [ ] **Push branch for review**

```bash
git push -u origin feature/topbar-examdate-bugs
```
