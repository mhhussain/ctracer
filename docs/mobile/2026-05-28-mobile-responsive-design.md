# Mobile Responsive Design — CCA-F Study Hub Web App

**Date:** 2026-05-28  
**Scope:** Web app (`web/`) — presentation changes only  
**Breakpoint:** `@media (max-width: 480px)` (phone-only)  
**Note:** This spec lives in `docs/mobile/` because the Flutter mobile app will share these same layout patterns. Treat it as the canonical mobile UX reference for both platforms.

---

## Goals

Make the existing web app usable on a 375–430px phone screen. All functionality stays intact — this is purely layout and navigation presentation work.

---

## Navigation Architecture

### Decision: Upgrade Sidebar to Drawer-Capable (Option C)

The existing `Sidebar.jsx` gains a mobile drawer mode. No new nav component is created, avoiding duplication of nav item lists.

**State flow:**

```
App.jsx
  ├── sidebarOpen: boolean (default false)
  ├── → <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
  └── → <PageTopbar onMenuClick={() => setSidebarOpen(true)} />
```

**JSX changes:**
- `App.jsx`: owns `sidebarOpen` state; passes `isOpen` + `onClose` to Sidebar; passes `onMenuClick` to PageTopbar
- `Sidebar.jsx`: accepts `isOpen` + `onClose` props; adds `is-open` class when open
- `App.jsx`: renders `<div className={`sidebar-backdrop${sidebarOpen ? ' is-open' : ''}`} onClick={() => setSidebarOpen(false)} />` as a sibling to `<Sidebar>` in the JSX (not inside the sidebar) so the CSS sibling selector `.sidebar.is-open + .sidebar-backdrop` works
- `PageTopbar.jsx`: adds a hamburger button `☰` (visible only on mobile via CSS); subtitle hidden on mobile; Reference button hidden on mobile; exam label shortened

**On desktop:** `isOpen`/`onClose` are ignored — the sidebar renders in its normal sticky layout.

**CSS (Sidebar mobile):**

```css
@media (max-width: 480px) {
  .sidebar {
    position: fixed;
    top: 0; left: 0;
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
  .sidebar.is-open + .sidebar-backdrop,
  .sidebar-backdrop.is-open {
    display: block;
  }
}
```

---

## PageTopbar — Mobile Layout

At ≤480px:

| Zone | Desktop | Mobile |
|------|---------|--------|
| Left | Page title + subtitle | Hamburger `☰` + page title |
| Right | ✦ Reference · 📅 Exam: 14d | 📅 14d (shortened) |

- **Subtitle** hidden (saves vertical height in topbar)
- **Reference button** hidden — Key Concepts is accessible via sidebar nav
- **Exam button label** shortened: "📅 14d" instead of "📅 Exam: 14d"
- **Hamburger button** calls `onMenuClick` prop; styled as a ghost icon button; visible only at ≤480px

The exam-date modal behaviour is unchanged — tapping the button still opens the date-picker modal.

---

## Global CSS Changes

```css
@media (max-width: 480px) {
  :root {
    --pad: 16px;
    --gap: 12px;
  }
  .screen,
  .screen-container {
    padding: 16px 16px 80px;
  }
  .topbar {
    padding: 12px 16px;
  }
}
```

---

## Screen-by-Screen Changes

### Dashboard

**Hero card (`.hero`)**
- `.hero-r` (ring progress chart) — `display: none` on mobile. Overall % is shown in the stat tiles and sidebar footer.
- `.hero` grid → `grid-template-columns: 1fr`
- `.hero-title` font-size reduced: `22px`
- `.hero-meta` gap tightened: `gap: 14px`

**Domain progress rows (`.dom-row`)**
- Current: `grid-template-columns: 220px 1fr 130px` (fixed widths break at 375px)
- Mobile: replace with `display: flex; flex-wrap: wrap; gap: 8px` — tag + name on first row, progress bar + pct on second row

**Stat row (`.stat-row`)**
- Already `repeat(2, 1fr)` at 960px — no further change needed at 480px

**Phase pipeline (`.phase-pipe`)**
- Already `grid-template-columns: 1fr` at 960px ✓

---

### Exam Blueprint

**Donut + legend (`.bp-donut`)**
- Current: `grid-template-columns: auto 1fr` (220px SVG beside legend)
- Mobile: `grid-template-columns: 1fr` — SVG donut centres above the legend list

**Expanded domain body (`.exp-cols`)**
- Current: `grid-template-columns: 1.6fr 1fr`
- Mobile: `grid-template-columns: 1fr` — topics list above anti-patterns

---

### Study Plan

**Phase accordion header (`.phase-head`)**
- Current: 7-column grid — `60px 120px 90px 1fr auto auto auto` (overflows at 375px)
- Mobile: 2-row layout using CSS grid-template-areas:
  - Row 1: phase num + name + chevron
  - Row 2: week range + goal text + pills

```css
@media (max-width: 480px) {
  .phase-head {
    grid-template-columns: auto 1fr auto;
    grid-template-rows: auto auto;
  }
  .phase-num  { grid-area: 1 / 1; }
  .phase-name { grid-area: 1 / 2; }
  .exp-chev   { grid-area: 1 / 3; }
  .phase-week { grid-area: 2 / 1 / 3 / 4; font-size: 11px; }
  .phase-goal { display: none; } /* hidden in header on mobile; visible in expanded body */
  /* pills: hidden in header on mobile to save space */
  .phase-head .pill { display: none; }
}
```

