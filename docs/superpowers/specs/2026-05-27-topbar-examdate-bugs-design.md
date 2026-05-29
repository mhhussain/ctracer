# Topbar, Exam Date & Bug Fixes Design

**Date:** 2026-05-27
**Status:** Approved
**Branch:** `feature/topbar-examdate-bugs` (branched from `main`)

---

## Context

This branch is cut from `main`, where several screens are currently stubs
(`ExamBlueprint`, `StudyPlan`, `Courses`) and the Sidebar is in its basic
form (no domain section, no progress footer). A parallel branch `fix/ui-polish`
contains full implementations of those screens, but has not merged to main.

**This plan covers:**
1. Full implementations of the stubbed screens (with bugs fixed from the start)
2. Full Sidebar rewrite to the `sb-*` class design
3. Shared `PageTopbar` component (new)
4. Exam date feature — set, store, display on Dashboard and Sidebar
5. CSS fixes — sidebar static width, checkbox double-border

**Reference material for screen implementations:**
- Ground-truth prototype: `docs/superpowers/specs/screens-a.jsx`, `screens-b.jsx`, `components.jsx`, `styles.css`
- UI Polish design spec: `docs/superpowers/specs/2026-05-27-ui-polish-design.md`
- Screenshot mock: `docs/superpowers/specs/uploads/dashboard-sc.png`

---

## 1. CSS fixes (`web/src/index.css`)

### 1.1 Sidebar static width

Add `width: 240px; flex-shrink: 0;` to the `.sidebar` rule. The `.app-layout`
flex container currently lets the sidebar grow/shrink with its content.

### 1.2 Checkbox double-border

Both `.task-row` and `.checkbox-row` define `border-bottom: 1px solid var(--border)`,
stacking two lines on every study plan task row.

**Fix:** Remove `border-bottom` and the `:last-child` override from `.checkbox-row`.
The border belongs to the parent container (`.task-row`, `.exam-row`), not the checkbox
component itself.

```css
/* Remove from .checkbox-row: */
border-bottom: 1px solid var(--border);

/* Remove the rule: */
.checkbox-row:last-child { border-bottom: none; }
```

---

## 2. Sidebar rewrite (`web/src/components/Sidebar.jsx`)

Full rewrite to the `sb-*` class design. All CSS classes exist in `index.css`.

### 2.1 Structure

```
[Brand logo + "Study Plan" / "CCA-F"]
[Nav — General section]
  Dashboard, Exam Blueprint, Study Plan, Courses, Projects
[Nav — Domain deep dives section]
  D1 Agentic Design  27%
  D2 Claude Code     …
  D3 …
  D4 …
  D5 …
[Nav — Prep finish section]
  Key Concepts, Exam Day
  Profile (margin-top: auto)
[Footer — overall progress + exam countdown]
```

### 2.2 Brand

```jsx
<div className="sb-brand">
  <div className="sb-logo">
    <svg viewBox="0 0 24 24" width="20" height="20">
      <rect x="2" y="2" width="20" height="20" rx="5" fill="var(--accent)" opacity="0.16" />
      <path d="M7 12.5 L10 16 L17 8" stroke="var(--accent)" strokeWidth="2"
        fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
  <div className="sb-brand-text">
    <div className="sb-brand-1">Study Plan</div>
    <div className="sb-brand-2">CCA-F</div>
  </div>
</div>
```

### 2.3 Nav items

```js
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
```

Domain deep dives use `DOMAINS` from data:
```jsx
<NavLink to={`/domain/${d.id}`} className={…}>
  <span className={`sb-domain-dot dtag-${d.color}`} />
  <span className="sb-domain-num">D{d.num}</span>
  <span>{d.short}</span>
  <span className="sb-domain-w">{d.weight}%</span>
</NavLink>
```

### 2.4 Footer

Import `useProgress`, `useTheme`, `PHASES` from data.

