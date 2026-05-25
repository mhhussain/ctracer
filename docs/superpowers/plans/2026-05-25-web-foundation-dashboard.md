# Web Foundation + Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the web app foundation (routing, data layer, storage service, shared components) and a fully implemented Dashboard screen, working on `feature/web-foundation-dashboard`.

**Architecture:** React Router v6 provides URL-based navigation with a persistent Sidebar. A localStorage-backed storage service abstracts progress reads/writes behind a `useProgress` hook. The Dashboard ports ScreenDashboard from `docs/superpowers/specs/screens-a.jsx`, replacing the prototype's navigate/study props with `useNavigate()` and `useProgress()`. Firebase is stubbed — no initialization yet.

**Tech Stack:** Vite + React 18, react-router-dom v6, Vitest, @testing-library/react, jsdom

**Design reference:** `docs/superpowers/specs/` — `data.js`, `screens-a.jsx`, `components.jsx`, `styles.css`

---

### Task 1: Feature branch, dependencies, and test infrastructure

**Files:**
- Modify: `web/package.json`
- Modify: `web/vite.config.js`
- Create: `web/src/test-setup.js`

- [ ] **Step 1: Create the feature branch**

```bash
git checkout main && git pull
git checkout -b feature/web-foundation-dashboard
```

- [ ] **Step 2: Install dependencies**

Run from `web/`:
```bash
npm install react-router-dom
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Configure Vitest in vite.config.js**

Replace the contents of `web/vite.config.js` with:
```js
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.js',
  },
})
```

- [ ] **Step 4: Create test setup file**

Create `web/src/test-setup.js`:
```js
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Add test script to package.json**

In `web/package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Run tests to verify empty suite passes**

Run from `web/`:
```bash
npm test
```
Expected: 0 tests, no errors.

- [ ] **Step 7: Commit**

```bash
git add web/package.json web/package-lock.json web/vite.config.js web/src/test-setup.js
git commit -m "chore: add react-router-dom, vitest, and testing-library to web"
```

---

### Task 2: Data layer

**Files:**
- Create: `web/src/data/index.js`
- Create: `web/src/data/index.test.js`

- [ ] **Step 1: Write the failing test**

Create `web/src/data/index.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { CERT, DOMAINS, PHASES, COURSES, PROJECTS, EXAM_DAY_CHECKLIST } from './index'

