/* global React, Card, Section, Pill, ProgressBar, Checkbox, DomainTag, StatTile */
const { useState: useStateA, useMemo: useMemoA } = React;

// =====================================================
// Screen 1 — Dashboard
// =====================================================
function ScreenDashboard({ study, navigate, progress }) {
  const { CERT, DOMAINS, PHASES, COURSES, PROJECTS } = window.CCA_DATA;

  const coursesDone = COURSES.filter((c) => study.state.courses[c.id]).length;
  const coursesTotal = COURSES.length;
  const partnerDone = COURSES.filter(
    (c) => c.partnerRequired && study.state.courses[c.id]
  ).length;
  const partnerTotal = COURSES.filter((c) => c.partnerRequired).length;
  const projectsDone = PROJECTS.filter(
    (p) => study.state.projects[p.id] === "done"
  ).length;
  const projectsTotal = PROJECTS.length;
  const projectsWip = PROJECTS.filter(
    (p) => study.state.projects[p.id] === "wip"
  ).length;

  // Active phase: first phase with incomplete tasks
  const activePhase =
    PHASES.find(
      (p) => p.tasks.some((t) => !study.state.tasks[t.id])
    ) || PHASES[PHASES.length - 1];

  const todayTasks = activePhase.tasks.filter((t) => !study.state.tasks[t.id]).slice(0, 4);

  return (
    <div className="screen">
      <div className="dash-grid">
        {/* Hero stripe */}
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
              <RingProgress pct={progress.overall} />
              <div className="hero-ring-label">
                <div className="hero-ring-num">{progress.overall}%</div>
                <div className="hero-ring-sub">overall ready</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Phase pipeline */}
        <Card className="phases">
          <div className="card-head">
            <h3>Study phase pipeline</h3>
            <button className="link-btn" onClick={() => navigate({ screen: "plan" })}>
              View full plan →
            </button>
          </div>
          <div className="phase-pipe">
            {PHASES.map((p, i) => {
              const total = p.tasks.length;
              const done = p.tasks.filter((t) => study.state.tasks[t.id]).length;
              const pct = Math.round((done / total) * 100);
              const isActive = activePhase.id === p.id;
              const isDone = done === total;
              return (
                <React.Fragment key={p.id}>
                  <button
                    className={`phase-node ${isActive ? "is-active" : ""} ${isDone ? "is-done" : ""}`}
                    onClick={() => navigate({ screen: "plan", phaseId: p.id })}
                  >
                    <div className="phase-node-num">
                      {isDone ? "✓" : `0${p.num}`}
                    </div>
                    <div className="phase-node-name">{p.name}</div>
                    <div className="phase-node-week">{p.week}</div>
                    <div className="phase-node-bar">
                      <ProgressBar value={pct} color={isActive ? "accent" : "muted"} height={3} />
                    </div>
                    <div className="phase-node-prog">{done}/{total} tasks</div>
                  </button>
                  {i < PHASES.length - 1 ? <div className={`phase-connector ${isDone ? "is-done" : ""}`} /> : null}
                </React.Fragment>
              );
            })}
          </div>
        </Card>

        {/* Quick stats */}
        <div className="stat-row">
          <StatTile label="Total study hours" value={`${progress.hoursTotal}h`} sub={`${progress.hoursDone}h done`} />
          <StatTile label="Courses" value={`${coursesDone}/${coursesTotal}`} sub={`${partnerDone}/${partnerTotal} required`} />
          <StatTile label="Projects" value={`${projectsDone}/${projectsTotal}`} sub={`${projectsWip} in progress`} />
          <StatTile label="Practice score" value={study.state.practiceScore ?? "—"} sub="target 80%+" />
        </div>

        {/* Domain progress */}
        <Card className="dom-prog">
          <div className="card-head">
            <h3>Progress by exam domain</h3>
            <button className="link-btn" onClick={() => navigate({ screen: "blueprint" })}>
              Exam blueprint →
            </button>
          </div>
          <div className="dom-prog-list">
            {DOMAINS.map((d) => {
              // crude domain progress = courses+projects tagged to that domain
              const relCourses = window.CCA_DATA.COURSES.filter((c) => c.domains.includes(d.id));
              const cDone = relCourses.filter((c) => study.state.courses[c.id]).length;
              const relProjects = window.CCA_DATA.PROJECTS.filter((p) => p.domains.includes(d.id));
              const pDone = relProjects.filter((p) => study.state.projects[p.id] === "done").length;
              const total = relCourses.length + relProjects.length;
              const done = cDone + pDone;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <button
                  key={d.id}
                  className="dom-row"
                  onClick={() => navigate({ screen: "domain", domainId: d.id })}
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
              );
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
                Phase {activePhase.num} complete — open the study plan to start phase {Math.min(activePhase.num + 1, 4)}.
              </div>
            ) : (
              todayTasks.map((t) => (
                <Checkbox
                  key={t.id}
                  checked={!!study.state.tasks[t.id]}
                  onChange={() => study.toggleTask(t.id)}
                  label={t.label}
                  sub={`${t.hours}h · ${t.kind}`}
                />
              ))
            )}
          </div>
          <button className="ghost-btn" onClick={() => navigate({ screen: "plan", phaseId: activePhase.id })}>
            Open phase {activePhase.num} →
          </button>
        </Card>
      </div>
    </div>
  );
}