```jsx
<div className="sb-foot">
  <div className="sb-foot-row">
    <span>Overall</span>
    <span className="sb-foot-pct">{stats.overall}%</span>
  </div>
  <ProgressBar value={stats.overall} color="accent" height={4} />
  {/* Exam countdown row — only when examDate is set */}
  {progress.examDate && <SidebarExamBar progress={progress} />}
  <div className="sb-foot-meta">
    <span>Phase {activePhase.num}</span>
    <span>·</span>
    <span>{activePhase.name}</span>
    <span>·</span>
    <span>{hoursLeft}h left</span>
  </div>
  <button className="sidebar-theme-btn" onClick={toggleTheme}>
    {theme === 'dark' ? '☀' : '🌙'}
  </button>
</div>
```

`SidebarExamBar` is a small inline helper (defined in the same file):
- Computes `daysLeft = Math.ceil((new Date(examDate) - new Date()) / 86400000)`
- Uses a fixed 42-day window as reference to compute bar fill %
- Color: `"accent"` if > 14 days, `"amber"` if ≤ 14 days
- Renders: label row + ProgressBar

---

## 3. Shared PageTopbar component (`web/src/components/PageTopbar.jsx`)

New file. Rendered in `App.jsx` inside `.app-main`, before `<Routes>`.

Uses existing CSS: `.topbar`, `.topbar-title`, `.topbar-sub`, `.topbar-right`, `.top-btn`, `.top-btn.primary`.

### 3.1 Layout (matches screenshot mock)

```
┌──────────────────────────────────────────────────────────┐
│  Dashboard                        [✦ Reference] [Exam day]│
│  Your CCA-F prep at a glance                              │
└──────────────────────────────────────────────────────────┘
```

### 3.2 Route → title + subtitle

| Route | Title | Subtitle |
|---|---|---|
| `/` | Dashboard | Your CCA-F prep at a glance |
| `/blueprint` | Exam Blueprint | 60 questions · 90 minutes · pass at 70% |
| `/plan` | Study Plan | A 3–5 week track for the CCA-F |
| `/courses` | Courses | Free courses at anthropic.skilljar.com |
| `/projects` | Projects | Hands-on builds that reinforce each domain |
| `/domain/:id` | [domain.name] | D[N] of 5 · [weight]% of exam |
| `/concepts` | Key Concepts | Quick reference for exam day |
| `/exam-day` | Exam Day Checklist | One last gut-check before you sit the exam |
| `/profile` | Profile | Account & settings |
| (fallback) | — | — |

For `/domain/:id`: use `useParams().id` to look up the domain from `DOMAINS`.

### 3.3 Buttons

- **Reference** (`top-btn`) — `useNavigate('/concepts')`
- **Exam day** (`top-btn primary`) — toggles date-picker modal

When an exam date is set, the Exam day button label shows remaining days:
`Exam: 12d` — so users see at a glance without opening the modal.

### 3.4 Exam date modal

Rendered inside PageTopbar with the existing `.modal-veil` + `.modal` CSS.

```
┌──────────────────────────────────┐
│ Set your exam date            [×] │
│                                   │
│ [     date input              ]   │
│                                   │
│ [  Save date  ]  [  Clear  ]      │
└──────────────────────────────────┘
```

- Native `<input type="date">` styled with `.input` class
- "Save date" (`primary-btn`) — calls `setExamDate(value)`, closes modal
- "Clear" (`ghost-btn`) — calls `setExamDate(null)`, closes modal
- `×` (`x-btn`) — closes without saving

### 3.5 App.jsx change

```jsx
<main className="app-main">
  <PageTopbar />
  <Routes>…</Routes>
</main>
```

---

## 4. Exam date feature

### 4.1 Storage (`web/src/lib/storage.js`)

Add `examDate: null` to `DEFAULT_PROGRESS`. Value is an ISO date string
(`"2026-06-15"`) or `null`.

### 4.2 Hook (`web/src/hooks/useProgress.js`)

Add `setExamDate` action:

```js
const setExamDate = useCallback(
  (date) => update((p) => ({ ...p, examDate: date })),
  [update]
)
```

Return it from `useProgress`.

### 4.3 Dashboard hero countdown (`web/src/screens/Dashboard.jsx`)

When `progress.examDate` is set, add a 5th stat to `.hero-meta`:

```jsx
{progress.examDate && (() => {
  const days = Math.ceil((new Date(progress.examDate) - new Date()) / 86400000)
  return (
    <span>
      <span className="meta-k">Exam in</span>
      {days > 0 ? `${days} days` : 'Today!'}
    </span>
  )
})()}
```

