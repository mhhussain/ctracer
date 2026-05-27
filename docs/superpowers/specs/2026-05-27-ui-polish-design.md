# UI Polish Design

**Date:** 2026-05-27
**Status:** Approved
**Branch:** `fix/ui-polish` (new branch from `feature/web-app-completion`)
**Scope:** Fix visual regressions across 5 areas — all CSS classes already exist in `index.css`; every fix is a JSX structural correction only.

---

## Background

After the web-app-completion sprint, several screens were implemented with the wrong CSS class names or wrong DOM structure. The design system CSS in `index.css` is correct and complete — the bugs are entirely in the JSX. No CSS changes are needed unless explicitly noted.

The ground-truth prototype lives in `docs/superpowers/specs/screens-a.jsx`, `screens-b.jsx`, and `components.jsx`.

---

## 1. Shared Pattern: Section Header

Every screen that uses `.screen-container` wraps its content in a `<section className="sec">` with a header. The CSS classes already exist:

```css
.sec { margin-bottom: 32px; }
.sec-head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px; gap: 12px; }
.sec-title { margin: 0; font-size: 18px; font-weight: 600; letter-spacing: -0.015em; }
.sec-desc { margin: 4px 0 0; font-size: 13px; color: var(--text-3); }
```

**Replace** this pattern (currently used on all affected screens):
```jsx
<h1 className="screen-title">Screen Name</h1>
```

**With** this pattern:
```jsx
<section className="sec">
  <header className="sec-head">
    <div>
      <h2 className="sec-title">Screen Name</h2>
      <p className="sec-desc">Desc text here.</p>
    </div>
    {/* optional action slot (e.g. filter chips) */}
  </header>
  {/* screen content */}
</section>
```

The loading state also currently uses `screen-container` + `screen-title` — update it to match.

---

## 2. ExamBlueprint (`web/src/screens/ExamBlueprint.jsx`)

### 2.1 Section header

Replace `<div className="screen-container">` + `<h1 className="screen-title">Exam Blueprint</h1>` with the `.sec` pattern:

- Title: `"Blueprint"`
- Desc: `"60 questions · 90 minutes · pass at 70%"`
- No action slot.

### 2.2 Card borders on donut and bars panels

Both `<div className="bp-donut">` and `<div className="bp-bars">` are plain divs with no border/background/padding. Wrap each with the `Card` component:

```jsx
import Card from '../components/Card'

<Card className="bp-donut"> … </Card>
<Card className="bp-bars"> … </Card>
```

### 2.3 Bar row structure (bars overlapping)

Current structure is broken: `bar-lab` is a sibling of `bar-track` but its CSS uses `position: absolute` relative to `bar-track`. Additionally, the row has no `.bar-row-head` wrapper and is missing the `.bars` container div.

**Replace** the entire bars section inside `.bp-bars`:

```jsx
<div className="bars">
  {DOMAINS.map((d) => (
    <div
      key={d.id}
      className="bar-row"
      onMouseEnter={() => setHovered(d.id)}
      onMouseLeave={() => setHovered(null)}
    >
      <div className="bar-row-head">
        <span className={`dtag dtag-${d.color}`} onClick={() => navigate(`/domain/${d.id}`)}>D{d.num}</span>
        <span className={`pill ${d.difficulty === 'Hardest' ? 'pill-warn' : 'pill-dim'}`}>{d.difficulty}</span>
      </div>
      <div className="bar-track">
        <div className={`bar-fill dtag-${d.color}`} style={{ width: `${(d.weight / 27) * 100}%` }} />
        <span className="bar-lab">{d.weight}% · {d.questions} questions</span>
      </div>
    </div>
  ))}
</div>
```

Note `bar-lab` is now a **child** of `bar-track` (not a sibling), so `position: absolute` resolves correctly.

### 2.4 Accordion header — pills not grouped

The `.exp-head` grid is `4px auto 1fr auto auto` (5 columns: stripe, dtag, name, pill-group, chevron). Currently, each pill is a direct grid child causing overflow. Wrap all pills in `<span className="exp-meta">` and use `exp-chev` (not a non-existent class) for the chevron:

