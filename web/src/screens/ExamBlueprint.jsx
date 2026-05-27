import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DOMAINS } from '../data/index'
import Card from '../components/Card'

function arc(startDeg, endDeg, outerR = 88, innerR = 56, cx = 110, cy = 110) {
  const toRad = (deg) => (deg * Math.PI) / 180
  const x1 = cx + outerR * Math.cos(toRad(startDeg))
  const y1 = cy + outerR * Math.sin(toRad(startDeg))
  const x2 = cx + outerR * Math.cos(toRad(endDeg))
  const y2 = cy + outerR * Math.sin(toRad(endDeg))
  const x3 = cx + innerR * Math.cos(toRad(endDeg))
  const y3 = cy + innerR * Math.sin(toRad(endDeg))
  const x4 = cx + innerR * Math.cos(toRad(startDeg))
  const y4 = cy + innerR * Math.sin(toRad(startDeg))
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${large} 0 ${x4} ${y4} Z`
}

const totalWeight = DOMAINS.reduce((s, d) => s + d.weight, 0)
let acc = -90
const slices = DOMAINS.map((d) => {
  const start = acc
  const end = acc + (d.weight / totalWeight) * 360
  acc = end
  return { ...d, startAngle: start, endAngle: end }
})

export default function ExamBlueprint() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(null)
  const [expanded, setExpanded] = useState('d1')

  return (
    <div className="screen-container">
      <section className="sec">
        <header className="sec-head">
          <div>
            <h2 className="sec-title">Blueprint</h2>
            <p className="sec-desc">60 questions · 90 minutes · pass at 70%</p>
          </div>
        </header>

      <div className="bp-grid">
        {/* Left — Donut card */}
        <Card className="bp-donut">
          <svg viewBox="0 0 220 220">
            {slices.map((s) => (
              <path
                key={s.id}
                d={arc(s.startAngle, s.endAngle)}
                className={`donut-slice dtag-${s.color}${hovered === s.id ? ' is-hov' : hovered ? ' is-dim' : ''}`}
                onMouseEnter={() => setHovered(s.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setExpanded(s.id)}
              />
            ))}
            <text x="110" y="106" className="donut-c-1">60</text>
            <text x="110" y="122" className="donut-c-2">questions</text>
          </svg>

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

        {/* Right — Weight & difficulty card */}
        <Card className="bp-bars">
          <h3>Weight & difficulty</h3>
          <p>Domain 1 is the largest and the hardest — allocate time accordingly.</p>
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

      {/* Expandable domain cards */}
      <div className="bp-expand">
        {DOMAINS.map((d) => {
          const isOpen = expanded === d.id
          return (
            <div key={d.id} className="exp-card">
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
                        {d.topics.map(t => (
                          <li key={t.name}><strong>{t.name}</strong> — {t.desc}</li>
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
                      <button className="link-btn" onClick={() => navigate(`/domain/${d.id}`)}>
                        Open domain deep dive →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      </section>
    </div>
  )
}
