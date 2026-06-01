// functions/examBank.js
// Loads the question bank from Firestore and builds/scores sessions on the
// bank shape (stem[], options[].practice/.timed, correctIndex).
// Replaces the in-code placeholder bank in practiceBank.js.
import { getFirestore } from 'firebase-admin/firestore'

export const BLUEPRINT = { d1: 16, d2: 12, d3: 12, d4: 11, d5: 9 }
export const PASS_PCT = 72

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const pickPhrase = (arr, i) => arr[i % arr.length]

let _cache = null
// Reads all questions once per warm instance. Pass {force:true} to refresh.
export async function loadBank({ force = false } = {}) {
  if (_cache && !force) return _cache
  const snap = await getFirestore().collection('exam_questions').get()
  _cache = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return _cache
}

// TIMED: server-only `instances` (key + explanation) + client-safe `sanitized`.
export function buildTimedSession(bank) {
  const order = shuffle(bank)
  const instances = order.map((q) => ({
    qid: q.id,
    domain: q.domain,
    stemIdx: Math.floor(Math.random() * q.stem.length),
    optOrder: shuffle(q.options.map((_, i) => i)),
    phraseIdx: q.options.map((o) => Math.floor(Math.random() * o.timed.length)),
    correctOrigIdx: q.correctIndex,
    explanation: q.explanation, // server-only (stored in exam_sessions)
  }))
  const sanitized = instances.map((inst) => {
    const q = bank.find((b) => b.id === inst.qid)
    return {
      qid: inst.qid,
      domain: inst.domain,
      stem: q.stem[inst.stemIdx],
      opts: inst.optOrder.map((origIdx) => ({
        text: pickPhrase(q.options[origIdx].timed, inst.phraseIdx[origIdx]),
        // NO `correct` — answer key stays server-side
      })),
    }
  })
  return { instances, sanitized }
}

// Score a timed session from its stored instances (no bank re-read needed).
export function scoreSession(instances, answers) {
  let correct = 0
  const perDomain = {
    d1: { correct: 0, total: 0 }, d2: { correct: 0, total: 0 }, d3: { correct: 0, total: 0 },
    d4: { correct: 0, total: 0 }, d5: { correct: 0, total: 0 },
  }
  const review = instances.map((inst, idx) => {
    perDomain[inst.domain].total++
    const sel = answers[idx]
    const correctDisplayPos = inst.optOrder.indexOf(inst.correctOrigIdx)
    const isCorrect = sel !== undefined && Number(sel) === correctDisplayPos
    if (isCorrect) { correct++; perDomain[inst.domain].correct++ }
    return {
      idx, qid: inst.qid, domain: inst.domain, correctDisplayPos,
      selectedPos: sel !== undefined ? Number(sel) : null, isCorrect, explanation: inst.explanation,
    }
  })
  const total = instances.length
  const pct = Math.round((correct / total) * 100)
  return { score: { correct, total, pct, pass: pct >= PASS_PCT, perDomain }, review }
}

// PRACTICE: full questions WITH key + explanation (practice answers are public).
export function buildPracticeQuestions(bank) {
  return shuffle(bank).map((q) => {
    const stemIdx = Math.floor(Math.random() * q.stem.length)
    const optOrder = shuffle(q.options.map((_, i) => i))
    return {
      qid: q.id,
      domain: q.domain,
      stem: q.stem[stemIdx],
      opts: optOrder.map((origIdx) => ({
        text: pickPhrase(q.options[origIdx].practice, Math.floor(Math.random() * q.options[origIdx].practice.length)),
        correct: origIdx === q.correctIndex,
      })),
      explanation: q.explanation,
    }
  })
}
