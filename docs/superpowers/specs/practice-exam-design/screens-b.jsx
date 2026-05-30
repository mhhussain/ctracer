/* global React, Card, Section, Pill, ProgressBar, Checkbox, DomainTag, KBD */
const { useState: useStateB, useMemo: useMemoB } = React;

// =====================================================
// Screen 5 — Projects
// =====================================================
const STATUS_LABELS = {
  todo: { label: "Not started", tone: "neutral" },
  wip: { label: "In progress", tone: "accent" },
  done: { label: "Complete", tone: "ok" },
};

function ScreenProjects({ study, navigate }) {
  const { PROJECTS, DOMAINS } = window.CCA_DATA;
  const [open, setOpen] = useStateB(null);

  return (
    <div className="screen">
      <Section
        title="Projects to build"
        desc="Five recommended builds that cover every exam domain. Building > watching — spend the most time on Project 3."
      >
        <div className="proj-grid">
          {PROJECTS.map((p) => {
            const status = study.state.projects[p.id] || "todo";
            const sCfg = STATUS_LABELS[status];
            const isOpen = open === p.id;
            return (
              <Card key={p.id} className={`proj-card status-${status} ${isOpen ? "is-open" : ""}`}>
                <div className="proj-top">
                  <div className="proj-num">PROJECT 0{p.id.replace("pr", "")}</div>
                  <button
                    className={`status-pill tone-${sCfg.tone}`}
                    onClick={() => study.cycleProject(p.id)}
                    title="Click to cycle status"
                  >
                    <span className={`status-dot s-${status}`} />
                    {sCfg.label}
                  </button>
                </div>
                <h3 className="proj-name">{p.name}</h3>
                <p className="proj-summary">{p.summary}</p>
                <div className="proj-meta">
                  <Pill tone={p.complexity === "High" ? "warn" : "neutral"} dim={p.complexity !== "High"}>
                    {p.complexity} complexity
                  </Pill>
                  <Pill tone="neutral" dim>~{p.hours}h</Pill>
                </div>
                <div className="proj-doms">
                  {p.domains.map((id) => {
                    const d = DOMAINS.find((x) => x.id === id);
                    return <DomainTag key={id} domain={d} interactive onClick={() => navigate({ screen: "domain", domainId: d.id })} />;
                  })}
                </div>
                {p.flag ? <div className="proj-flag">⚑ {p.flag}</div> : null}
                <button className="ghost-btn-sm proj-expand" onClick={() => setOpen(isOpen ? null : p.id)}>
                  {isOpen ? "Hide build steps ↑" : "Show build steps ↓"}
                </button>
                {isOpen ? (
                  <div className="proj-body">
                    <div className="proj-section">
                      <div className="col-head">What it teaches</div>
                      <p className="proj-teach">{p.teaches}</p>
                    </div>
                    <div className="proj-section">
                      <div className="col-head">What to build</div>
                      <ol className="proj-build">
                        {p.build.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ol>
                    </div>
                    <div className="proj-actions">
                      <button className="primary-btn-sm" onClick={() => study.setProject(p.id, "wip")}>
                        Start
                      </button>
                      <button className="ghost-btn-sm" onClick={() => study.setProject(p.id, "done")}>
                        Mark complete
                      </button>
                      <button className="ghost-btn-sm" onClick={() => study.setProject(p.id, "todo")}>
                        Reset
                      </button>
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
// Screen 6 — Domain Deep Dive
// =====================================================
function ScreenDomain({ route, navigate }) {
  const { DOMAINS, COURSES, PROJECTS, PHASES } = window.CCA_DATA;
  const d = DOMAINS.find((x) => x.id === route.domainId) || DOMAINS[0];
  const idx = DOMAINS.indexOf(d);
  const prev = DOMAINS[(idx - 1 + DOMAINS.length) % DOMAINS.length];
  const next = DOMAINS[(idx + 1) % DOMAINS.length];

  const relCourses = COURSES.filter((c) => c.domains.includes(d.id));
  const relProjects = PROJECTS.filter((p) => p.domains.includes(d.id));
  const relPhase = PHASES.find((p) => p.num === d.phase);

  return (
    <div className="screen">
      <div className="dom-hero">
        <div className={`dom-hero-stripe dtag-${d.color}`} />
        <div className="dom-hero-l">
          <div className="dom-hero-eyebrow">
            <span className={`legend-sw dtag-${d.color}`} />
            <span>Domain {d.num} of 5</span>
            {d.difficulty === "Hardest" ? <Pill tone="warn">Hardest domain</Pill> : null}
          </div>
          <h2 className="dom-hero-title">{d.name}</h2>
          <p className="dom-hero-blurb">{d.blurb}</p>
        </div>
        <div className="dom-hero-r">
          <div className="dh-stat">
            <div className="dh-stat-v">{d.weight}<span className="dh-stat-u">%</span></div>
            <div className="dh-stat-l">of exam</div>
          </div>
          <div className="dh-stat">
            <div className="dh-stat-v">{d.questions}</div>
            <div className="dh-stat-l">questions</div>
          </div>
          <div className="dh-stat">
            <div className="dh-stat-v">P{d.phase}</div>
            <div className="dh-stat-l">study phase</div>
          </div>
        </div>
      </div>

      <div className="dom-grid">
        <Card className="dom-topics">
          <h3>Key topics</h3>
          <p className="muted-sm">Every bullet below is fair game on the exam. Scenario-based questions will combine these.</p>
          <ul className="topic-list">
            {d.topics.map((t) => (
              <li key={t.name}>
                <span className="topic-name">{t.name}</span>
                <span className="topic-desc"> — {t.desc}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="dom-build">
          <h3>What to build to learn this</h3>
          <ol className="build-list">
            {d.build.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ol>
        </Card>

        <Card className="dom-anti">
          <h3>Anti-patterns specific to this domain</h3>
          <ul className="anti-list">
            {d.antiPatterns.map((a, i) => (
              <li key={i}>
                <span className="anti-x">✕</span>{a}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="dom-links">
          <h3>Where to study this</h3>
          <div className="link-block">
            <div className="lb-head">Phase</div>
            {relPhase ? (
              <button className="lb-row" onClick={() => navigate({ screen: "plan", phaseId: relPhase.id })}>
                <span className="lb-row-l">Phase {relPhase.num} · {relPhase.name}</span>
                <span className="lb-row-r">{relPhase.week} →</span>
              </button>
            ) : null}
          </div>
          <div className="link-block">
            <div className="lb-head">Courses</div>
            {relCourses.map((c) => (
              <button key={c.id} className="lb-row" onClick={() => navigate({ screen: "courses" })}>
                <span className="lb-row-l">{c.name}</span>
                <span className="lb-row-r">{c.hours}h →</span>
              </button>
            ))}
          </div>
          <div className="link-block">
            <div className="lb-head">Projects</div>
            {relProjects.map((p) => (
              <button key={p.id} className="lb-row" onClick={() => navigate({ screen: "projects" })}>
                <span className="lb-row-l">{p.name}</span>
                <span className="lb-row-r">{p.complexity} →</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="dom-nav">
        <button className="dom-nav-btn" onClick={() => navigate({ screen: "domain", domainId: prev.id })}>
          <span className="dom-nav-arrow">←</span>
          <span className="dom-nav-l">
            <span className="dom-nav-eyebrow">D{prev.num}</span>
            <span className="dom-nav-name">{prev.short}</span>
          </span>
        </button>
        <button className="dom-nav-btn dom-nav-r" onClick={() => navigate({ screen: "domain", domainId: next.id })}>
          <span className="dom-nav-l dom-nav-r-text">
            <span className="dom-nav-eyebrow">D{next.num}</span>
            <span className="dom-nav-name">{next.short}</span>
          </span>
          <span className="dom-nav-arrow">→</span>
        </button>
      </div>
    </div>
  );
}

// =====================================================
// Screen 7 — Quick Reference
// =====================================================
function ScreenReference() {
  const { REFERENCE, DOMAINS } = window.CCA_DATA;
  return (
    <div className="screen ref-screen">
      <div className="ref-toolrow">
        <Pill tone="warn" dim>No docs allowed during exam</Pill>
        <Pill tone="neutral" dim>Print to PDF · ⌘P</Pill>
      </div>

      <div className="ref-grid">
        <Card className="ref-card ref-api">
          <div className="ref-card-head">
            <span className="ref-num">01</span>
            <h3>API essentials</h3>
          </div>
          <dl className="ref-dl">
            {REFERENCE.api.map((row) => (
              <div className="ref-dl-row" key={row.k}>
                <dt><code>{row.k}</code></dt>
                <dd>{row.v}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card className="ref-card ref-models">
          <div className="ref-card-head">
            <span className="ref-num">02</span>
            <h3>Model comparison</h3>
          </div>
          <table className="ref-tab">
            <thead>
              <tr>
                <th>Model</th>
                <th>Cost</th>
                <th>Speed</th>
                <th>Use case</th>
                <th>Ctx</th>
              </tr>
            </thead>
            <tbody>
              {REFERENCE.models.map((m) => (
                <tr key={m.name}>
                  <td><strong>{m.name}</strong></td>
                  <td>{m.cost}</td>
                  <td>{m.speed}</td>
                  <td className="ref-use">{m.use}</td>
                  <td><code>{m.ctx}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="ref-card ref-mcp">
          <div className="ref-card-head">
            <span className="ref-num">03</span>
            <h3>MCP primitives</h3>
          </div>
          <div className="mcp-row">
            {REFERENCE.mcp.map((m) => (
              <div key={m.name} className="mcp-cell">
                <div className="mcp-title">{m.name}</div>
                <div className="mcp-ctrl">{m.controller}</div>
                <div className="mcp-use">{m.use}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="ref-card ref-cc">
          <div className="ref-card-head">
            <span className="ref-num">04</span>
            <h3>Claude Code hierarchy</h3>
          </div>
          <div className="cc-grid">
            <div>
              <div className="col-head">CLAUDE.md levels</div>
              <ul className="cc-list">
                {REFERENCE.claudeCode.claudeMd.map((c) => (
                  <li key={c.level}>
                    <div className="cc-l1"><strong>{c.level}</strong> <code>{c.path}</code></div>
                    <div className="cc-l2">{c.desc}</div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="col-head">Settings files</div>
              <ul className="cc-list">
                {REFERENCE.claudeCode.settings.map((s) => (
                  <li key={s.k}>
                    <div className="cc-l1"><code>{s.k}</code></div>
                    <div className="cc-l2">{s.v}</div>
                  </li>
                ))}
              </ul>
              <div className="col-head mt-12">Hook types</div>
              <div className="kbd-row">
                {REFERENCE.claudeCode.hooks.map((h) => (
                  <KBD key={h}>{h}</KBD>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="ref-card ref-patt">
          <div className="ref-card-head">
            <span className="ref-num">05</span>
            <h3>Agentic patterns</h3>
          </div>
          <div className="patt-grid">
            {REFERENCE.patterns.map((p) => (
              <div className="patt-cell" key={p.name}>
                <div className="patt-title">{p.name}</div>
                <div className="patt-desc">{p.desc}</div>
                <PatternIcon name={p.name} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="ref-card ref-anti">
          <div className="ref-card-head">
            <span className="ref-num">06</span>
            <h3>Trap-question anti-patterns</h3>
          </div>
          <ul className="anti-list anti-list-compact">
            {window.CCA_DATA.ANTI_PATTERNS_ALL.map((a, i) => (
              <li key={i}>
                <span className="anti-x">✕</span>{a}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function PatternIcon({ name }) {
  // tiny schematic SVGs
  const c = "var(--accent)";
  const m = "var(--muted-2)";
  const common = { fill: "none", strokeWidth: 1.4, strokeLinecap: "round" };
  if (name === "Parallelization") {
    return (
      <svg viewBox="0 0 80 36" className="patt-svg">
        <circle cx="10" cy="18" r="3" fill={c} />
        <circle cx="70" cy="6" r="3" fill={m} />
        <circle cx="70" cy="18" r="3" fill={m} />
        <circle cx="70" cy="30" r="3" fill={m} />
        <path d="M13 18 L67 6 M13 18 L67 18 M13 18 L67 30" stroke={c} {...common} />
      </svg>
    );
  }
  if (name === "Chaining") {
    return (
      <svg viewBox="0 0 80 36" className="patt-svg">
        {[10, 30, 50, 70].map((x, i) => (
          <circle key={i} cx={x} cy="18" r="3" fill={i === 0 ? c : m} />
        ))}
        <path d="M13 18 H27 M33 18 H47 M53 18 H67" stroke={c} {...common} />
      </svg>
    );
  }
  if (name === "Routing") {
    return (
      <svg viewBox="0 0 80 36" className="patt-svg">
        <circle cx="10" cy="18" r="3" fill={c} />
        <rect x="30" y="14" width="14" height="8" fill="none" stroke={c} strokeWidth="1.4" />
        <circle cx="68" cy="8" r="3" fill={m} />
        <circle cx="68" cy="18" r="3" fill={m} />
        <circle cx="68" cy="28" r="3" fill={m} />
        <path d="M13 18 H30 M44 18 L65 8 M44 18 L65 18 M44 18 L65 28" stroke={c} {...common} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 80 36" className="patt-svg">
      <circle cx="40" cy="18" r="4" fill={c} />
      <circle cx="10" cy="6" r="3" fill={m} />
      <circle cx="10" cy="30" r="3" fill={m} />
      <circle cx="70" cy="6" r="3" fill={m} />
      <circle cx="70" cy="30" r="3" fill={m} />
      <path d="M37 16 L13 6 M37 20 L13 30 M43 16 L67 6 M43 20 L67 30" stroke={c} {...common} />
    </svg>
  );
}

// =====================================================
// Screen 8 — Exam Day Checklist
// =====================================================
function ScreenExamDay({ study, navigate }) {
  const { EXAM_DAY_CHECKLIST, CERT, COURSES, PROJECTS } = window.CCA_DATA;

  // Auto-derived signals
  const partnerDone =
    COURSES.filter((c) => c.partnerRequired).every((c) => study.state.courses[c.id]);
  const allProjectsDone =
    PROJECTS.every((p) => study.state.projects[p.id] === "done");

  const autoVals = {
    x1: partnerDone,
    x2: allProjectsDone,
  };

  const total = EXAM_DAY_CHECKLIST.length;
  const done = EXAM_DAY_CHECKLIST.filter((c) =>
    autoVals[c.id] !== undefined ? autoVals[c.id] : !!study.state.checklist[c.id]
  ).length;

  const ready = done === total;

  return (
    <div className="screen">
      <Section title="Exam day" desc="One last gut-check before you sit the exam.">
        <Card className={`exam-hero ${ready ? "is-ready" : ""}`}>
          <div className="exam-hero-l">
            <div className="exam-hero-eyebrow">Exam logistics</div>
            <div className="exam-meta">
              <div className="exam-meta-cell">
                <div className="emc-l">Duration</div>
                <div className="emc-v">{CERT.duration}</div>
              </div>
              <div className="exam-meta-cell">
                <div className="emc-l">Questions</div>
                <div className="emc-v">{CERT.totalQuestions}</div>
              </div>
              <div className="exam-meta-cell">
                <div className="emc-l">Passing</div>
                <div className="emc-v">{CERT.passing}</div>
              </div>
              <div className="exam-meta-cell">
                <div className="emc-l">Reference</div>
                <div className="emc-v">None allowed</div>
              </div>
            </div>
          </div>
          <div className="exam-hero-r">
            <div className="exam-ready">
              <div className="exam-ready-pct">{Math.round((done / total) * 100)}%</div>
              <div className="exam-ready-l">{done} / {total} ready</div>
            </div>
          </div>
        </Card>

        <div className="exam-cols">
          <Card className="exam-list">
            <h3>Pre-exam readiness</h3>
            <div className="exam-list-body">
              {EXAM_DAY_CHECKLIST.map((c) => {
                const auto = autoVals[c.id];
                const checked = auto !== undefined ? auto : !!study.state.checklist[c.id];
                return (
                  <div key={c.id} className={`exam-row ${c.critical ? "is-critical" : ""}`}>
                    <Checkbox
                      checked={checked}
                      onChange={() => {
                        if (auto !== undefined) return; // auto-derived; can't toggle
                        study.toggleCheck(c.id);
                      }}
                      label={c.label}
                      sub={auto !== undefined ? "auto-tracked from your progress" : null}
                    />
                    <div className="exam-row-r">
                      {c.critical ? <Pill tone="warn" dim>Required</Pill> : <Pill tone="neutral" dim>Recommended</Pill>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="exam-expect">
            <h3>What to expect</h3>
            <ul className="expect-list">
              <li><strong>Scenario-based questions.</strong> Most ask "given this architecture, what breaks?" — not "what is X?"</li>
              <li><strong>Agentic is the hardest.</strong> Expect tricky questions on fallback design and agent failure modes.</li>
              <li><strong>MCP focus:</strong> when to use tools vs resources vs prompts.</li>
              <li><strong>Anti-pattern traps.</strong> Prompt-engineering questions test what NOT to do as much as best practice.</li>
              <li><strong>No docs.</strong> Know the Messages API, tool-use flow, and <code>cache_control</code> syntax cold.</li>
              <li><strong>Achievable high scores.</strong> One community report: 985 / 1000.</li>
            </ul>
            <div className="expect-foot">
              <a className="primary-btn" href={CERT.registerUrl} target="_blank" rel="noopener noreferrer">
                Register at Skilljar ↗
              </a>
              <button className="ghost-btn" onClick={() => navigate({ screen: "reference" })}>
                Open quick reference →
              </button>
            </div>
          </Card>
        </div>
      </Section>
    </div>
  );
}

Object.assign(window, {
  ScreenProjects,
  ScreenDomain,
  ScreenReference,
  ScreenExamDay,
});