```jsx
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
```

### 2.5 Accordion body — col-head for section headings

Replace `<h4>Key topics</h4>` and `<h4>Anti-patterns to know</h4>` with `<div className="col-head">`:

```jsx
<div className="col-head">Key topics</div>
<div className="col-head">Anti-patterns to know</div>
```

---

## 3. StudyPlan (`web/src/screens/StudyPlan.jsx`)

### 3.1 Section header

- Title: `"Study plan"`
- Desc: `"A 3–5 week track for the CCA-F. Click any phase to expand its tasks."`
- No action slot.

### 3.2 Roadmap card border

Wrap `<div className="roadmap">` with `Card`:

```jsx
<Card className="roadmap"> … </Card>
```

### 3.3 Roadmap meta structure

Current: plain `<span>` strings. Replace with label/value div pairs:

```jsx
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
```

### 3.4 Roadmap stop class names

- `<div className="rm-dot">` → `<div className="rm-stop-dot">`
- Wrap week+hours in `<div className="rm-stop-week">`
- Wrap `<ProgressBar>` in `<div className="rm-stop-bar">`

```jsx
<button className={`rm-stop${openPhase === phase.id ? ' is-open' : ''}${isPhaseDone(phase) ? ' is-done' : ''}`}
  onClick={() => setOpenPhase(phase.id)}
>
  <div className="rm-stop-dot">{isPhaseDone(phase) ? '✓' : phase.num}</div>
  <div className="rm-stop-name">{phase.name}</div>
  <div className="rm-stop-week">{phase.week} · {phase.hours}h</div>
  <div className="rm-stop-bar">
    <ProgressBar value={phaseProgress(phase)} color={isPhaseDone(phase) ? 'ok' : 'accent'} height={3} />
  </div>
</button>
```

### 3.5 Phase cards — add Card component

Wrap each `<div className="phase-card ...">` with `Card`:

```jsx
<Card className={`phase-card${isOpen ? ' is-open' : ''}`}>
  …
</Card>
```

### 3.6 Phase chevron class

`<span className="phase-chevron">` → `<span className="exp-chev">` (reuses the same CSS).

### 3.7 Pill class

`pill-neutral` does not exist. Replace all instances with `pill-dim`.

### 3.8 Task row layout

Current: Checkbox (no label), pill, DomainTag, task-label span, task-hours — 5 direct grid children against a `1fr auto` grid.

Fix:
1. Pass `label={task.label}` into `<Checkbox>` — the label renders inside the component
2. Remove the standalone `<span className="task-label">` 
3. Wrap pill + DomainTag + hours in `<div className="task-meta">`

```jsx
<div className="task-row">
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
```

---

## 4. Courses (`web/src/screens/Courses.jsx`)

### 4.1 Section header

- Title: `"Courses"`
- Desc: `"Free at anthropic.skilljar.com. The four Partner Network courses are the official pre-cert sequence."`
- Filter chips go in the **action slot** (right side of sec-head, inline with title):

```jsx
<header className="sec-head">
  <div>
    <h2 className="sec-title">Courses</h2>
    <p className="sec-desc">Free at anthropic.skilljar.com. …</p>
  </div>
  <div className="filter-row">
    {[…].map(…chip buttons…)}
  </div>
</header>
```

### 4.2 Course card border and padding

Add `Card` component (provides `padding: 20px`, `border: 1px solid var(--border)`, `background: var(--surface)`, `border-radius: var(--radius-lg)`):

```jsx
<Card className={`course-card${c.partnerRequired ? ' is-required' : ''}${done ? ' is-done' : ''}`}>
```

### 4.3 Pill class

`pill-neutral` → `pill-dim`.

### 4.4 Modal head structure

The x-btn needs to be a flex sibling of the text block. Wrap eyebrow/title/blurb in a `<div>`:

```jsx
<div className="modal-head">
  <div>
    <div className="modal-eyebrow">{modalCourse.level} · {modalCourse.hours}h</div>
    <h2 className="modal-title">{modalCourse.name}</h2>
    <p className="modal-blurb">{modalCourse.blurb}</p>
  </div>
  <button className="x-btn" onClick={() => setOpenCourseId(null)} aria-label="Close">×</button>
</div>
```

### 4.5 Action button style

"Module list →" and "Open on Skilljar ↗" use `link-btn` (no border, no padding). Replace with `ghost-btn-sm` to match the prototype and give them a visible affordance.

---

## 5. Projects (`web/src/screens/Projects.jsx`)

### 5.1 Section header

- Title: `"Projects"`
- Desc: `"Hands-on builds that reinforce each domain."`

### 5.2 Project card border and padding

Same fix as Courses. Wrap each project card div with `Card`:

```jsx
<Card className={`proj-card status-${status}`}>
```

### 5.3 Pill class

Any `pill-neutral` → `pill-dim`.

---

## 6. Sidebar (`web/src/components/Sidebar.jsx`)

This is a full rewrite of `Sidebar.jsx`. The CSS classes required (`sb-brand`, `sb-nav`, `sb-group-label`, `sb-item`, `sb-glyph`, `sb-item-sub`, `sb-domain-dot`, `sb-domain-num`, `sb-domain-w`, `sb-foot`, `sb-foot-row`, `sb-foot-pct`, `sb-foot-meta`) all exist in `index.css`. The old `sidebar-*` classes become unused and can be left in place (no CSS file changes needed).

### 6.1 Brand

```jsx
<div className="sb-brand">
  <div className="sb-logo"> … svg checkmark … </div>
  <div className="sb-brand-text">
    <div className="sb-brand-1">Study Plan</div>
    <div className="sb-brand-2">CCA-F</div>
  </div>
</div>
```

The SVG logo from the prototype (accent-colored checkmark on soft background):
```jsx
<svg viewBox="0 0 24 24" width="20" height="20">
  <rect x="2" y="2" width="20" height="20" rx="5" fill="var(--accent)" opacity="0.16" />
  <path d="M7 12.5 L10 16 L17 8" stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
</svg>
```

### 6.2 Nav — 3 sections

Import `DOMAINS` from data. Define nav items with glyphs:

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

Nav JSX structure:
```jsx
<nav className="sb-nav">
  <div className="sb-group-label">General</div>
  {GENERAL_ITEMS.map(({ to, label, glyph, end }) => (
    <NavLink key={to} to={to} end={end}
      className={({ isActive }) => `sb-item${isActive ? ' is-active' : ''}`}
    >
      <span className="sb-glyph">{glyph}</span>
      <span>{label}</span>
    </NavLink>
  ))}

  <div className="sb-group-label">Domain deep dives</div>
  {DOMAINS.map((d) => (
    <NavLink key={d.id} to={`/domain/${d.id}`}
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
    <NavLink key={to} to={to}
      className={({ isActive }) => `sb-item${isActive ? ' is-active' : ''}`}
    >
      <span className="sb-glyph">{glyph}</span>
      <span>{label}</span>
    </NavLink>
  ))}

  {/* Profile at bottom of nav */}
  <NavLink to="/profile"
    className={({ isActive }) => `sb-item${isActive ? ' is-active' : ''}`}
    style={{ marginTop: 'auto' }}
  >
    <span className="sb-glyph">👤</span>
    <span>Profile</span>
  </NavLink>
</nav>
```

### 6.3 Footer — progress + theme toggle

Import `useProgress` and `PHASES` from data. Compute active phase and hours remaining:

```js
const { progress, stats } = useProgress()
const activePhase = PHASES.find((p) => p.tasks.some((t) => !progress.tasks[t.id])) ?? PHASES[PHASES.length - 1]
const hoursLeft = stats.hoursTotal - stats.hoursDone
```

