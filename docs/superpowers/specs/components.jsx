/* global React */
const { useState, useEffect, useMemo, useCallback, useRef } = React;

// ---------- localStorage helpers ----------
const LS_KEY = "ccaf_state_v1";
function loadState() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveState(s) {
  localStorage.setItem(LS_KEY, JSON.stringify(s));
}
function useStudyState() {
  const [state, setState] = useState(() => {
    const s = loadState();
    return {
      tasks: s.tasks || {}, // taskId -> bool
      courses: s.courses || {}, // courseId -> bool
      projects: s.projects || {}, // projectId -> "todo"|"wip"|"done"
      checklist: s.checklist || {}, // checklist id -> bool
      practiceScore: s.practiceScore ?? null,
    };
  });
  useEffect(() => {
    saveState(state);
  }, [state]);
  const api = useMemo(
    () => ({
      state,
      toggleTask: (id) =>
        setState((s) => ({ ...s, tasks: { ...s.tasks, [id]: !s.tasks[id] } })),
      toggleCourse: (id) =>
        setState((s) => ({
          ...s,
          courses: { ...s.courses, [id]: !s.courses[id] },
        })),
      cycleProject: (id) =>
        setState((s) => {
          const cur = s.projects[id] || "todo";
          const next = cur === "todo" ? "wip" : cur === "wip" ? "done" : "todo";
          return { ...s, projects: { ...s.projects, [id]: next } };
        }),
      setProject: (id, v) =>
        setState((s) => ({ ...s, projects: { ...s.projects, [id]: v } })),
      toggleCheck: (id) =>
        setState((s) => ({
          ...s,
          checklist: { ...s.checklist, [id]: !s.checklist[id] },
        })),
      reset: () =>
        setState({
          tasks: {},
          courses: {},
          projects: {},
          checklist: {},
          practiceScore: null,
        }),
      seedDemo: () => {
        // mark phase 1 tasks done + course c5 done + project pr5 wip
        const { PHASES } = window.CCA_DATA;
        const tasks = {};
        PHASES[0].tasks.forEach((t) => (tasks[t.id] = true));
        PHASES[1].tasks.slice(0, 4).forEach((t) => (tasks[t.id] = true));
        setState((s) => ({
          ...s,
          tasks,
          courses: { c5: true, c6: true, c3: true },
          projects: { pr4: "done", pr2: "wip" },
        }));
      },
    }),
    [state]
  );
  return api;
}

// ---------- Atoms ----------
function Pill({ tone = "neutral", children, dim = false, className = "" }) {
  return (
    <span className={`pill pill-${tone} ${dim ? "pill-dim" : ""} ${className}`}>
      {children}
    </span>
  );
}

function DomainTag({ domain, size = "sm", interactive = false, onClick }) {
  return (
    <span
      className={`dtag dtag-${size} dtag-${domain.color} ${interactive ? "is-clickable" : ""}`}
      onClick={onClick}
      title={domain.name}
    >
      <span className="dtag-dot" />D{domain.num} · {domain.short}
    </span>
  );
}

function ProgressBar({ value, max = 100, color = "neutral", height = 6 }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="pbar" style={{ height }}>
      <div className={`pbar-fill pbar-${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function Checkbox({ checked, onChange, label, sub = null, strikeWhenDone = true }) {
  return (
    <label className={`check ${checked ? "is-checked" : ""}`}>
      <span
        className="check-box"
        onClick={(e) => {
          e.preventDefault();
          onChange();
        }}
      >
        {checked ? (
          <svg viewBox="0 0 16 16" width="11" height="11">
            <path
              d="M3.5 8.5l3 3 6-6.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
      <span className="check-body">
        <span className={`check-label ${checked && strikeWhenDone ? "is-done" : ""}`}>
          {label}
        </span>
        {sub ? <span className="check-sub">{sub}</span> : null}
      </span>
    </label>
  );
}

function Card({ children, className = "", as: As = "div", ...rest }) {
  return (
    <As className={`card ${className}`} {...rest}>
      {children}
    </As>
  );
}

function Section({ title, desc, action, children, className = "" }) {
  return (
    <section className={`sec ${className}`}>
      <header className="sec-head">
        <div>
          <h2 className="sec-title">{title}</h2>
          {desc ? <p className="sec-desc">{desc}</p> : null}
        </div>
        {action ? <div className="sec-action">{action}</div> : null}
      </header>
      {children}
    </section>
  );
}

function StatTile({ label, value, sub, accent = false }) {
  return (
    <div className={`stat ${accent ? "is-accent" : ""}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub ? <div className="stat-sub">{sub}</div> : null}
    </div>
  );
}

