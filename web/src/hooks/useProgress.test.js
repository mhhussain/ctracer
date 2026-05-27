import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProgress } from './useProgress'
import { clearProgress } from '../lib/storage'

describe('useProgress', () => {
  beforeEach(() => clearProgress())

  it('starts with empty progress', () => {
    const { result } = renderHook(() => useProgress())
    expect(result.current.progress.courses).toEqual({})
    expect(result.current.progress.tasks).toEqual({})
    expect(result.current.stats.overall).toBe(0)
  })

  it('toggleCourse flips and persists', () => {
    const { result } = renderHook(() => useProgress())
    act(() => result.current.toggleCourse('c1'))
    expect(result.current.progress.courses.c1).toBe(true)
    act(() => result.current.toggleCourse('c1'))
    expect(result.current.progress.courses.c1).toBe(false)
  })

  it('toggleTask flips completion and updates overall', () => {
    const { result } = renderHook(() => useProgress())
    const before = result.current.stats.overall
    act(() => result.current.toggleTask('p1t1'))
    expect(result.current.progress.tasks.p1t1).toBe(true)
    expect(result.current.stats.overall).toBeGreaterThan(before)
  })

  it('setProject updates project status', () => {
    const { result } = renderHook(() => useProgress())
    act(() => result.current.setProject('pr1', 'in_progress'))
    expect(result.current.progress.projects.pr1).toBe('in_progress')
  })

  it('stats reflect completed items', () => {
    const { result } = renderHook(() => useProgress())
    act(() => result.current.toggleCourse('c1'))
    expect(result.current.stats.coursesDone).toBe(1)
    act(() => result.current.setProject('pr1', 'complete'))
    expect(result.current.stats.projectsDone).toBe(1)
  })
})
