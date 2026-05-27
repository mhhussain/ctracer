# Web App Completion Design

**Date:** 2026-05-27
**Status:** Approved
**Branch:** `feature/web-app-completion`
**Scope:** Complete the remaining 8 stub screens, add a reset-progress feature to Profile, and add a persistent light/dark mode toggle to the sidebar. MobileDownload stays a stub (deferred until mobile app is built out).

---

## 1. What This Covers

After the Firebase integration sprint, the web app has:
- A fully working Dashboard
- Firebase Auth + Firestore + CI/CD
- All shared components and the data layer

Eight screens are still stubs returning `<div>Screen Name</div>`. This sprint implements all of them plus two cross-cutting features.

**In scope:**
- `ExamBlueprint` — donut chart, difficulty bars, expandable domain cards
- `StudyPlan` — horizontal roadmap + phase accordion with task checkboxes
- `Courses` — filterable course cards + module-list modal
- `Projects` — project cards with status cycling + expandable build steps
- `DomainDeepDive` — domain hero, topics, builds, anti-patterns, where-to-study, prev/next nav
- `KeyConcepts` — Quick Reference cheat sheet (6 reference cards)
- `ExamDayChecklist` — readiness checklist with auto-derived items + what-to-expect
- `Profile` enhancement — reset progress (two-step inline confirm)
- `Sidebar` enhancement — light/dark mode toggle in footer

**Out of scope:**
- `MobileDownload` (deferred)
- Any mobile changes
- Firebase Functions, push notifications, social features

---

## 2. Prototype Reference

All screen designs derive from the Claude Design prototype in `docs/superpowers/specs/`:
- `screens-a.jsx` → Dashboard, ExamBlueprint, StudyPlan, Courses
- `screens-b.jsx` → Projects, DomainDeepDive, KeyConcepts (ScreenReference), ExamDayChecklist
- `styles.css` / `index.css` — CSS is already ported; all screen-specific class names exist

The web app's actual implementation uses slightly different data model values than the prototype (noted per-screen below). The prototype is a visual reference, not a copy-paste source.

---

## 3. Layer 0: Hook & Storage Additions

These must land before any screen is touched — all screens import from these.

### 3.1 `storage.js` — `resetProgress(user)`

```js
export async function resetProgress(user) {
  clearProgress()  // always wipe localStorage
  if (!user) return
  const ref = doc(db, 'users', user.uid, 'progress', 'data')
  await setDoc(ref, DEFAULT_PROGRESS)  // overwrite Firestore with clean defaults
}
```

This is the only async storage function. The Profile screen must `await` it before showing success state.

### 3.2 `useProgress.js` — `cycleProject(id)`

The Projects screen needs to cycle status on click. Add alongside `setProject`:

```js
const STATUS_CYCLE = {
  not_started: 'in_progress',
  in_progress: 'complete',
  complete: 'not_started',
}

const cycleProject = useCallback(
  (id) => update((p) => ({
    ...p,
    projects: {
      ...p.projects,
      [id]: STATUS_CYCLE[p.projects[id]] ?? 'in_progress',
    },
  })),
  [update],
)
```

Return `cycleProject` from the hook alongside `setProject`.

### 3.3 `useTheme.js` — new hook

New file at `web/src/hooks/useTheme.js`:

```js
import { useEffect, useState } from 'react'

const KEY = 'ctracer_theme'

export function useTheme() {
  const [theme, setThemeState] = useState(
    () => localStorage.getItem(KEY) ?? 'dark'
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(KEY, theme)
  }, [theme])

  const toggleTheme = () =>
    setThemeState((t) => (t === 'dark' ? 'light' : 'dark'))

  return { theme, toggleTheme }
}
```

Theme persists across sessions via localStorage. Defaults to `'dark'`. The CSS already has `:root[data-theme="light"]` variables.

---

## 4. Profile Screen — Reset Progress Enhancement

The existing Profile screen has sign-in (for unauthenticated users) and a signed-in panel with name, email, sign-out button. The reset feature is added to both states.