### 4.4 Sidebar exam countdown bar

Described in Section 2.4 above (`SidebarExamBar` helper).

---

## 5. Screen implementations (full builds, bugs fixed from the start)

### 5.1 ExamBlueprint (`web/src/screens/ExamBlueprint.jsx`)

Full implementation based on the prototype (`screens-a.jsx` / `screens-b.jsx`).

**Bugs fixed in this build:**
- **Accordion no border**: use `<Card className="exp-card">` for each expandable domain card
- **Pie chart not showing**: `<svg viewBox="0 0 220 220" width={220} height={220}>` (explicit dimensions required for auto-column to size correctly)

Key structure:
```
screen-container
  bp-grid (2 cols)
    Card.bp-donut
      <svg width=220 height=220>  ← explicit dimensions
      .donut-legend
    Card.bp-bars
      .bars (domain weight/difficulty)
  bp-expand
    Card.exp-card  ← Card, not div
      button.exp-head (4px stripe, dtag, name, exp-meta pills, exp-chev)
      [if open] .exp-body
```

Arc math for donut slices is defined in the prototype. Bring it in verbatim.

### 5.2 StudyPlan (`web/src/screens/StudyPlan.jsx`)

Full implementation based on prototype.

**Bug fixed in this build:**
- **Domain tags not navigating**: wrap `<DomainTag>` in a `<button onClick={() => navigate('/domain/' + task.domain)}>` with reset styles

Domain tag button:
```jsx
{task.domain && (
  <button
    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
    onClick={() => navigate(`/domain/${task.domain}`)}
  >
    <DomainTag domain={DOMAIN_MAP[task.domain]} />
  </button>
)}
```

Key structure:
```
screen-container
  sec / sec-head (title: "Study plan", desc)
  Card.roadmap
    .roadmap-meta (timeline meta)
    .rm-line (phase stops with ProgressBar)
  .phase-stack
    Card.phase-card (accordion per phase)
      button.phase-head
      [if open] .phase-body > .phase-tasks > .task-row
        Checkbox (label prop)
        .task-meta (pill, DomainTag button, hours)
```

### 5.3 Courses (`web/src/screens/Courses.jsx`)

Full implementation based on prototype.

**Bug fixed in this build:**
- **Mark done button too big**: use `btn-done` (not `btn btn-secondary`) for the "not done" state, keeping `btn-done is-done` for done state

```jsx
className={done ? 'btn-done is-done' : 'btn-done'}
```

Key structure:
```
screen-container
  sec / sec-head (title, desc, filter chips in action slot)
  .course-grid
    Card.course-card (per course)
      card-flag (if required)
      .course-top (name + btn-done button)
      blurb, meta pills, domain tags, course-actions
  modal-veil (when openCourseId set)
    .modal (modal-head, modal-doms, modal-modules, modal-foot)
```

---

## 6. Implementation order

Tasks should be tackled in this sequence to minimize regressions:

1. **CSS only** — sidebar width fix + checkbox border removal (`index.css`)
2. **Storage** — add `examDate` to `DEFAULT_PROGRESS` (`storage.js`)
3. **Hook** — add `setExamDate` action (`useProgress.js`)
4. **Sidebar rewrite** — full `sb-*` class implementation with progress footer + conditional exam bar
5. **PageTopbar** — new component, wired into `App.jsx`
6. **ExamBlueprint** — full screen build (pie chart + accordion fixes built in)
7. **StudyPlan** — full screen build (domain tag navigation built in)
8. **Courses** — full screen build (button size fixed built in)
9. **Dashboard** — add exam countdown stat to hero meta

---

## 7. What is NOT changing

- `index.css` topbar, topbar-title, top-btn CSS — already correct
- `Dashboard.jsx` structure — add one stat span only
- `DomainDeepDive.jsx`, `KeyConcepts.jsx`, `ExamDayChecklist.jsx`, `Profile.jsx` — not in scope
- Mobile app — not in scope
- Data files (`src/data/`) — not in scope
- Firebase / Firestore — not in scope (storage.js uses localStorage only on this branch)
