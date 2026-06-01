// web/src/lib/practiceEngine.js
// Pure scoring for the Practice Exam. Questions are server-resolved (each option
// carries a `correct` flag), so scoring reads the instances directly — no local bank.
import { DOMAINS } from '../data/index'

export const PASS_PCT = 72
export const DURATION_MIN = 120

export function scoreAttempt(attempt) {
  let correct = 0
  const perDomain = {}
  DOMAINS.forEach((d) => (perDomain[d.id] = { correct: 0, total: 0 }))
  attempt.instances.forEach((inst, idx) => {
    perDomain[inst.domain].total++
    const sel = attempt.answers[idx]
    if (sel === undefined) return
    if (inst.opts[sel]?.correct) {
      correct++
      perDomain[inst.domain].correct++
    }
  })
  const total = attempt.instances.length
  const pct = Math.round((correct / total) * 100)
  return { correct, total, pct, pass: pct >= PASS_PCT, perDomain }
}
