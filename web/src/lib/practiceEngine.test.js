// web/src/lib/practiceEngine.test.js
import { describe, it, expect } from 'vitest'
import { createAttempt, renderInstance, scoreAttempt } from './practiceEngine'
import { questionById, PASS_PCT } from '../data/practiceQuestions'

describe('practiceEngine', () => {
  it('creates a 60-instance attempt with empty answers/flags', () => {
    const a = createAttempt('practice')
    expect(a.mode).toBe('practice')
    expect(a.instances).toHaveLength(60)
    expect(a.answers).toEqual({})
    expect(a.flags).toEqual({})
    expect(a.submitted).toBe(false)
    expect(a.durationMs).toBeNull()
  })

  it('sets a 120-minute duration for timed attempts', () => {
    const a = createAttempt('timed')
    expect(a.durationMs).toBe(120 * 60 * 1000)
  })

  it('renders an instance to a stem, 4 option texts, and explanation', () => {
    const a = createAttempt('practice')
    const r = renderInstance(a.instances[0])
    expect(typeof r.stem).toBe('string')
    expect(r.opts).toHaveLength(4)
    expect(r.opts.filter((o) => o.correct)).toHaveLength(1)
    r.opts.forEach((o) => expect(typeof o.text).toBe('string'))
    expect(typeof r.explanation).toBe('string')
  })

  it('scores a fully-correct attempt at 100% and passing', () => {
    const a = createAttempt('practice')
    a.instances.forEach((inst, i) => {
      // choose the display position whose original option is correct
      const correctPos = inst.optOrder.findIndex(
        (origIdx) => questionById(inst.qid).options[origIdx].correct,
      )
      a.answers[i] = correctPos
    })
    const s = scoreAttempt(a)
    expect(s.correct).toBe(60)
    expect(s.total).toBe(60)
    expect(s.pct).toBe(100)
    expect(s.pass).toBe(true)
    expect(s.pct >= PASS_PCT).toBe(true)
    // per-domain totals sum to 60
    const totals = Object.values(s.perDomain).reduce((n, d) => n + d.total, 0)
    expect(totals).toBe(60)
  })

  it('scores an all-wrong attempt at 0% and failing', () => {
    const a = createAttempt('practice')
    a.instances.forEach((inst, i) => {
      const correctPos = inst.optOrder.findIndex(
        (origIdx) => questionById(inst.qid).options[origIdx].correct,
      )
      a.answers[i] = (correctPos + 1) % 4
    })
    const s = scoreAttempt(a)
    expect(s.pct).toBe(0)
    expect(s.pass).toBe(false)
  })
})
