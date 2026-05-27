import { beforeEach, describe, expect, it } from 'vitest'
import { getProgress, saveProgress, clearProgress } from './storage'

const DEFAULT = { courses: {}, projects: {}, tasks: {}, exam_day: {}, practiceScore: null }

describe('storage', () => {
  beforeEach(() => clearProgress())

  it('returns default shape when nothing is saved', () => {
    expect(getProgress()).toEqual(DEFAULT)
  })

  it('saves and retrieves progress', () => {
    const p = { ...DEFAULT, courses: { c1: true } }
    saveProgress(p)
    expect(getProgress()).toEqual(p)
  })

  it('clearProgress resets to default', () => {
    saveProgress({ ...DEFAULT, courses: { c1: true } })
    clearProgress()
    expect(getProgress()).toEqual(DEFAULT)
  })

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('ctracer_progress', 'not-json')
    expect(getProgress()).toEqual(DEFAULT)
  })
})