Footer JSX:
```jsx
<div className="sb-foot">
  <div className="sb-foot-row">
    <span>Overall</span>
    <span className="sb-foot-pct">{stats.overall}%</span>
  </div>
  <ProgressBar value={stats.overall} color="accent" height={4} />
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
```

Note: `sidebar-theme-btn` CSS class is retained (already defined in `index.css`) so the theme toggle button still works without needing a new CSS class.

---

## 7. What is NOT changing

- **`index.css`** — no changes needed. All required CSS classes exist.
- **Dashboard** — confirmed good, no changes.
- **KeyConcepts, ExamDayChecklist, Profile** — not in scope for this sprint.
- **Any mobile code** — not in scope.
- **Data files (`src/data/`)** — not in scope.
- **Hooks** — not in scope.

---

---

## 8. DomainDeepDive (`web/src/screens/DomainDeepDive.jsx`)

### 8.1 Screen-level header

Add a `sec-head` above the `dom-hero` for title consistency. The desc is dynamic per domain:

```jsx
<section className="sec">
  <header className="sec-head">
    <div>
      <h2 className="sec-title">{domain.name}</h2>
      <p className="sec-desc">D{domain.num} of 5 · {domain.weight}% of exam</p>
    </div>
  </header>
  {/* dom-hero and dom-grid below */}
</section>
```

### 8.2 Hero eyebrow — add colored icon + pill

Replace the plain `<p className="dom-hero-eyebrow">`:

```jsx
{/* BEFORE */}
<p className="dom-hero-eyebrow">D{domain.num} · {domain.weight}%</p>

{/* AFTER */}
<div className="dom-hero-eyebrow">
  <span className={`legend-sw dtag-${domain.color}`} />
  <span>Domain {domain.num} of 5</span>
  {domain.difficulty === 'Hardest' && (
    <span className="pill pill-warn">Hardest domain</span>
  )}
</div>
```

### 8.3 Hero middle column — add `dom-hero-l` class and `dom-hero-blurb`

```jsx
{/* BEFORE */}
<div>
  …eyebrow, title, blurb…
  <p>{domain.blurb}</p>
</div>

{/* AFTER */}
<div className="dom-hero-l">
  …eyebrow, title…
  <p className="dom-hero-blurb">{domain.blurb}</p>
</div>
```

### 8.4 Hero stats — add third stat + weight unit suffix

Add study phase as a third `dh-stat` block, and split the weight value from the "%" unit using `dh-stat-u`:

```jsx
<div className="dom-hero-r">
  <div className="dh-stat">
    <div className="dh-stat-v">
      {domain.weight}<span className="dh-stat-u">%</span>
    </div>
    <div className="dh-stat-l">of exam</div>
  </div>
  <div className="dh-stat">
    <div className="dh-stat-v">{domain.questions}</div>
    <div className="dh-stat-l">questions</div>
  </div>
  <div className="dh-stat">
    <div className="dh-stat-v">P{domain.phase}</div>
    <div className="dh-stat-l">study phase</div>
  </div>
</div>
```

### 8.5 Topic list — use CSS span classes instead of `<strong>`

```jsx
{/* BEFORE */}
<li key={t.name}><strong>{t.name}</strong> — {t.desc}</li>

{/* AFTER */}
<li key={t.name}>
  <span className="topic-name">{t.name}</span>
  <span className="topic-desc"> — {t.desc}</span>
</li>
```

### 8.6 `lb-row` — add inner `lb-row-l` / `lb-row-r` structure

Each link row button should have left label + right metadata:

```jsx
{/* Phase */}
<button className="lb-row" onClick={() => navigate('/plan')}>
  <span className="lb-row-l">Phase {domain.phase} — study plan</span>
  <span className="lb-row-r">→</span>
</button>

{/* Courses */}
{COURSES.filter(c => c.domains.includes(domain.id)).map(c => (
  <button key={c.id} className="lb-row" onClick={() => navigate('/courses')}>
    <span className="lb-row-l">{c.name}</span>
    <span className="lb-row-r">{c.hours}h →</span>
  </button>
))}

{/* Projects */}
{PROJECTS.filter(p => p.domains.includes(domain.id)).map(p => (
  <button key={p.id} className="lb-row" onClick={() => navigate('/projects')}>
    <span className="lb-row-l">{p.name}</span>
    <span className="lb-row-r">{p.complexity} →</span>
  </button>
))}
```

