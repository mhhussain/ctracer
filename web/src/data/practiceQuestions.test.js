// web/src/data/practiceQuestions.test.js
import { describe, it, expect } from 'vitest'
import { BANK, BLUEPRINT, PASS_PCT, DURATION_MIN, questionById } from './practiceQuestions'

describe('practiceQuestions bank', () => {
  it('exposes exam constants', () => {
    expect(PASS_PCT).toBe(72)
    expect(DURATION_MIN).toBe(120)
    expect(BLUEPRINT).toEqual({ d1: 16, d2: 12, d3: 12, d4: 11, d5: 9 })
  })

  it('builds a 60-question bank weighted to the blueprint', () => {
    expect(BANK).toHaveLength(60)
    for (const [domain, count] of Object.entries(BLUEPRINT)) {
      expect(BANK.filter((q) => q.domain === domain)).toHaveLength(count)
    }
  })

  it('gives every question 4 options with exactly one correct', () => {
    for (const q of BANK) {
      expect(q.options).toHaveLength(4)
      expect(q.options.filter((o) => o.correct)).toHaveLength(1)
      // practice options carry 1-2 interchangeable phrasings (timed set lives server-side)
      for (const o of q.options) {
        expect(Array.isArray(o.text)).toBe(true)
        expect(o.text.length).toBeGreaterThanOrEqual(1)
        expect(o.text.length).toBeLessThanOrEqual(2)
      }
    }
  })

  it('looks up questions by id', () => {
    expect(questionById(BANK[0].id)).toBe(BANK[0])
    expect(questionById('nope')).toBeUndefined()
  })
})