**Roadmap (`.rm-line`)** — already `grid-template-columns: 1fr` at 960px ✓

---

### Courses

**Filter chips (`.filter-row`)**
- Add `flex-wrap: wrap` — chips wrap to second line on phone

**Modal → bottom sheet**
- `.modal-veil` — `padding: 0; align-items: flex-end` on mobile
- `.modal` — `border-radius: 14px 14px 0 0; max-height: 90vh; width: 100%; max-width: 100%`

This same bottom-sheet treatment applies to the exam-date modal in PageTopbar.

---

### Projects

**Project grid (`.proj-grid`)**
- Current: `repeat(auto-fill, minmax(320px, 1fr))` — borderline at 375px with padding
- Mobile: `grid-template-columns: 1fr` (explicit 1-col)

---

### Domain Deep Dive

**Hero stats panel (`.dom-hero-r`)**
- Hidden on mobile (`display: none`) — weight % and question count are in the topbar subtitle on desktop and the donut chart on Blueprint

**Domain grid (`.dom-grid`)** — already 1-col at 960px ✓

**Expanded topic body (`.exp-cols`)**  
- Same as Blueprint: stack to `grid-template-columns: 1fr`

**Domain nav (`.dom-nav`)**
- `grid-template-columns: 1fr 1fr` stays — prev/next buttons work fine side by side

---

### Key Concepts (Reference)

**Reference grid (`.ref-grid`)**
- Already 2-col at 1100px; at 480px → `grid-template-columns: 1fr`

**Definition list rows (`.ref-dl-row`)**
- Current: `grid-template-columns: 170px 1fr`
- Mobile: `grid-template-columns: 1fr` — dt stacks above dd

**Claude Code grid (`.cc-grid`)**
- `grid-template-columns: 1fr 1fr` → `grid-template-columns: 1fr`

---

### Exam Day Checklist

**Exam hero (`.exam-hero`)**
- `.exam-ready` (large 56px readiness %) — hidden on mobile; readiness shown in meta cells
- `.exam-hero` grid → `grid-template-columns: 1fr`

**Exam meta (`.exam-meta`)**
- `repeat(4, 1fr)` → `repeat(2, 1fr)` on phone

**Exam columns (`.exam-cols`)** — already 1-col at 960px ✓

---

### Profile

No changes required — already a narrow single-column layout.

---

### Mobile Download

Out of scope for this spec. Screen is currently a stub and will be designed separately.

---

## Functionality Flags

These are the places where mobile behaviour diverges from desktop in a meaningful way — not bugs, just documented decisions.

| # | Screen / Component | What changes | Decision |
|---|-------------------|--------------|----------|
| 1 | PageTopbar | ✦ Reference button not shown on mobile | Acceptable — Key Concepts accessible via sidebar drawer |
| 2 | Exam Blueprint donut | `onMouseEnter`/`onMouseLeave` hover effects don't fire on touch | Acceptable — `onClick` still works; dim/highlight just won't show on tap |
| 3 | Courses modal, PageTopbar exam modal | Renders as bottom sheet instead of centred dialog | CSS-only — no logic change |
| 4 | Dashboard hero | Ring progress chart hidden on mobile | Acceptable — % shown in stat tiles |
| 5 | Domain Deep Dive hero | Stats panel (weight %, question count) hidden | Acceptable — info available on Blueprint screen |
| 6 | Study Plan phase header | Goal text hidden in header (still shows in expanded body) | Acceptable — saves space, goal visible when phase is open |

---

## Implementation Notes for Subagents

This spec is designed to be parallelised. Each task below is independent:

1. **App Shell + Nav** — `App.jsx`, `Sidebar.jsx`, `PageTopbar.jsx` + sidebar CSS in `index.css`
2. **Dashboard screen** — `.hero`, `.dom-row`, `.dash-grid` CSS
3. **Exam Blueprint screen** — `.bp-donut`, `.exp-cols` CSS
4. **Study Plan screen** — `.phase-head` CSS
5. **Courses screen** — `.filter-row`, `.modal-veil`, `.modal` CSS
6. **Projects screen** — `.proj-grid` CSS
7. **Domain Deep Dive screen** — `.dom-hero-r`, `.exp-cols` CSS
8. **Key Concepts screen** — `.ref-grid`, `.ref-dl-row`, `.cc-grid` CSS
9. **Exam Day screen** — `.exam-meta`, `.exam-hero`, `.exam-ready` CSS
10. **Global CSS** — `--pad` override, `.screen`, `.screen-container`, `.topbar` padding

Tasks 2–10 depend on task 1 being complete (the sidebar drawer state plumbing must be in place before testing any screen).

---

## Files Changed Summary

| File | Change type |
|------|------------|
| `web/src/App.jsx` | Add `sidebarOpen` state; pass props to Sidebar + PageTopbar |
| `web/src/components/Sidebar.jsx` | Accept `isOpen`/`onClose`; add backdrop; add `is-open` class |
| `web/src/components/PageTopbar.jsx` | Add hamburger button; hide reference btn + subtitle on mobile |
| `web/src/index.css` | All layout/spacing CSS changes — one `@media (max-width: 480px)` block |