function KBD({ children }) {
  return <kbd className="kbd">{children}</kbd>;
}

// ---------- Sidebar ----------
const NAV_ITEMS = [
  { id: "home", label: "Dashboard", glyph: "◉" },
  { id: "blueprint", label: "Exam Blueprint", glyph: "◐" },
  { id: "plan", label: "Study Plan", glyph: "▤" },
  { id: "courses", label: "Courses", glyph: "▦" },
  { id: "projects", label: "Projects", glyph: "▣" },
  { id: "reference", label: "Quick Reference", glyph: "≡" },
  { id: "examday", label: "Exam Day", glyph: "★" },
];

function Sidebar({ route, navigate, progress }) {
  const { DOMAINS } = window.CCA_DATA;
  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <div className="sb-logo">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <rect x="2" y="2" width="20" height="20" rx="5" fill="var(--accent)" opacity="0.16" />
            <path d="M7 12.5 L10 16 L17 8" stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="sb-brand-text">
          <div className="sb-brand-1">CCA-F Hub</div>
          <div className="sb-brand-2">Certification prep</div>
        </div>
      </div>

      <nav className="sb-nav">
        <div className="sb-group-label">General</div>
        {NAV_ITEMS.slice(0, 5).map((n) => (
          <button
            key={n.id}
            className={`sb-item ${route.screen === n.id ? "is-active" : ""}`}
            onClick={() => navigate({ screen: n.id })}
          >
            <span className="sb-glyph">{n.glyph}</span>
            <span>{n.label}</span>
          </button>
        ))}

        <div className="sb-group-label">Domain deep dives</div>
        {DOMAINS.map((d) => (
          <button
            key={d.id}
            className={`sb-item sb-item-sub ${
              route.screen === "domain" && route.domainId === d.id ? "is-active" : ""
            }`}
            onClick={() => navigate({ screen: "domain", domainId: d.id })}
          >
            <span className={`sb-domain-dot dtag-${d.color}`} />
            <span className="sb-domain-num">D{d.num}</span>
            <span>{d.short}</span>
            <span className="sb-domain-w">{d.weight}%</span>
          </button>
        ))}

        <div className="sb-group-label">Prep finish</div>
        {NAV_ITEMS.slice(5).map((n) => (
          <button
            key={n.id}
            className={`sb-item ${route.screen === n.id ? "is-active" : ""}`}
            onClick={() => navigate({ screen: n.id })}
          >
            <span className="sb-glyph">{n.glyph}</span>
            <span>{n.label}</span>
          </button>
        ))}
      </nav>

      <div className="sb-foot">
        <div className="sb-foot-row">
          <span>Overall</span>
          <span className="sb-foot-pct">{progress.overall}%</span>
        </div>
        <ProgressBar value={progress.overall} color="accent" height={4} />
        <div className="sb-foot-meta">
          <span>{progress.phaseLabel}</span>
          <span>·</span>
          <span>{progress.hoursLeft}h left</span>
        </div>
      </div>
    </aside>
  );
}

// ---------- Topbar ----------
function Topbar({ title, sub, right }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">{title}</h1>
        {sub ? <div className="topbar-sub">{sub}</div> : null}
      </div>
      <div className="topbar-right">{right}</div>
    </header>
  );
}

// Make available globally
Object.assign(window, {
  React,
  Pill,
  DomainTag,
  ProgressBar,
  Checkbox,
  Card,
  Section,
  StatTile,
  KBD,
  Sidebar,
  Topbar,
  useStudyState,
});
