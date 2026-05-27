import { REFERENCE, ANTI_PATTERNS_ALL } from "../data/index.js";

function PatternIcon({ name }) {
  if (name === "Parallelization") {
    return (
      <svg viewBox="0 0 80 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="10" cy="18" r="5" fill="currentColor" opacity="0.7" />
        <circle cx="70" cy="8" r="5" fill="currentColor" opacity="0.7" />
        <circle cx="70" cy="18" r="5" fill="currentColor" opacity="0.7" />
        <circle cx="70" cy="28" r="5" fill="currentColor" opacity="0.7" />
        <line x1="15" y1="18" x2="65" y2="8" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        <line x1="15" y1="18" x2="65" y2="18" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        <line x1="15" y1="18" x2="65" y2="28" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      </svg>
    );
  }
  if (name === "Chaining") {
    return (
      <svg viewBox="0 0 80 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="2" y="12" width="18" height="12" rx="2" fill="currentColor" opacity="0.7" />
        <rect x="31" y="12" width="18" height="12" rx="2" fill="currentColor" opacity="0.7" />
        <rect x="60" y="12" width="18" height="12" rx="2" fill="currentColor" opacity="0.7" />
        <line x1="20" y1="18" x2="31" y2="18" stroke="currentColor" strokeWidth="1.5" opacity="0.5" markerEnd="url(#arrow1)" />
        <line x1="49" y1="18" x2="60" y2="18" stroke="currentColor" strokeWidth="1.5" opacity="0.5" markerEnd="url(#arrow2)" />
        <defs>
          <marker id="arrow1" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="currentColor" opacity="0.7" />
          </marker>
          <marker id="arrow2" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="currentColor" opacity="0.7" />
          </marker>
        </defs>
      </svg>
    );
  }
  if (name === "Routing") {
    return (
      <svg viewBox="0 0 80 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="2" y="12" width="18" height="12" rx="2" fill="currentColor" opacity="0.7" />
        <circle cx="65" cy="8" r="5" fill="currentColor" opacity="0.7" />
        <circle cx="65" cy="18" r="5" fill="currentColor" opacity="0.7" />
        <circle cx="65" cy="28" r="5" fill="currentColor" opacity="0.7" />
        <line x1="20" y1="18" x2="60" y2="8" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        <line x1="20" y1="18" x2="60" y2="18" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        <line x1="20" y1="18" x2="60" y2="28" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      </svg>
    );
  }
  if (name === "Orchestrator / Subagent") {
    return (
      <svg viewBox="0 0 80 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="27" y="2" width="26" height="12" rx="2" fill="currentColor" opacity="0.7" />
        <rect x="8" y="22" width="26" height="12" rx="2" fill="currentColor" opacity="0.7" />
        <rect x="46" y="22" width="26" height="12" rx="2" fill="currentColor" opacity="0.7" />
        <line x1="40" y1="14" x2="21" y2="22" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        <line x1="40" y1="14" x2="59" y2="22" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      </svg>
    );
  }
  return null;
}

export default function KeyConcepts() {
  return (
    <div className="ref-screen">
      <div className="ref-banner">
        <span className="pill pill-warn">No docs allowed during exam</span>
        <span className="pill pill-neutral">Print to PDF · ⌘P</span>
      </div>

      <div className="ref-grid">
        {/* Card 01 — API essentials */}
        <div className="ref-card ref-api">
          <div className="ref-eyebrow">01</div>
          <h3 className="ref-heading">API essentials</h3>
          <dl className="ref-dl">
            {REFERENCE.api.map(({ k, v }) => (
              <div key={k} className="ref-dl-row">
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Card 02 — Model comparison */}
        <div className="ref-card ref-models">
          <div className="ref-eyebrow">02</div>
          <h3 className="ref-heading">Model comparison</h3>
          <table className="ref-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Cost</th>
                <th>Speed</th>
                <th>Best for</th>
                <th>Context</th>
              </tr>
            </thead>
            <tbody>
              {REFERENCE.models.map(({ name, cost, speed, use, ctx }) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{cost}</td>
                  <td>{speed}</td>
                  <td>{use}</td>
                  <td>{ctx}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Card 03 — MCP primitives */}
        <div className="ref-card ref-mcp">
          <div className="ref-eyebrow">03</div>
          <h3 className="ref-heading">MCP primitives</h3>
          <div className="ref-mcp-grid">
            {REFERENCE.mcp.map(({ name, controller, use }) => (
              <div key={name} className="ref-mcp-cell">
                <div className="ref-mcp-name">{name}</div>
                <div className="ref-mcp-controller">{controller}</div>
                <div className="ref-mcp-use">{use}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 04 — Claude Code hierarchy */}
        <div className="ref-card ref-cc">
          <div className="ref-eyebrow">04</div>
          <h3 className="ref-heading">Claude Code hierarchy</h3>
          <div className="ref-cc-cols">
            <div className="ref-cc-col">
              <div className="ref-cc-section-title">CLAUDE.md levels</div>
              {REFERENCE.claudeCode.claudeMd.map(({ level, path, desc }) => (
                <div key={level} className="ref-cc-row">
                  <span className="ref-cc-level">{level}</span>
                  <span className="ref-cc-path">{path}</span>
                  <span className="ref-cc-desc">{desc}</span>
                </div>
              ))}
            </div>
            <div className="ref-cc-col">
              <div className="ref-cc-section-title">Settings files</div>
              {REFERENCE.claudeCode.settings.map(({ k, v }) => (
                <div key={k} className="ref-cc-row">
                  <span className="ref-cc-level">{k}</span>
                  <span className="ref-cc-desc">{v}</span>
                </div>
              ))}
              <div className="ref-cc-section-title ref-cc-section-title--spaced">Hook types</div>
              <div className="ref-cc-hooks">
                {REFERENCE.claudeCode.hooks.map((hookName) => (
                  <kbd key={hookName} className="kbd">{hookName}</kbd>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Card 05 — Agentic patterns */}
        <div className="ref-card ref-patt">
          <div className="ref-eyebrow">05</div>
          <h3 className="ref-heading">Agentic patterns</h3>
          <div className="ref-patt-grid">
            {REFERENCE.patterns.map(({ name, desc }) => (
              <div key={name} className="ref-patt-cell">
                <div className="ref-patt-icon">
                  <PatternIcon name={name} />
                </div>
                <div className="ref-patt-name">{name}</div>
                <div className="ref-patt-desc">{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 06 — Anti-patterns */}
        <div className="ref-card ref-anti">
          <div className="ref-eyebrow">06</div>
          <h3 className="ref-heading">Anti-patterns</h3>
          <ul className="ref-anti-list">
            {ANTI_PATTERNS_ALL.map((ap) => (
              <li key={ap}><span className="ref-x">✕</span>{ap}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