### 4.1 Signed-in panel additions

Below the sign-out button, add a "Danger zone" section:

```
────────────────────────────
  [initial state]
  [ Reset progress ]    (muted secondary button)

  [after clicking Reset progress]
  ⚠ This will clear all courses, tasks, and project
    status. This cannot be undone.
  [ Cancel ]   [ Yes, reset everything ]    (destructive red)

  [after confirming]
  ✓ Progress reset.    (1.5s then reverts to initial state)
```

Component state:
- `resetState`: `'idle' | 'confirm' | 'resetting' | 'done'`

On confirm:
1. Set `resetState = 'resetting'` (disables button, shows spinner)
2. `await resetProgress(user)` (clears Firestore + localStorage)
3. Set `resetState = 'done'`
4. After 1.5s, set `resetState = 'idle'`

### 4.2 Signed-out panel additions

Same two-step confirm below the sign-in form, but calls `resetProgress(null)` (localStorage only).

### 4.3 New CSS classes needed

```css
.profile-danger-zone       /* section wrapper with top border */
.profile-danger-label      /* small "Danger zone" section heading */
.profile-reset-warning     /* warning text block */
.btn-destructive           /* red variant of .btn */
```

---

## 5. Sidebar — Light/Dark Toggle

The `Sidebar` component gains a footer section at the bottom, separated by a border:

```
────────────────
☀/🌙  [icon button]
```

- The icon shows ☀ (sun) in dark mode (click → switch to light) and 🌙 (moon) in light mode (click → switch to dark)
- Button uses `useTheme()` hook imported in `Sidebar.jsx`
- Tooltip/title: "Switch to light mode" / "Switch to dark mode"

### New CSS classes needed

```css
.sidebar-footer        /* flex footer pinned to bottom of sidebar */
.sidebar-theme-btn     /* small icon-only button */
```

The sidebar layout needs `display: flex; flex-direction: column` so the nav grows and the footer sticks to the bottom.

---

## 6. ExamBlueprint Screen

**Route:** `/blueprint`

**State:**
- `hovered: string | null` — domain id being hovered (syncs donut highlight + bar hover)
- `expanded: string` — domain id of open accordion card (default: `'d1'`)

### 6.1 Top row (2-column grid)

**Left — Donut card (`.bp-donut`):**
- SVG donut chart: 5 arc slices, each domain's angular size proportional to `d.weight / totalWeight * 360`
- Slice fill: domain color class (`.dtag-{color}`)
- Hover: hovered slice scales/brightens; others dim (CSS classes `.is-hov`, `.is-dim`)
- Center label: "60 / questions"
- Below donut: legend rows — colored swatch, `D{num}`, short name, weight%, question count
- Legend rows are buttons that set `expanded` on click and `hovered` on mouseenter/leave

**Right — Weight & difficulty card (`.bp-bars`):**
- Heading + explanatory sentence ("Domain 1 is the largest and the hardest…")
- 5 bar rows: domain tag, difficulty pill (`Hardest` → warn tone), fill bar proportional to `weight / 27 * 100%`
- Bar rows set `hovered` on mouseenter/leave
- Domain tags navigate to `/domain/:id` on click

**Donut math:**
```js
let acc = 0
const slices = DOMAINS.map((d) => {
  const start = acc
  const end = acc + (d.weight / totalWeight) * 360
  acc = end
  return { ...d, startAngle: start, endAngle: end }
})
```

