import { describe, it, expect } from 'vitest'
import { CERT, DOMAINS, PHASES, COURSES, PROJECTS, EXAM_DAY_CHECKLIST } from './index'

describe('data layer', () => {
  it('CERT has required fields', () => {
    expect(CERT.name).toBe('Claude Certified Architect – Foundations')
    expect(CERT.short).toBe('CCA-F')
    expect(CERT.cost).toBe('$99')
    expect(CERT.passing).toBe('720 / 1000')
  })
  it('has 5 domains', () => expect(DOMAINS).toHaveLength(5))
  it('domains have required fields', () => {
    DOMAINS.forEach((d) => {
      expect(d).toHaveProperty('id')
      expect(d).toHaveProperty('num')
      expect(d).toHaveProperty('color')
      expect(d).toHaveProperty('weight')
      expect(d).toHaveProperty('questions')
    })
  })
  it('has 4 phases with tasks', () => {
    expect(PHASES).toHaveLength(4)
    PHASES.forEach((p) => expect(p.tasks.length).toBeGreaterThan(0))
  })
  it('has 9 courses', () => expect(COURSES).toHaveLength(9))
  it('has 5 projects', () => expect(PROJECTS).toHaveLength(5))
  it('has exam day checklist items', () => expect(EXAM_DAY_CHECKLIST.length).toBeGreaterThan(0))
})
