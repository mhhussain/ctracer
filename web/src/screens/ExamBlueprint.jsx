import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DOMAINS } from '../data/index'
import Card from '../components/Card'

// Arc math for donut slices. Angles in degrees, -90 offset so first slice starts at top.
function arc(startDeg, endDeg) {
  const cx = 110, cy = 110, R = 88, r = 56
  const a1 = ((startDeg - 90) * Math.PI) / 180
  const a2 = ((endDeg - 90) * Math.PI) / 180
  const large = endDeg - startDeg > 180 ? 1 : 0
  const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1)
  const x2 = cx + R * Math.cos(a2), y2 = cy + R * Math.sin(a2)
  const x3 = cx + r * Math.cos(a2), y3 = cy + r * Math.sin(a2)
  const x4 = cx + r * Math.cos(a1), y4 = cy + r * Math.sin(a1)
  return `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${r} ${r} 0 ${large} 0 ${x4} ${y4} Z`
}

const totalWeight = DOMAINS.reduce((s, d) => s + d.weight, 0)
let acc = 0
const slices = DOMAINS.map((d) => {
  const start = acc
  const end = acc + d.weight
  acc = end
  return { ...d, startDeg: (start / totalWeight) * 360, endDeg: (end / totalWeight) * 360 }
})

export default function ExamBlueprint() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(null)
  const [expanded, setExpanded] = useState('d1')

  return (
    <div className="screen-container">
      <section className="sec">
        <div className="bp-grid">
          {/* Donut + legend */}
          <Card className="bp-donut">
            <div className="donut-wrap">
              <svg viewBox="0 0 220 220" width={220} height={220}>
                {slices.map((s) => (
                  <path
                    key={s.id}
                    d={arc(s.startDeg, s.endDeg)}
                    className={`donut-slice dtag-${s.color}${hovered === s.id ? ' is-hov' : hovered ? ' is-dim' : ''}`}
                    onMouseEnter={() => setHovered(s.id)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => setExpanded(s.id)}
                  />
                ))}
              </svg>
              <div className="donut-center">
                <div className="donut-c-1">60</div>
                <div className="donut-c-2">questions</div>
              </div>
            </div>
            <div className="donut-legend">
              {DOMAINS.map((d) => (
                <button
                  key={d.id}
                  className={`legend-row${hovered === d.id ? ' is-hov' : ''}`}
                  onClick={() => setExpanded(d.id)}
                  onMouseEnter={() => setHovered(d.id)}
                  onMouseLeave={() => setHovered(null)}
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

          {/* Weight & difficulty bars */}
          <Card className="bp-bars">
            <h3>Weight & difficulty</h3>
            <p className="muted-sm">Domain 1 is the largest and the hardest — allocate time accordingly.</p>
            <div className="bars">
              {DOMAINS.map((d) => (
                <div
                  key={d.id}
                  className="bar-row"
                  onMouseEnter={() => setHovered(d.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div className="bar-row-head">
                    <span
                      className={`dtag dtag-${d.color}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/domain/${d.id}`)}
                    >
                      D{d.num}
                    </span>
                    <span className={`pill ${d.difficulty === 'Hardest' ? 'pill-warn' : 'pill-dim'}`}>
                      {d.difficulty}
                    </span>
                  </div>
                  <div className="bar-track">
                    <div
                      className={`bar-fill dtag-${d.color}`}
                      style={{ width: `${(d.weight / 27) * 100}%` }}
                    />
                    <span className="bar-lab">{d.weight}% · {d.questions} questions</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Expandable domain cards — Card wrapper gives border + background */}
        <div className="bp-expand">
          {DOMAINS.map((d) => {
            const isOpen = expanded === d.id
            return (
              <Card key={d.id} className={`exp-card${isOpen ? ' is-open' : ''}`}>
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
                {isOpen && (
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
                          {d.antiPatterns.map((ap, i) => (
                            <li key={i}><span className="anti-x">✕</span>{ap}</li>
                          ))}
                        </ul>
                        <button
                          className="link-btn"
                          style={{ marginTop: 12, display: 'block' }}
                          onClick={() => navigate(`/domain/${d.id}`)}
                        >
                          Open domain deep dive →
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}
