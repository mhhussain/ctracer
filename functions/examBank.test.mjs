import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildTimedSession, scoreSession, buildPracticeQuestions } from './examBank.js'

// Minimal fixture bank in the new shape (2 questions, distinct domains).
const BANK = [
  { id: 'd1-001', domain: 'd1', stem: ['S1a', 'S1b'], correctIndex: 0,
    options: [
      { practice: ['p-correct'], timed: ['t-correct'] },
      { practice: ['p-wrong1'], timed: ['t-wrong1'] },
      { practice: ['p-wrong2'], timed: ['t-wrong2'] },
      { practice: ['p-wrong3'], timed: ['t-wrong3'] },
    ], explanation: 'because-1' },
  { id: 'd2-001', domain: 'd2', stem: ['S2a', 'S2b'], correctIndex: 2,
    options: [
      { practice: ['p-w'], timed: ['t-w'] },
      { practice: ['p-x'], timed: ['t-x'] },
      { practice: ['p-correct2'], timed: ['t-correct2'] },
      { practice: ['p-z'], timed: ['t-z'] },
    ], explanation: 'because-2' },
]

test('buildTimedSession sanitized leaks no answer key and uses timed wordings', () => {
  const { instances, sanitized } = buildTimedSession(BANK)
  assert.equal(sanitized.length, 2)
  for (const q of sanitized) {
    assert.equal(q.opts.length, 4)
    for (const o of q.opts) {
      assert.equal('correct' in o, false)          // no key
      assert.match(o.text, /^t-/)                   // timed wordings only
    }
  }
  // instances retain the key + explanation server-side
  for (const inst of instances) {
    assert.equal(typeof inst.correctOrigIdx, 'number')
    assert.equal(typeof inst.explanation, 'string')
  }
})

test('scoreSession scores against the stored key and returns explanations', () => {
  const { instances } = buildTimedSession(BANK)
  // answer every question with its correct display position
  const answers = {}
  instances.forEach((inst, i) => { answers[i] = inst.optOrder.indexOf(inst.correctOrigIdx) })
  const { score, review } = scoreSession(instances, answers)
  assert.equal(score.correct, 2)
  assert.equal(score.total, 2)
  assert.equal(score.pct, 100)
  assert.equal(review[0].isCorrect, true)
  assert.equal(typeof review[0].explanation, 'string')
})

test('buildPracticeQuestions exposes exactly one correct option + explanation', () => {
  const qs = buildPracticeQuestions(BANK)
  assert.equal(qs.length, 2)
  for (const q of qs) {
    assert.equal(q.opts.length, 4)
    assert.equal(q.opts.filter((o) => o.correct).length, 1)  // exactly one correct
    assert.match(q.opts[0].text, /^p-/)                       // practice wordings
    assert.equal(typeof q.explanation, 'string')
  }
})