function RingProgress({ pct }) {
  const r = 56;
  const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  return (
    <svg viewBox="0 0 140 140" width="140" height="140" className="ring">
      <circle cx="70" cy="70" r={r} fill="none" stroke="var(--border)" strokeWidth="10" />
      <circle
        cx="70"
        cy="70"
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={off}
        transform="rotate(-90 70 70)"
      />
    </svg>
  );
}

// =====================================================
// Screen 2 — Exam Blueprint
// =====================================================
function ScreenBlueprint({ navigate }) {
  const { DOMAINS, CERT } = window.CCA_DATA;
  const [hovered, setHovered] = useStateA(null);
  const [expanded, setExpanded] = useStateA(DOMAINS[0].id);

  // Donut: each domain weight to slice
  const total = DOMAINS.reduce((a, b) => a + b.weight, 0);
  let acc = 0;
  const slices = DOMAINS.map((d) => {
    const start = acc;
    const end = acc + d.weight;
    acc = end;
    return { ...d, start: (start / total) * 360, end: (end / total) * 360 };
  });

  return (
    <div className="screen">
      <Section title="Blueprint" desc={`${CERT.totalQuestions} questions · ${CERT.duration} · pass at ${CERT.passing}`}>
        <div className="bp-grid">
          {/* Donut + legend */}
          <Card className="bp-donut">
            <div className="donut-wrap">
              <Donut slices={slices} hovered={hovered} setHovered={setHovered} />
              <div className="donut-center">
                <div className="donut-c-1">{CERT.totalQuestions}</div>
                <div className="donut-c-2">questions</div>
              </div>
            </div>
            <div className="donut-legend">
              {DOMAINS.map((d) => (
                <button
                  key={d.id}
                  className={`legend-row ${hovered === d.id ? "is-hov" : ""}`}
                  onMouseEnter={() => setHovered(d.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setExpanded(d.id)}
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

          {/* Difficulty bars */}
          <Card className="bp-bars">
            <h3>Weight & difficulty</h3>
            <p className="muted-sm">Domain 1 is the largest and the hardest. Plan the most build-hours there.</p>
            <div className="bars">
              {DOMAINS.map((d) => (
                <div
                  key={d.id}
                  className="bar-row"
                  onMouseEnter={() => setHovered(d.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div className="bar-row-head">
                    <DomainTag domain={d} interactive onClick={() => navigate({ screen: "domain", domainId: d.id })} />
                    <Pill tone={d.difficulty === "Hardest" ? "warn" : "neutral"} dim>
                      {d.difficulty}
                    </Pill>
                  </div>
                  <div className="bar-track">
                    <div className={`bar-fill dtag-${d.color}`} style={{ width: `${(d.weight / 27) * 100}%` }} />
                    <span className="bar-lab">{d.weight}% · {d.questions} questions</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Expandable domain cards */}
        <div className="bp-expand">
          {DOMAINS.map((d) => {
            const isOpen = expanded === d.id;
            return (
              <Card key={d.id} className={`exp-card ${isOpen ? "is-open" : ""}`}>
                <button className="exp-head" onClick={() => setExpanded(isOpen ? null : d.id)}>
                  <span className={`exp-stripe dtag-${d.color}`} />
                  <DomainTag domain={d} size="md" />
                  <span className="exp-name">{d.name}</span>
                  <span className="exp-meta">
                    <Pill tone="neutral" dim>{d.questions} questions</Pill>
                    <Pill tone="neutral" dim>{d.weight}%</Pill>
                    {d.difficulty === "Hardest" ? <Pill tone="warn">Hardest</Pill> : null}
                  </span>
                  <span className="exp-chev">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen ? (
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
                          {d.antiPatterns.map((a) => (
                            <li key={a}>
                              <span className="anti-x">✕</span>{a}
                            </li>
                          ))}
                        </ul>
                        <button
                          className="primary-btn mt-12"
                          onClick={() => navigate({ screen: "domain", domainId: d.id })}
                        >
                          Open domain deep dive →
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

function Donut({ slices, hovered, setHovered }) {
  const cx = 110, cy = 110, R = 88, r = 56;
  const arc = (start, end) => {
    const a1 = ((start - 90) * Math.PI) / 180;
    const a2 = ((end - 90) * Math.PI) / 180;
    const large = end - start > 180 ? 1 : 0;
    const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
    const x2 = cx + R * Math.cos(a2), y2 = cy + R * Math.sin(a2);
    const x3 = cx + r * Math.cos(a2), y3 = cy + r * Math.sin(a2);
    const x4 = cx + r * Math.cos(a1), y4 = cy + r * Math.sin(a1);
    return `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${r} ${r} 0 ${large} 0 ${x4} ${y4} Z`;
  };
  return (
    <svg viewBox="0 0 220 220" width="220" height="220">
      {slices.map((s) => (
        <path
          key={s.id}
          d={arc(s.start, s.end)}
          className={`donut-slice dtag-${s.color} ${hovered === s.id ? "is-hov" : ""} ${hovered && hovered !== s.id ? "is-dim" : ""}`}
          onMouseEnter={() => setHovered(s.id)}
          onMouseLeave={() => setHovered(null)}
        />
      ))}
    </svg>
  );
}

// =====================================================
// Screen 3 — Study Plan / Roadmap
// =====================================================
function ScreenPlan({ study, navigate, route }) {
  const { PHASES, DOMAINS } = window.CCA_DATA;
  const [openPhase, setOpenPhase] = useStateA(route.phaseId || "p1");

  const totalHours = PHASES.reduce((a, p) => a + p.hours, 0);

  return (
    <div className="screen">
      <Section
        title="Study plan"
        desc="A 3–5 week track for experienced AI developers. Click any phase to expand its tasks."
      >
        {/* Horizontal roadmap */}
        <Card className="roadmap">
          <div className="roadmap-meta">
            <div>
              <div className="rm-label">Total timeline</div>
              <div className="rm-value">3–5 weeks · {totalHours}h hands-on</div>
            </div>
            <div>
              <div className="rm-label">Track</div>
              <div className="rm-value">Experienced AI developers</div>
            </div>
            <div>
              <div className="rm-label">Approach</div>
              <div className="rm-value">Project-led; courses support builds</div>
            </div>
          </div>
          <div className="rm-line">
            {PHASES.map((p, i) => {
              const done = p.tasks.filter((t) => study.state.tasks[t.id]).length;
              const total = p.tasks.length;
              const pct = Math.round((done / total) * 100);
              return (
                <React.Fragment key={p.id}>
                  <button
                    className={`rm-stop ${openPhase === p.id ? "is-open" : ""} ${pct === 100 ? "is-done" : ""}`}
                    onClick={() => setOpenPhase(p.id)}
                  >
                    <div className="rm-stop-dot">
                      {pct === 100 ? "✓" : p.num}
                    </div>
                    <div className="rm-stop-name">{p.name}</div>
                    <div className="rm-stop-week">{p.week} · {p.hours}h</div>
                    <div className="rm-stop-bar">
                      <ProgressBar value={pct} color={pct === 100 ? "ok" : "accent"} height={3} />
                    </div>
                  </button>
                  {i < PHASES.length - 1 ? <div className="rm-link" /> : null}
                </React.Fragment>
              );
            })}
          </div>
        </Card>

        {/* Phase details */}
        <div className="phase-stack">
          {PHASES.map((p) => {
            const isOpen = openPhase === p.id;
            const done = p.tasks.filter((t) => study.state.tasks[t.id]).length;
            return (
              <Card key={p.id} className={`phase-card ${isOpen ? "is-open" : ""}`}>
                <button className="phase-head" onClick={() => setOpenPhase(isOpen ? null : p.id)}>
                  <span className="phase-num">Phase {p.num}</span>
                  <span className="phase-name">{p.name}</span>
                  <span className="phase-week">{p.week}</span>
                  <span className="phase-goal">{p.goal}</span>
                  <Pill tone="neutral" dim>{done}/{p.tasks.length} tasks</Pill>
                  <Pill tone="neutral" dim>{p.hours}h</Pill>
                  <span className="exp-chev">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen ? (
                  <div className="phase-body">
                    <div className="phase-tasks">
                      {p.tasks.map((t) => {
                        const dom = t.domain ? DOMAINS.find((d) => d.id === t.domain) : null;
                        return (
                          <div key={t.id} className="task-row">
                            <Checkbox
                              checked={!!study.state.tasks[t.id]}
                              onChange={() => study.toggleTask(t.id)}
                              label={t.label}
                            />
                            <div className="task-meta">
                              <Pill tone={t.kind === "project" ? "accent" : "neutral"} dim={t.kind !== "project"}>
                                {t.kind}
                              </Pill>
                              {dom ? <DomainTag domain={dom} interactive onClick={() => navigate({ screen: "domain", domainId: dom.id })} /> : null}
                              <span className="task-hours">{t.hours}h</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

// =====================================================
// Screen 4 — Courses
// =====================================================
function ScreenCourses({ study, navigate }) {
  const { COURSES, DOMAINS } = window.CCA_DATA;
  const [filter, setFilter] = useStateA("all"); // all | partner | other
  const [openCourse, setOpenCourse] = useStateA(null);

  const filtered = COURSES.filter((c) =>
    filter === "all" ? true : filter === "partner" ? c.partnerRequired : !c.partnerRequired
  );

  const open = COURSES.find((c) => c.id === openCourse);

  return (
    <div className="screen">
      <Section
        title="Courses"
        desc="Free at anthropic.skilljar.com. The four Partner Network courses are the official pre-cert sequence."
        action={
          <div className="filter-row">
            <button className={`chip ${filter === "all" ? "is-active" : ""}`} onClick={() => setFilter("all")}>All</button>
            <button className={`chip ${filter === "partner" ? "is-active" : ""}`} onClick={() => setFilter("partner")}>Partner Network (required)</button>
            <button className={`chip ${filter === "other" ? "is-active" : ""}`} onClick={() => setFilter("other")}>Recommended</button>
          </div>
        }
      >
        <div className="course-grid">
          {filtered.map((c) => {
            const done = !!study.state.courses[c.id];
            return (
              <Card key={c.id} className={`course-card ${c.partnerRequired ? "is-required" : ""} ${done ? "is-done" : ""}`}>
                {c.partnerRequired ? <div className="card-flag">Partner Network · required</div> : null}
                <div className="course-top">
                  <h3 className="course-name">{c.name}</h3>
                  <button
                    className={`toggle-done ${done ? "is-done" : ""}`}
                    onClick={() => study.toggleCourse(c.id)}
                    title={done ? "Mark not done" : "Mark done"}
                  >
                    {done ? "✓ Done" : "Mark done"}
                  </button>
                </div>
                <p className="course-blurb">{c.blurb}</p>
                <div className="course-meta">
                  <Pill tone="neutral" dim>{c.hours}h</Pill>
                  <Pill tone="neutral" dim>{c.level}</Pill>
                </div>
                <div className="course-doms">
                  {c.domains.length === 0 ? (
                    <span className="muted-xs">No specific exam domain · general</span>
                  ) : (
                    c.domains.map((id) => {
                      const d = DOMAINS.find((x) => x.id === id);
                      return <DomainTag key={id} domain={d} interactive onClick={() => navigate({ screen: "domain", domainId: d.id })} />;
                    })
                  )}
                </div>
                <div className="course-actions">
                  <button className="ghost-btn-sm" onClick={() => setOpenCourse(c.id)}>Module list →</button>
                  <a className="ghost-btn-sm" href={c.url} target="_blank" rel="noopener noreferrer">Open on Skilljar ↗</a>
                </div>
              </Card>
            );
          })}
        </div>

        {open ? (
          <div className="modal-veil" onClick={() => setOpenCourse(null)}>
            <Card className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <div>
                  <div className="modal-eyebrow">{open.level} · {open.hours}h</div>
                  <h2 className="modal-title">{open.name}</h2>
                  <p className="modal-blurb">{open.blurb}</p>
                </div>
                <button className="x-btn" onClick={() => setOpenCourse(null)}>×</button>
              </div>
              <div className="modal-doms">
                {open.domains.map((id) => {
                  const d = DOMAINS.find((x) => x.id === id);
                  return <DomainTag key={id} domain={d} size="md" />;
                })}
                {open.partnerRequired ? <Pill tone="accent">Partner Network required</Pill> : null}
              </div>
              <div className="modal-modules">
                {open.modules.map((m, i) => (
                  <div key={i} className="module">
                    <div className="module-head">
                      <span className="module-i">{String(i + 1).padStart(2, "0")}</span>
                      <span className="module-name">{m.name}</span>
                    </div>
                    <ul className="module-lessons">
                      {m.lessons.map((l, j) => (
                        <li key={j}>{l}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="modal-foot">
                <a className="primary-btn" href={open.url} target="_blank" rel="noopener noreferrer">
                  Open course on Skilljar ↗
                </a>
                <button
                  className={`ghost-btn ${study.state.courses[open.id] ? "is-done" : ""}`}
                  onClick={() => study.toggleCourse(open.id)}
                >
                  {study.state.courses[open.id] ? "✓ Marked done" : "Mark done"}
                </button>
              </div>
            </Card>
          </div>
        ) : null}
      </Section>
    </div>
  );
}

Object.assign(window, {
  ScreenDashboard,
  ScreenBlueprint,
  ScreenPlan,
  ScreenCourses,
});