---

## 9. KeyConcepts (`web/src/screens/KeyConcepts.jsx`)

The screen has 9 class-name / DOM-structure mismatches against the prototype. No CSS changes needed — all target classes exist.

### 9.1 Screen wrapper — add base `screen` class

```jsx
{/* BEFORE */}
<div className="ref-screen">

{/* AFTER */}
<div className="screen ref-screen">
```

### 9.2 Toolrow — wrong class name + pill class

```jsx
{/* BEFORE */}
<div className="ref-banner">
  <span className="pill pill-warn">…</span>
  <span className="pill pill-neutral">…</span>
</div>

{/* AFTER */}
<div className="ref-toolrow">
  <span className="pill pill-warn">No docs allowed during exam</span>
  <span className="pill pill-dim">Print to PDF · ⌘P</span>
</div>
```

### 9.3 Card borders — add `Card` component to all 6 cards

Every `<div className="ref-card ref-*">` needs to become `<Card className="ref-card ref-*">`. `Card` provides the border, background, and base padding.

Add `import Card from '../components/Card'` at the top.

Affected cards: `ref-api`, `ref-models`, `ref-mcp`, `ref-cc`, `ref-patt`, `ref-anti`.

### 9.4 Card header — wrong class names

Every card has `<div className="ref-eyebrow">N</div><h3 className="ref-heading">Title</h3>`. Replace with:

```jsx
<div className="ref-card-head">
  <span className="ref-num">01</span>
  <h3>API essentials</h3>
</div>
```

Remove `ref-heading` className from all `<h3>` elements (the CSS targets `ref-card-head h3` directly).

### 9.5 Model table — wrong class + column structure

```jsx
{/* BEFORE */}
<table className="ref-table">
  …
  <tr>
    <td>{m.name}</td>
    <td>{m.cost}</td>
    <td>{m.speed}</td>
    <td>{m.use}</td>
    <td>{m.ctx}</td>
  </tr>

{/* AFTER */}
<table className="ref-tab">
  …
  <tr key={m.name}>
    <td><strong>{m.name}</strong></td>
    <td>{m.cost}</td>
    <td>{m.speed}</td>
    <td className="ref-use">{m.use}</td>
    <td><code>{m.ctx}</code></td>
  </tr>
```

### 9.6 MCP card — all wrong class names

```jsx
{/* BEFORE */}
<div className="ref-mcp-grid">
  <div className="ref-mcp-cell">
    <div className="ref-mcp-name">{m.name}</div>
    <div className="ref-mcp-controller">{m.controller}</div>
    <div className="ref-mcp-use">{m.use}</div>
  </div>
</div>

{/* AFTER */}
<div className="mcp-row">
  {REFERENCE.mcp.map(({ name, controller, use }) => (
    <div key={name} className="mcp-cell">
      <div className="mcp-title">{name}</div>
      <div className="mcp-ctrl">{controller}</div>
      <div className="mcp-use">{use}</div>
    </div>
  ))}
</div>
```

### 9.7 Claude Code hierarchy — completely different structure

Replace the entire interior of the `ref-cc` card body with:

```jsx
<div className="cc-grid">
  <div>
    <div className="col-head">CLAUDE.md levels</div>
    <ul className="cc-list">
      {REFERENCE.claudeCode.claudeMd.map(({ level, path, desc }) => (
        <li key={level}>
          <div className="cc-l1"><strong>{level}</strong> <code>{path}</code></div>
          <div className="cc-l2">{desc}</div>
        </li>
      ))}
    </ul>
  </div>
  <div>
    <div className="col-head">Settings files</div>
    <ul className="cc-list">
      {REFERENCE.claudeCode.settings.map(({ k, v }) => (
        <li key={k}>
          <div className="cc-l1"><code>{k}</code></div>
          <div className="cc-l2">{v}</div>
        </li>
      ))}
    </ul>
    <div className="col-head mt-12">Hook types</div>
    <div className="kbd-row">
      {REFERENCE.claudeCode.hooks.map((hookName) => (
        <kbd key={hookName} className="kbd">{hookName}</kbd>
      ))}
    </div>
  </div>
</div>
```

