import { REFERENCE, ANTI_PATTERNS_ALL } from "../data/index.js";
import Card from '../components/Card';

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
    <div className="screen ref-screen">
      <div className="ref-toolrow">
        <span className="pill pill-warn">No docs allowed during exam</span>
        <span className="pill pill-dim">Print to PDF · ⌘P</span>
      </div>

      <div className="ref-grid">
        {/* Card 01 — API essentials */}
        <Card className="ref-card ref-api">
          <div className="ref-card-head">
            <span className="ref-num">01</span>
            <h3>API essentials</h3>
          </div>
          <dl className="ref-dl">
            {REFERENCE.api.map(({ k, v }) => (
              <div key={k} className="ref-dl-row">
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </Card>

        {/* Card 02 — Model comparison */}
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
                <th>Best for</th>
                <th>Context</th>
              </tr>
            </thead>
            <tbody>
              {REFERENCE.models.map(({ name, cost, speed, use, ctx }) => (
                <tr key={name}>
                  <td><strong>{name}</strong></td>
                  <td>{cost}</td>
                  <td>{speed}</td>
                  <td className="ref-use">{use}</td>
                  <td><code>{ctx}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Card 03 — MCP primitives */}
        <Card className="ref-card ref-mcp">
          <div className="ref-card-head">
            <span className="ref-num">03</span>
            <h3>MCP primitives</h3>
          </div>
          <div className="mcp-row">
            {REFERENCE.mcp.map(({ name, controller, use }) => (
              <div key={name} className="mcp-cell">
                <div className="mcp-title">{name}</div>
                <div className="mcp-ctrl">{controller}</div>
                <div className="mcp-use">{use}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Card 04 — Claude Code hierarchy */}
        <Card className="ref-card ref-cc">
          <div className="ref-card-head">
            <span className="ref-num">04</span>
            <h3>Claude Code hierarchy</h3>
          </div>
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
        </Card>

        {/* Card 05 — Agentic patterns */}
        <Card className="ref-card ref-patt">
          <div className="ref-card-head">
            <span className="ref-num">05</span>
            <h3>Agentic patterns</h3>
          </div>
          <div className="patt-grid">
            {REFERENCE.patterns.map(({ name, desc }) => (
              <div key={name} className="patt-cell">
                <div className="patt-title">{name}</div>
                <div className="patt-desc">{desc}</div>
                <PatternIcon name={name} />
              </div>
            ))}
          </div>
        </Card>

        {/* Card 06 — Anti-patterns */}
        <Card className="ref-card ref-anti">
          <div className="ref-card-head">
            <span className="ref-num">06</span>
            <h3>Anti-patterns</h3>
          </div>
          <ul className="anti-list anti-list-compact">
            {ANTI_PATTERNS_ALL.map((ap) => (
              <li key={ap}><span className="ref-x">✕</span>{ap}</li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
