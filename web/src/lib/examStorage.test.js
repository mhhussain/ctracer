// web/src/lib/examStorage.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadLocalAttempts, addLocalAttempt,
  loadActive, saveActive, clearActive,
  loadPosted, savePosted, clearPosted,
  clearExamStorage,
} from './examStorage'

describe('examStorage (signed-out / localStorage)', () => {
  beforeEach(() => clearExamStorage())

  it('starts with no attempts', () => {
    expect(loadLocalAttempts()).toEqual([])
  })

  it('prepends added attempts (newest first)', () => {
    addLocalAttempt({ id: 'a1', score: { pct: 50 } })
    addLocalAttempt({ id: 'a2', score: { pct: 80 } })
    const all = loadLocalAttempts()
    expect(all.map((a) => a.id)).toEqual(['a2', 'a1'])
  })

  it('round-trips the active attempt and clears it', () => {
    expect(loadActive()).toBeNull()
    saveActive({ id: 'live', mode: 'timed' })
    expect(loadActive().id).toBe('live')
    clearActive()
    expect(loadActive()).toBeNull()
  })

  it('round-trips the posted leaderboard entry and clears it', () => {
    expect(loadPosted()).toBeNull()
    savePosted({ score: 88, handle: 'me', anon: false, date: '2026-05-29' })
    expect(loadPosted().score).toBe(88)
    clearPosted()
    expect(loadPosted()).toBeNull()
  })
})