describe('data layer', () => {
  it('CERT has required fields', () => {
    expect(CERT.name).toBe('Claude Certified Architect – Foundations')
    expect(CERT.short).toBe('CCA-F')
    expect(CERT.cost).toBe('$99')
    expect(CERT.passing).toBe('720 / 1000')
  })
  it('has 5 domains', () => expect(DOMAINS).toHaveLength(5))
  it('domains have required fields', () => {
    DOMAINS.forEach((d) => {
      expect(d).toHaveProperty('id')
      expect(d).toHaveProperty('num')
      expect(d).toHaveProperty('color')
      expect(d).toHaveProperty('weight')
      expect(d).toHaveProperty('questions')
    })
  })
  it('has 4 phases with tasks', () => {
    expect(PHASES).toHaveLength(4)
    PHASES.forEach((p) => expect(p.tasks.length).toBeGreaterThan(0))
  })
  it('has 9 courses', () => expect(COURSES).toHaveLength(9))
  it('has 5 projects', () => expect(PROJECTS).toHaveLength(5))
  it('has exam day checklist items', () => expect(EXAM_DAY_CHECKLIST.length).toBeGreaterThan(0))
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test
```
Expected: FAIL — `Cannot find module './index'`

- [ ] **Step 3: Create data/index.js**

Port `docs/superpowers/specs/data.js` as an ES module. Remove the `window.CCA_DATA = {...}` assignment at the bottom and add named exports instead. The content (CERT, DOMAINS, PHASES, COURSES, PROJECTS, REFERENCE, EXAM_DAY_CHECKLIST, ANTI_PATTERNS_ALL) stays verbatim.

Create `web/src/data/index.js`:
```js
// Ported from docs/superpowers/specs/data.js — ES module version.
// All CCA-F study content. Never stored in Firestore — hardcoded here.

export const CERT = {
  name: "Claude Certified Architect – Foundations",
  short: "CCA-F",
  launched: "March 12, 2026",
  cost: "$99",
  freeFor: "First 5,000 partner employees",
  format: "60 questions • multiple choice + scenario",
  duration: "120 min",
  passing: "720 / 1000",
  totalQuestions: 60,
  registerUrl: "https://anthropic.skilljar.com/claude-certified-architect-foundations-access-request",
  partnerUrl: "https://anthropic.com/partners",
  academyUrl: "https://anthropic.skilljar.com",
}

// Copy DOMAINS, PHASES, COURSES, PROJECTS, REFERENCE, EXAM_DAY_CHECKLIST,
// ANTI_PATTERNS_ALL verbatim from docs/superpowers/specs/data.js.
// Export each as a named export (replace the window.CCA_DATA block at the
// bottom of that file with individual `export const` declarations above each array).
```

After porting all arrays, replace the `window.CCA_DATA = {...}` block at the end with:
```js
export { CERT, DOMAINS, PHASES, COURSES, PROJECTS, REFERENCE, EXAM_DAY_CHECKLIST, ANTI_PATTERNS_ALL }
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```
Expected: 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add web/src/data/
git commit -m "feat: add CCA-F data layer as ES module"
```

---

### Task 3: Storage service

**Files:**
- Create: `web/src/lib/storage.js`
- Create: `web/src/lib/storage.test.js`

- [ ] **Step 1: Write the failing test**

Create `web/src/lib/storage.test.js`:
```js
import { beforeEach, describe, expect, it } from 'vitest'
import { getProgress, saveProgress, clearProgress } from './storage'

const DEFAULT = { courses: {}, projects: {}, tasks: {}, exam_day: {}, practiceScore: null }

describe('storage', () => {
  beforeEach(() => clearProgress())

  it('returns default shape when nothing is saved', () => {
    expect(getProgress()).toEqual(DEFAULT)
  })

  it('saves and retrieves progress', () => {
    const p = { ...DEFAULT, courses: { c1: true } }
    saveProgress(p)
    expect(getProgress()).toEqual(p)
  })

  it('clearProgress resets to default', () => {
    saveProgress({ ...DEFAULT, courses: { c1: true } })
    clearProgress()
    expect(getProgress()).toEqual(DEFAULT)
  })

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('ctracer_progress', 'not-json')
    expect(getProgress()).toEqual(DEFAULT)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test
```
Expected: FAIL — `Cannot find module './storage'`

- [ ] **Step 3: Implement the storage service**

Create `web/src/lib/storage.js`:
```js
const KEY = 'ctracer_progress'

const DEFAULT_PROGRESS = {
  courses: {},
  projects: {},
  tasks: {},
  exam_day: {},
  practiceScore: null,
}

export function getProgress() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT_PROGRESS }
    return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_PROGRESS }
  }
}

export function saveProgress(progress) {
  localStorage.setItem(KEY, JSON.stringify(progress))
}

export function clearProgress() {
  localStorage.removeItem(KEY)
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```
Expected: all storage tests pass.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/storage.js web/src/lib/storage.test.js
git commit -m "feat: add localStorage-backed storage service"
```

---

### Task 4: Firebase stub and useProgress hook

**Files:**
- Create: `web/src/lib/firebase.js`
- Create: `web/src/hooks/useProgress.js`
- Create: `web/src/hooks/useProgress.test.js`

- [ ] **Step 1: Create firebase stub**

Create `web/src/lib/firebase.js`:
```js
// Firebase will be initialized in a future sprint when a Firebase project exists.
// Screens and hooks import from here; they will start working automatically once
// auth and db are real instances.
export const auth = null
export const db = null
```

- [ ] **Step 2: Write the failing hook test**

Create `web/src/hooks/useProgress.test.js`:
```js
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProgress } from './useProgress'
import { clearProgress } from '../lib/storage'

describe('useProgress', () => {
  beforeEach(() => clearProgress())

  it('starts with empty progress', () => {
    const { result } = renderHook(() => useProgress())
    expect(result.current.progress.courses).toEqual({})
    expect(result.current.progress.tasks).toEqual({})
    expect(result.current.stats.overall).toBe(0)
  })

  it('toggleCourse flips and persists', () => {
    const { result } = renderHook(() => useProgress())
    act(() => result.current.toggleCourse('c1'))
    expect(result.current.progress.courses.c1).toBe(true)
    act(() => result.current.toggleCourse('c1'))
    expect(result.current.progress.courses.c1).toBe(false)
  })

  it('toggleTask flips completion and updates overall', () => {
    const { result } = renderHook(() => useProgress())
    const before = result.current.stats.overall
    act(() => result.current.toggleTask('p1t1'))
    expect(result.current.progress.tasks.p1t1).toBe(true)
    expect(result.current.stats.overall).toBeGreaterThan(before)
  })

  it('setProject updates project status', () => {
    const { result } = renderHook(() => useProgress())
    act(() => result.current.setProject('pr1', 'in_progress'))
    expect(result.current.progress.projects.pr1).toBe('in_progress')
  })

  it('stats reflect completed items', () => {
    const { result } = renderHook(() => useProgress())
    act(() => result.current.toggleCourse('c1'))
    expect(result.current.stats.coursesDone).toBe(1)
    act(() => result.current.setProject('pr1', 'complete'))
    expect(result.current.stats.projectsDone).toBe(1)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npm test
```
Expected: FAIL — `Cannot find module './useProgress'`

- [ ] **Step 4: Implement useProgress**

Create `web/src/hooks/useProgress.js`:
```js
import { useState, useCallback } from 'react'
import { getProgress, saveProgress } from '../lib/storage'
import { COURSES, PROJECTS, PHASES } from '../data/index'

const ALL_TASKS = PHASES.flatMap((p) => p.tasks)
const HOURS_TOTAL = Math.round(ALL_TASKS.reduce((s, t) => s + t.hours, 0) * 10) / 10

export function useProgress() {
  const [progress, setProgress] = useState(getProgress)

  const update = useCallback((fn) => {
    setProgress((prev) => {
      const next = fn(prev)
      saveProgress(next)
      return next
    })
  }, [])

  const toggleCourse = useCallback(
    (id) => update((p) => ({ ...p, courses: { ...p.courses, [id]: !p.courses[id] } })),
    [update]
  )

  const toggleTask = useCallback(
    (id) => update((p) => ({ ...p, tasks: { ...p.tasks, [id]: !p.tasks[id] } })),
    [update]
  )

  const setProject = useCallback(
    (id, status) => update((p) => ({ ...p, projects: { ...p.projects, [id]: status } })),
    [update]
  )

  const toggleExamDay = useCallback(
    (id) => update((p) => ({ ...p, exam_day: { ...p.exam_day, [id]: !p.exam_day[id] } })),
    [update]
  )

  const setPracticeScore = useCallback(
    (score) => update((p) => ({ ...p, practiceScore: score })),
    [update]
  )

  const coursesDone = COURSES.filter((c) => progress.courses[c.id]).length
  const partnerDone = COURSES.filter((c) => c.partnerRequired && progress.courses[c.id]).length
  const partnerTotal = COURSES.filter((c) => c.partnerRequired).length
  const projectsDone = PROJECTS.filter((p) => progress.projects[p.id] === 'complete').length
  const projectsWip = PROJECTS.filter((p) => progress.projects[p.id] === 'in_progress').length
  const tasksDone = ALL_TASKS.filter((t) => progress.tasks[t.id]).length
  const hoursDone = Math.round(
    ALL_TASKS.filter((t) => progress.tasks[t.id]).reduce((s, t) => s + t.hours, 0) * 10
  ) / 10
  const overall = ALL_TASKS.length > 0 ? Math.round((tasksDone / ALL_TASKS.length) * 100) : 0

  return {
    progress,
    toggleCourse,
    toggleTask,
    setProject,
    toggleExamDay,
    setPracticeScore,
    stats: {
      coursesDone,
      coursesTotal: COURSES.length,
      partnerDone,
      partnerTotal,
      projectsDone,
      projectsTotal: PROJECTS.length,
      projectsWip,
      hoursDone,
      hoursTotal: HOURS_TOTAL,
      overall,
    },
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test
```
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add web/src/lib/firebase.js web/src/hooks/useProgress.js web/src/hooks/useProgress.test.js
git commit -m "feat: add firebase stub and useProgress hook"
```

---

### Task 5: Port styles

**Files:**
- Modify: `web/index.html`
- Create: `web/src/index.css`

- [ ] **Step 1: Add Geist fonts to index.html**

In `web/index.html`, add inside `<head>` before the closing tag:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@300..800&family=Geist+Mono:wght@300..800&display=swap" rel="stylesheet">
```

- [ ] **Step 2: Copy prototype styles**

Copy `docs/superpowers/specs/styles.css` to `web/src/index.css`:
```bash
cp docs/superpowers/specs/styles.css web/src/index.css
```

- [ ] **Step 3: Append app shell layout styles to index.css**

Add to the end of `web/src/index.css`:
```css
/* ── App shell layout ── */
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-ui);
  -webkit-font-smoothing: antialiased;
}

.app-layout {
  display: flex;
  min-height: 100vh;
}

.app-main {
  flex: 1;
  overflow: auto;
  min-width: 0;
}

/* ── Sidebar ── */
.sidebar {
  width: 220px;
  flex-shrink: 0;
  background: var(--bg-2);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: var(--pad) 0;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.sidebar-brand {
  padding: 0 var(--pad) var(--pad);
  border-bottom: 1px solid var(--border);
  margin-bottom: var(--gap);
}

.sidebar-logo {
  display: block;
  font-weight: 700;
  font-size: 1rem;
  color: var(--text);
  letter-spacing: -0.02em;
}

.sidebar-cert {
  font-size: 0.75rem;
  color: var(--text-3);
  font-family: var(--font-mono);
}

.sidebar-nav {
  flex: 1;
  padding: 0 calc(var(--pad) / 2);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar-link {
  display: block;
  padding: 8px 12px;
  border-radius: var(--radius);
  color: var(--text-2);
  text-decoration: none;
  font-size: 0.875rem;
  transition: background 0.12s, color 0.12s;
}

.sidebar-link:hover {
  background: var(--surface-2);
  color: var(--text);
}

.sidebar-link.is-active {
  background: var(--surface-3);
  color: var(--text);
  font-weight: 500;
}

/* ── Shared component primitives ── */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--pad);
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--gap);
}

.card-head h3 {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text);
}

.progress-track {
  background: var(--surface-3);
  border-radius: 9999px;
  overflow: hidden;
  width: 100%;
}

.progress-fill {
  border-radius: 9999px;
  transition: width 0.3s ease;
}

.domain-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--domain-color) 16%, transparent);
  color: var(--domain-color);
  font-size: 0.75rem;
  font-weight: 700;
  font-family: var(--font-mono);
  flex-shrink: 0;
}