Key differences from current: `ref-cc-cols` → `cc-grid`; `ref-cc-section-title` → `col-head`; items in a `cc-list` `<ul>` with `cc-l1`/`cc-l2` divs; `<strong>` + `<code>` inline in `cc-l1`; hooks use `kbd-row` wrapper; spacing between settings title and hooks uses `className="col-head mt-12"` (not a `--spaced` modifier).

### 9.8 Patterns card — wrong class names + icon placement

```jsx
{/* BEFORE */}
<div className="ref-patt-grid">
  <div className="ref-patt-cell">
    <div className="ref-patt-icon"><PatternIcon name={name} /></div>
    <div className="ref-patt-name">{name}</div>
    <div className="ref-patt-desc">{desc}</div>
  </div>
</div>

{/* AFTER */}
<div className="patt-grid">
  {REFERENCE.patterns.map(({ name, desc }) => (
    <div key={name} className="patt-cell">
      <div className="patt-title">{name}</div>
      <div className="patt-desc">{desc}</div>
      <PatternIcon name={name} />
    </div>
  ))}
</div>
```

Icon goes **after** the text (not before). Remove the `ref-patt-icon` wrapper div.

### 9.9 Anti-patterns list — wrong class name

```jsx
{/* BEFORE */}
<ul className="ref-anti-list">

{/* AFTER */}
<ul className="anti-list anti-list-compact">
```

---

## 10. ExamDayChecklist (`web/src/screens/ExamDayChecklist.jsx`)

### 10.1 Screen wrapper

`<div className="screen-exam">` → `<div className="screen-container">` to match every other screen.

### 10.2 Section header

Add the shared `sec-head` pattern above the hero card:

```jsx
<section className="sec">
  <header className="sec-head">
    <div>
      <h2 className="sec-title">Exam day</h2>
      <p className="sec-desc">One last gut-check before you sit the exam.</p>
    </div>
  </header>
  {/* hero card and exam-cols below */}
</section>
```

### 10.3 Hero — add Card + fix class names

Wrap the hero in `Card` and fix all inner class names:

```jsx
import Card from '../components/Card'

<Card className={`exam-hero${allDone ? ' is-ready' : ''}`}>
  <div className="exam-hero-l">
    <div className="exam-hero-eyebrow">Exam logistics</div>
    <div className="exam-meta">
      <div className="exam-meta-cell">
        <div className="emc-l">Duration</div>
        <div className="emc-v">120 min</div>
      </div>
      <div className="exam-meta-cell">
        <div className="emc-l">Questions</div>
        <div className="emc-v">60</div>
      </div>
      <div className="exam-meta-cell">
        <div className="emc-l">Passing</div>
        <div className="emc-v">720 / 1000</div>
      </div>
      <div className="exam-meta-cell">
        <div className="emc-l">Reference</div>
        <div className="emc-v">None allowed</div>
      </div>
    </div>
  </div>
  <div className="exam-hero-r">
    <div className="exam-ready">
      <div className="exam-ready-pct">
        {Math.round((doneCount / EXAM_DAY_CHECKLIST.length) * 100)}%
      </div>
      <div className="exam-ready-l">{doneCount} / {EXAM_DAY_CHECKLIST.length} ready</div>
    </div>
  </div>
</Card>
```

Changes from current:
- `exam-hero-left` → `exam-hero-l`
- `exam-hero-right` → `exam-hero-r`
- `exam-meta-grid` → `exam-meta`
- `exam-meta-item` → `exam-meta-cell`
- `exam-meta-label` span → `<div className="emc-l">`
- `exam-meta-val` span → `<div className="emc-v">`
- `exam-ready-label` → `exam-ready-l`, wrapped in `<div className="exam-ready">`

