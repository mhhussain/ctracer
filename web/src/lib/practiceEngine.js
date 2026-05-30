// web/src/lib/practiceEngine.js
// Pure attempt logic for the Practice Exam.
// Ported from docs/superpowers/specs/practice-exam-design/practice-data.js.
import { BANK, questionById, DURATION_MIN } from '../data/practiceQuestions'
import { DOMAINS } from '../data/index'

const PASS_PCT = 72

export function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Create an attempt: pick the full domain-weighted set (the bank IS the
// weighted 60), freeze a random phrasing + option order per question so
// re-renders stay stable.
export function createAttempt(mode) {
  const order = shuffle(BANK)
  const instances = order.map((q) => {
    const optOrder = shuffle(q.options.map((_, i) => i))
    return {
      qid: q.id,
      domain: q.domain,
      stemIdx: Math.floor(Math.random() * q.stem.length),
      optOrder, // display position -> original option index
      phraseIdx: q.options.map((o) => Math.floor(Math.random() * o.text.length)),
    }
  })
  return {
    id: `a${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    mode, // "timed" | "practice"
    createdAt: Date.now(),
    durationMs: mode === 'timed' ? DURATION_MIN * 60 * 1000 : null,
    instances,
    answers: {}, // instanceIndex -> displayPosition selected
    flags: {}, // instanceIndex -> bool
    submitted: false,
  }
}

// Resolve a display instance to renderable text.
export function renderInstance(inst) {
  const q = questionById(inst.qid)
  const opts = inst.optOrder.map((origIdx) => {
    const o = q.options[origIdx]
    return {
      origIdx,
      correct: o.correct,
      text: o.text[inst.phraseIdx[origIdx] % o.text.length],
    }
  })
  return { q, stem: q.stem[inst.stemIdx], opts, explanation: q.explanation }
}

export function scoreAttempt(attempt) {
  let correct = 0
  const perDomain = {}
  DOMAINS.forEach((d) => (perDomain[d.id] = { correct: 0, total: 0 }))
  attempt.instances.forEach((inst, idx) => {
    perDomain[inst.domain].total++
    const sel = attempt.answers[idx]
    if (sel === undefined) return
    const origIdx = inst.optOrder[sel]
    const q = questionById(inst.qid)
    if (q.options[origIdx].correct) {
      correct++
      perDomain[inst.domain].correct++
    }
  })
  const total = attempt.instances.length
  const pct = Math.round((correct / total) * 100)
  return { correct, total, pct, pass: pct >= PASS_PCT, perDomain }
}