.stat-tile {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--pad);
  flex: 1;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.04em;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.8125rem;
  color: var(--text-2);
}

.stat-sub {
  font-size: 0.75rem;
  color: var(--text-3);
  margin-top: 2px;
}

.pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.pill-accent {
  background: var(--accent-soft);
  color: var(--accent);
}

.pill-neutral {
  background: var(--surface-3);
  color: var(--text-2);
}

.pill-dim {
  opacity: 0.7;
}

.checkbox-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 0;
  cursor: pointer;
  border-bottom: 1px solid var(--border);
}

.checkbox-row:last-child {
  border-bottom: none;
}

.checkbox-row input[type="checkbox"] {
  margin-top: 2px;
  accent-color: var(--accent);
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  cursor: pointer;
}

.checkbox-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.checkbox-label {
  font-size: 0.875rem;
  color: var(--text);
}

.checkbox-sub {
  font-size: 0.75rem;
  color: var(--text-3);
}
```

- [ ] **Step 4: Import index.css in main.jsx**

In `web/src/main.jsx`, add before any other imports:
```js
import './index.css'
```

- [ ] **Step 5: Commit**

```bash
git add web/index.html web/src/index.css web/src/main.jsx
git commit -m "feat: port design system styles and add Geist fonts"
```

---

### Task 6: Shared components

**Files:**
- Create: `web/src/components/Card.jsx`
- Create: `web/src/components/ProgressBar.jsx`
- Create: `web/src/components/DomainTag.jsx`
- Create: `web/src/components/StatTile.jsx`
- Create: `web/src/components/Pill.jsx`
- Create: `web/src/components/Checkbox.jsx`
- Create: `web/src/components/components.test.jsx`

- [ ] **Step 1: Write component render tests**

Create `web/src/components/components.test.jsx`:
```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Card from './Card'
import ProgressBar from './ProgressBar'
import DomainTag from './DomainTag'
import StatTile from './StatTile'
import Pill from './Pill'
import Checkbox from './Checkbox'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>hello</Card>)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })
})