SVG arc path formula (same as prototype's `arc()` function):
- `cx=110, cy=110, outerR=88, innerR=56`
- Start/end from `-90deg` offset so first slice starts at top

### 6.2 Expandable domain cards (`.bp-expand`)

One card per domain below the top row. Collapsed by default except D1.

Each card (`.exp-card`):
- **Header (`.exp-head`):** colored left stripe, domain tag, full domain name, pills (questions, weight%, "Hardest" if applicable), expand chevron (+ / −)
- **Body (`.exp-body`, shown when `expanded === d.id`):**
  - Domain blurb
  - Two-column layout:
    - Left: "Key topics" — `<ul>` with topic name (bold) + ` — ` + description
    - Right: "Anti-patterns to know" — `<ul>` with ✕ markers, then "Open domain deep dive →" button → navigate to `/domain/:id`

---

## 7. StudyPlan Screen

**Route:** `/plan`

### 7.1 Roadmap card (`.roadmap`)

Top card with metadata row (total timeline, track, approach), then a horizontal row (`.rm-line`) of 4 phase stops connected by `.rm-link` dividers.

Each stop (`.rm-stop`):
- Phase number dot (shows ✓ when 100% done)
- Phase name
- Week + hours
- Mini progress bar (`ProgressBar`)
- Clicking a stop sets `openPhase` to that phase's id

Active/done states:
- `.is-open` → accent-colored dot border
- `.is-done` → ok (green) dot

### 7.2 Phase accordion stack (`.phase-stack`)

4 expandable phase cards (`.phase-card`) below the roadmap.

**Collapsed header (`.phase-head`):**
- "Phase N" number
- Phase name
- Week range
- Goal description
- `done/total tasks` pill
- hours pill
- Expand chevron

**Open body (`.phase-body` → `.phase-tasks`):**
One row per task (`.task-row`):
- `Checkbox` wired to `toggleTask(t.id)` — checked = `!!progress.tasks[t.id]`
- Task meta: kind pill (`project` → accent, others → neutral/muted), optional domain tag (navigates to `/domain/:id`), hours label

**Initial open phase:** read from URL search params (`?phase=p2`), otherwise the active phase (first phase with incomplete tasks).

---

## 8. Courses Screen

**Route:** `/courses`

**State:**
- `filter: 'all' | 'partner' | 'other'` — defaults to `'all'`
- `openCourseId: string | null` — which course has its module modal open

### 8.1 Filter chips

```
[ All ]   [ Partner Network (required) ]   [ Recommended ]
```

`partner` filter = `c.partnerRequired === true`
`other` filter = `c.partnerRequired === false`

### 8.2 Course card grid (`.course-grid`)

Each card (`.course-card`, `.is-required` if partner, `.is-done` if `progress.courses[c.id]`):

- Flag banner at top if partner: "Partner Network · required"
- Course name + mark-done toggle button (`toggleCourse(c.id)`)
  - Done → "✓ Done" (styled done)
  - Not done → "Mark done"
- Blurb paragraph
- Pills row: hours, level
- Domain tags (each navigates to `/domain/:id`)
- Action links: "Module list →" (opens modal) | "Open on Skilljar ↗" (external link)

### 8.3 Module-list modal

Rendered when `openCourseId !== null`. Dimmed veil (`modal-veil`) + centered card (`modal`).

Modal content:
- Header: level · hours eyebrow, course name, blurb, × close button
- Domain tags + "Partner Network required" pill if applicable
- Module list: numbered sections, each with a lesson list
- Footer: "Open course on Skilljar ↗" (external link) + mark-done toggle

Click veil → close. Click × → close. ESC key → close.

---

## 9. Projects Screen

**Route:** `/projects`

**State:**
- `openProjectId: string | null` — which project's build steps are expanded

**Status values** (actual data model, not prototype's `todo/wip/done`):
- `not_started` — neutral
- `in_progress` — accent (blue)
- `complete` — ok (green)

Default for a project with no saved state: `not_started`.

### 9.1 Project card grid (`.proj-grid`)

Each card (`.proj-card`, `.status-{status}`):

- Top row: project number label (`PROJECT 01`…`PROJECT 05`), status pill
  - Status pill is a button → calls `cycleProject(id)` on click
  - Status pill: colored dot + label
- Project name
- Summary paragraph
- Pills: complexity (`High` → warn tone, others → neutral/muted), ~hours
- Domain tags (navigate to `/domain/:id`)
- Flag callout if `p.flag` (Project 3 has "Hardest domain — spend the most time here")
- "Show build steps ↓" / "Hide build steps ↑" toggle button

### 9.2 Expanded build steps

Shown when `openProjectId === p.id`:

- "What it teaches" section: paragraph
- "What to build" section: numbered `<ol>`
- Quick-action buttons:
  - `Start` → `setProject(id, 'in_progress')`
  - `Mark complete` → `setProject(id, 'complete')`
  - `Reset` → `setProject(id, 'not_started')`

---

## 10. DomainDeepDive Screen

**Route:** `/domain/:id`

**Data:** `useParams()` gets `:id`; fall back to `DOMAINS[0]` if not found.

### 10.1 Domain hero (`.dom-hero`)

Full-width hero with a colored left stripe (`.dom-hero-stripe.dtag-{color}`):

- Left: eyebrow (colored swatch, "Domain N of 5", "Hardest domain" warn pill if D1), domain name (h2), blurb paragraph
- Right: three stat tiles — weight%, question count, study phase number

### 10.2 4-card body grid (`.dom-grid`)

1. **Key topics card (`.dom-topics`):**
   - Heading + explainer: "Every bullet below is fair game on the exam…"
   - `<ul>` — each item: topic name (bold) + ` — ` + description

2. **What to build card (`.dom-build`):**
   - Heading
   - `<ol>` — build items

3. **Anti-patterns card (`.dom-anti`):**
   - Heading
   - `<ul>` — items with ✕ marker

4. **Where to study card (`.dom-links`):**
   - Three link blocks: Phase, Courses, Projects
   - Each block has a heading + clickable rows
   - Phase row → `navigate('/plan')`
   - Course rows → `navigate('/courses')`
   - Project rows → `navigate('/projects')`

### 10.3 Domain navigation (`.dom-nav`)

Prev/next buttons at bottom:
- `prev = DOMAINS[(idx - 1 + 5) % 5]`
- `next = DOMAINS[(idx + 1) % 5]`
- Each button: arrow, domain number eyebrow, short name
- Navigate to `/domain/{id}` on click

---

## 11. KeyConcepts Screen (Quick Reference)

**Route:** `/concepts`

**Purpose:** Print-friendly cheat sheet. No progress state needed.

**Banner row:** "No docs allowed during exam" (warn pill) + "Print to PDF · ⌘P" (neutral pill).

### 11.1 Reference card grid (`.ref-grid`)

6 cards (`.ref-card`), each with a numbered eyebrow and heading:

**01 — API essentials (`.ref-api`):**
`<dl>` of key/value rows from `REFERENCE.api` — 5 items covering Messages API, streaming, tool use flow, caching syntax, rate-limit codes.

**02 — Model comparison (`.ref-models`):**
`<table>` — 3 rows (Haiku/Sonnet/Opus) × 5 columns (name, cost, speed, use case, ctx).

**03 — MCP primitives (`.ref-mcp`):**
3-cell row (Tools / Resources / Prompts) — controller label + use description.

**04 — Claude Code hierarchy (`.ref-cc`):**
Two columns:
- CLAUDE.md levels: Global / Project / Local — path + description
- Settings files: `settings.json` + `settings.local.json`
- Hook types: `<KBD>` chip per hook name (PreToolUse, PostToolUse, PreCompact, Stop)

Render hook names inline as `<kbd className="kbd">{hookName}</kbd>` — no shared component needed; this is the only usage.

**05 — Agentic patterns (`.ref-patt`):**
4-cell grid (Parallelization / Chaining / Routing / Orchestrator+Subagent) — pattern name, description, and a tiny schematic SVG icon.

SVG icons are small (80×36 viewBox) abstract diagrams matching the prototype's `PatternIcon` component.

**06 — Trap-question anti-patterns (`.ref-anti`):**
Compact `<ul>` with ✕ markers, one entry per `ANTI_PATTERNS_ALL` item (8 total).

---

## 12. ExamDayChecklist Screen

**Route:** `/exam-day`

**Auto-derived signals** (computed from progress, not stored in `exam_day`):
- `x1` (all Partner Network courses done): `COURSES.filter(c => c.partnerRequired).every(c => progress.courses[c.id])`
- `x2` (all projects done): `PROJECTS.every(p => progress.projects[p.id] === 'complete')`

### 12.1 Exam hero card (`.exam-hero`, `.is-ready` when all done)

- Left: "Exam logistics" eyebrow, 4-cell metadata grid (Duration: 120 min, Questions: 60, Passing: 720/1000, Reference: None allowed)
- Right: readiness percentage (`done / total * 100`%) and `done / total` label

Card gets green tint (`.is-ready`) when all 9 items are checked.

### 12.2 Two-column body

**Left — Pre-exam readiness (`.exam-list`):**

9 checklist items from `EXAM_DAY_CHECKLIST`. For each:
- `Checkbox` — read-only for auto-derived (x1, x2), toggled via `toggleExamDay(id)` for others
- Sub-label: "auto-tracked from your progress" for x1/x2
- Right side pill: "Required" (warn) for `c.critical === true`, "Recommended" (neutral) for others

**Right — What to expect (`.exam-expect`):**

Static content card:
- Heading
- 6 bullet points about the exam (scenario-based questions, agentic difficulty, MCP focus, anti-pattern traps, no docs, achievable high scores)
- Footer: "Register at Skilljar ↗" (external link, `CERT.registerUrl`) + "Open quick reference →" (navigate to `/concepts`)

---

## 13. Data Model Notes

### Status value alignment (Projects)

The data model (`docs/spec.md`) and actual `useProgress.js` use:
```
not_started | in_progress | complete
```

The prototype uses `todo | wip | done`. When implementing the Projects screen, use the actual values but render the same labels:
- `not_started` → "Not started"
- `in_progress` → "In progress"
- `complete` → "Complete"

### ExamDay storage key

The prototype uses `study.state.checklist[id]`. The actual data model uses `progress.exam_day[id]`, written via `toggleExamDay(id)` from `useProgress`.

---

## 14. CSS Additions

The existing `index.css` contains all screen-specific classes from the prototype. New classes needed only for features not in the prototype:

```css
/* Profile reset */
.profile-danger-zone   /* section with top border, padding-top */
.profile-danger-label  /* "Danger zone" small heading, muted color */
.profile-reset-warning /* warning text, amber/warn color */
.btn-destructive       /* red variant: oklch(0.65 0.18 20) background */

/* Sidebar theme toggle */
.sidebar-footer        /* flex footer, border-top, padding */
.sidebar-theme-btn     /* icon-only button, muted color, hover brightens */
```

Sidebar layout update: add `height: 100%; display: flex; flex-direction: column` so `.sidebar-nav` grows and `.sidebar-footer` pins to bottom.

---

## 15. Implementation Order

```
Layer 0 (no screen changes):
  1. storage.js — add resetProgress()
  2. useProgress.js — add cycleProject()
  3. hooks/useTheme.js — new file
  4. CSS additions — append new classes to index.css

Layer 1 (simpler / no progress state wiring):
  5. Sidebar — add footer with theme toggle
  6. Profile — add reset feature
  7. KeyConcepts — Quick Reference (static, no progress)
  8. DomainDeepDive — routing + static content display

Layer 2 (interactive screens with progress wiring):
  9.  StudyPlan
  10. ExamBlueprint
  11. Courses
  12. Projects
  13. ExamDayChecklist
```

Each step is independently commit-able. Screens do not depend on each other — only on Layer 0 additions.

---

## 16. Testing Notes

- `storage.js` has existing unit tests; add a test for `resetProgress` covering both `user = null` (localStorage only) and `user != null` (Firestore call)
- `useProgress.js` has existing unit tests; add a test for `cycleProject` covering the full cycle
- Screen-level tests are not required (visual fidelity is the prototype), but `ExamDayChecklist` auto-derived logic should be unit-tested
- Manual smoke test after each layer: run `npm run dev`, navigate to each screen, verify no console errors