### 10.4 Body layout — `exam-body` → `exam-cols`

```jsx
{/* BEFORE */}
<div className="exam-body">

{/* AFTER */}
<div className="exam-cols">
```

### 10.5 Pre-exam readiness card — add Card + fix item structure

```jsx
<Card className="exam-list">
  <h3>Pre-exam readiness</h3>
  <div className="exam-list-body">
    {EXAM_DAY_CHECKLIST.map((item) => {
      const isAuto = item.id === 'x1' || item.id === 'x2'
      const isChecked = checked(item)
      return (
        <div key={item.id} className={`exam-row${item.critical ? ' is-critical' : ''}`}>
          <Checkbox
            checked={isChecked}
            onChange={isAuto ? undefined : () => toggleExamDay(item.id)}
            disabled={isAuto}
            label={item.label}
            sub={isAuto ? 'auto-tracked from your progress' : null}
          />
          <div className="exam-row-r">
            <span className={`pill ${item.critical ? 'pill-warn' : 'pill-dim'}`}>
              {item.critical ? 'Required' : 'Recommended'}
            </span>
          </div>
        </div>
      )
    })}
  </div>
</Card>
```

Changes from current:
- `<div className="exam-list">` → `<Card className="exam-list">`
- Add `<div className="exam-list-body">` wrapper around items
- `exam-item` → `exam-row` (with `is-critical` modifier when `item.critical`)
- Checkbox receives `label={item.label}` and `sub={...}` props directly — remove standalone `exam-item-content`, `exam-item-label`, `exam-item-sub` divs
- Pill wrapped in `<div className="exam-row-r">`
- `pill-neutral` → `pill-dim`

### 10.6 What to expect card — add Card + fix list and footer

```jsx
<Card className="exam-expect">
  <h3>What to expect</h3>
  <ul className="expect-list">
    <li>Questions are scenario-based — no simple recall</li>
    <li>Expect agentic architecture traps (the hardest domain)</li>
    <li>MCP primitives are tested heavily — know Tools vs Resources vs Prompts</li>
    <li>Anti-pattern recognition is a core test skill</li>
    <li>No reference materials allowed — study the Quick Reference beforehand</li>
    <li>High scores are achievable — most architects who prepare thoroughly pass on first attempt</li>
  </ul>
  <div className="expect-foot">
    <a className="primary-btn" href={CERT.registerUrl} target="_blank" rel="noopener noreferrer">
      Register at Skilljar ↗
    </a>
    <button className="ghost-btn" onClick={() => navigate('/concepts')}>
      Open quick reference →
    </button>
  </div>
</Card>
```

Changes from current:
- `<div className="exam-expect">` → `<Card className="exam-expect">`
- `<ul>` → `<ul className="expect-list">`
- `<div className="exam-expect-foot">` → `<div className="expect-foot">`
- `<a className="btn btn-secondary">` → `<a className="primary-btn">`
- `<button className="btn-link">` → `<button className="ghost-btn">`

---

## 11. What is NOT changing

- **`index.css`** — no changes needed. All required CSS classes exist.
- **Dashboard** — confirmed good, no changes.
- **Profile** — not in scope for this sprint.
- **Any mobile code** — not in scope.
- **Data files (`src/data/`)** — not in scope.
- **Hooks** — not in scope.

---

## 12. Implementation order

Tasks should be implemented in this order to avoid regressions:

1. ExamBlueprint fixes (self-contained screen)
2. StudyPlan fixes (self-contained screen)
3. Courses fixes (self-contained screen)
4. Projects fixes (self-contained screen)
5. DomainDeepDive fixes (self-contained screen)
6. KeyConcepts fixes (self-contained screen)
7. ExamDayChecklist fixes (self-contained screen)
8. Sidebar rewrite (touches shared nav; do last to avoid distraction while fixing screens)

Each task: implement → verify class names match spec → commit.