describe('ProgressBar', () => {
  it('renders without crashing', () => {
    const { container } = render(<ProgressBar value={50} color="accent" height={5} />)
    expect(container.firstChild).toBeTruthy()
  })
})

describe('DomainTag', () => {
  it('renders domain number', () => {
    render(<DomainTag domain={{ num: 1, color: 'amber' }} />)
    expect(screen.getByText('D1')).toBeInTheDocument()
  })
})

describe('StatTile', () => {
  it('renders label, value, and sub', () => {
    render(<StatTile label="Courses" value="3/9" sub="2 required" />)
    expect(screen.getByText('Courses')).toBeInTheDocument()
    expect(screen.getByText('3/9')).toBeInTheDocument()
    expect(screen.getByText('2 required')).toBeInTheDocument()
  })
})

describe('Pill', () => {
  it('renders children', () => {
    render(<Pill tone="accent">Active</Pill>)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })
})

describe('Checkbox', () => {
  it('calls onChange when clicked', async () => {
    const onChange = vi.fn()
    render(<Checkbox checked={false} onChange={onChange} label="Task 1" sub="2h" />)
    await userEvent.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test
```
Expected: FAIL — cannot find component modules.

- [ ] **Step 3: Create component files**

Create `web/src/components/Card.jsx`:
```jsx
export default function Card({ className = '', children }) {
  return <div className={`card ${className}`}>{children}</div>
}
```

Create `web/src/components/ProgressBar.jsx`:
```jsx
export default function ProgressBar({ value, color = 'accent', height = 5 }) {
  const bg =
    color === 'accent' ? 'var(--accent)'
    : color === 'muted' ? 'var(--muted-2)'
    : `var(--c-${color})`
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div className="progress-track" style={{ height }}>
      <div className="progress-fill" style={{ width: `${pct}%`, background: bg, height }} />
    </div>
  )
}
```

Create `web/src/components/DomainTag.jsx`:
```jsx
export default function DomainTag({ domain }) {
  return (
    <span
      className="domain-tag"
      style={{ '--domain-color': `var(--c-${domain.color})` }}
    >
      D{domain.num}
    </span>
  )
}
```

Create `web/src/components/StatTile.jsx`:
```jsx
export default function StatTile({ label, value, sub }) {
  return (
    <div className="stat-tile">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}
```

Create `web/src/components/Pill.jsx`:
```jsx
export default function Pill({ tone = 'neutral', dim = false, children }) {
  return (
    <span className={`pill pill-${tone}${dim ? ' pill-dim' : ''}`}>
      {children}
    </span>
  )
}
```

Create `web/src/components/Checkbox.jsx`:
```jsx
export default function Checkbox({ checked, onChange, label, sub }) {
  return (
    <label className="checkbox-row">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <div className="checkbox-body">
        <span className="checkbox-label">{label}</span>
        {sub && <span className="checkbox-sub">{sub}</span>}
      </div>
    </label>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```
Expected: all component tests pass.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/
git commit -m "feat: add shared UI components (Card, ProgressBar, DomainTag, StatTile, Pill, Checkbox)"
```

---

### Task 7: Sidebar, App shell, and routing

**Files:**
- Create: `web/src/components/Sidebar.jsx`
- Create: `web/src/App.jsx`
- Modify: `web/src/main.jsx`
- Create: `web/src/App.test.jsx`

- [ ] **Step 1: Write routing test**

Create `web/src/App.test.jsx`:
```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

describe('App routing', () => {
  it('renders Dashboard at /', () => {
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>)
    // Sidebar is always present
    expect(screen.getByText('ctracer')).toBeInTheDocument()
  })

  it('sidebar has links to all primary screens', () => {
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Exam Blueprint')).toBeInTheDocument()
    expect(screen.getByText('Study Plan')).toBeInTheDocument()
    expect(screen.getByText('Courses')).toBeInTheDocument()
    expect(screen.getByText('Key Concepts')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test
```
Expected: FAIL — `Cannot find module './App'`

- [ ] **Step 3: Create Sidebar**

Create `web/src/components/Sidebar.jsx`:
```jsx
import { NavLink } from 'react-router-dom'

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
    </nav>
  )
}
```

- [ ] **Step 4: Create App.jsx**

Create `web/src/App.jsx`:
```jsx
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
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
        </Routes>
      </main>
    </div>
  )
}
```

- [ ] **Step 5: Update main.jsx**

Replace `web/src/main.jsx` with:
```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npm test
```
Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add web/src/components/Sidebar.jsx web/src/App.jsx web/src/App.test.jsx web/src/main.jsx
git commit -m "feat: add sidebar, app shell, and react-router routing"
```

---

### Task 8: Dashboard screen

**Files:**
- Modify: `web/src/screens/Dashboard.jsx`
- Create: `web/src/screens/Dashboard.test.jsx`

- [ ] **Step 1: Write the failing Dashboard test**

Create `web/src/screens/Dashboard.test.jsx`:
```jsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from './Dashboard'
import { clearProgress } from '../lib/storage'

const wrap = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>)

describe('Dashboard', () => {
  beforeEach(() => clearProgress())

  it('shows certification name', () => {
    wrap(<Dashboard />)
    expect(screen.getByText(/Claude Certified Architect/i)).toBeInTheDocument()
  })

  it('shows all 5 domain names', () => {
    wrap(<Dashboard />)
    expect(screen.getByText(/Agentic Architecture/i)).toBeInTheDocument()
    expect(screen.getByText(/Claude Code Configuration/i)).toBeInTheDocument()
    expect(screen.getByText(/Prompt Engineering/i)).toBeInTheDocument()
    expect(screen.getByText(/Tool Design/i)).toBeInTheDocument()
    expect(screen.getByText(/Context Management/i)).toBeInTheDocument()
  })

  it('shows all 4 phase names', () => {
    wrap(<Dashboard />)
    expect(screen.getByText('Foundation')).toBeInTheDocument()
    expect(screen.getByText('Core Exam Domains')).toBeInTheDocument()
    expect(screen.getByText('Context & Integration')).toBeInTheDocument()
    expect(screen.getByText('Exam Prep')).toBeInTheDocument()
  })

  it('shows today panel with phase 1 tasks when nothing is done', () => {
    wrap(<Dashboard />)
    expect(screen.getByText(/What to do today/i)).toBeInTheDocument()
    expect(screen.getByText(/Claude Code 101/i)).toBeInTheDocument()
  })

  it('checking a task updates the today list', async () => {
    wrap(<Dashboard />)
    const checkboxes = screen.getAllByRole('checkbox')
    await userEvent.click(checkboxes[0])
    // After checking, "Claude Code 101" should be gone from the today list
    // (it was the first incomplete task)
    expect(checkboxes[0]).toBeChecked()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test
```
Expected: FAIL — Dashboard is a stub returning `<div>Dashboard</div>`.

- [ ] **Step 3: Implement the Dashboard**

Replace `web/src/screens/Dashboard.jsx` with the full implementation. Port `ScreenDashboard` from `docs/superpowers/specs/screens-a.jsx`, adapting:
- `navigate({ screen: X })` → `useNavigate()` from react-router-dom; use `navigate('/blueprint')`, `navigate('/plan')`, `navigate(\`/domain/${d.id}\`)`
- `study.state.*` → `progress.*` from `useProgress()`
- `study.state.projects[p.id] === "done"` → `progress.projects[p.id] === 'complete'`
- `study.state.projects[p.id] === "wip"` → `progress.projects[p.id] === 'in_progress'`
- `study.toggleTask(t.id)` → `toggleTask(t.id)` from `useProgress()`
- `progress.overall` → `stats.overall` from `useProgress()`

Full implementation:
```jsx
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
  const { progress, toggleTask, stats } = useProgress()

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
              <div className="today-empty">
                Phase {activePhase.num} complete — open the study plan to start phase{' '}
                {Math.min(activePhase.num + 1, 4)}.
              </div>
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```
Expected: all tests pass. If `dash-grid` CSS classes from `styles.css` cause layout issues in tests, that is fine — tests check content, not layout.

- [ ] **Step 5: Commit**

```bash
git add web/src/screens/Dashboard.jsx web/src/screens/Dashboard.test.jsx
git commit -m "feat: implement Dashboard screen with progress tracking"
```

---

### Task 9: Integration check and push

- [ ] **Step 1: Run the full test suite**

```bash
cd web && npm test
```
Expected: all tests pass, 0 failures.

- [ ] **Step 2: Start the dev server and visually verify**

```bash
npm run dev
```
Open http://localhost:5173. Verify:
- Dark background, sidebar visible on the left with all links
- Dashboard renders: cert hero card, 4 phase nodes, 4 stat tiles, 5 domain rows, today panel
- Clicking a phase node navigates to `/plan` (stub screen)
- Clicking a domain row navigates to `/domain/d1` (stub screen)
- Checking a task checkbox marks it checked and saves to localStorage

- [ ] **Step 3: Push the branch**

```bash
cd .. && git push -u origin feature/web-foundation-dashboard
```

- [ ] **Step 4: Open a PR**

```bash
gh pr create \
  --title "feat: web foundation + Dashboard screen" \
  --body "$(cat <<'EOF'
## Summary
- Adds react-router-dom v6 with persistent Sidebar and routes for all 10 screens
- Ports CCA-F static content as an ES module data layer
- Implements localStorage-backed storage service with useProgress hook
- Fully implements Dashboard screen (hero, phase pipeline, stats, domain progress, today panel)
- All other screens remain stubs

## Test plan
- [ ] `npm test` passes with 0 failures
- [ ] Dev server: Dashboard renders with correct CCA-F content
- [ ] Sidebar links navigate to stub screens without errors
- [ ] Checking tasks persists across page refresh (localStorage)
EOF
)"
```
