import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useProgress } from './useProgress'

// vi.mock factories are hoisted — variables must be created with vi.hoisted()
const { mockUseAuth, mockSubscribe, mockSave } = vi.hoisted(() => ({
  mockUseAuth: vi.fn().mockReturnValue({ user: null, loading: false }),
  mockSubscribe: vi.fn(),
  mockSave: vi.fn(),
}))

// Mock useAuth — default to signed-out (null user)
vi.mock('./useAuth', () => ({ useAuth: (...args) => mockUseAuth(...args) }))

// Mock storage — controlled subscription
vi.mock('../lib/storage', () => ({
  DEFAULT_PROGRESS: { courses: {}, projects: {}, tasks: {}, exam_day: {}, practiceScore: null },
  subscribeToProgress: (...args) => mockSubscribe(...args),
  saveProgress: (...args) => mockSave(...args),
  clearProgress: vi.fn(),
}))

const DEFAULT = { courses: {}, projects: {}, tasks: {}, exam_day: {}, practiceScore: null }

// Helper: make subscribeToProgress call the callback immediately with given progress
function setupSubscribe(progress = DEFAULT) {
  const unsub = vi.fn()
  mockSubscribe.mockImplementation((_user, cb) => {
    cb(progress)
    return unsub
  })
  return unsub
}

describe('useProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ user: null, loading: false })
  })

  it('starts loading until subscription fires', async () => {
    // Subscribe never fires callback — simulates pending Firestore load
    const unsub = vi.fn()
    mockSubscribe.mockReturnValue(unsub)

    const { result } = renderHook(() => useProgress())
    expect(result.current.loading).toBe(true)
  })

  it('loading becomes false after subscription fires', async () => {
    setupSubscribe()
    const { result } = renderHook(() => useProgress())
    await waitFor(() => expect(result.current.loading).toBe(false))
  })

  it('starts with empty progress', async () => {
    setupSubscribe()
    const { result } = renderHook(() => useProgress())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.progress.courses).toEqual({})
    expect(result.current.stats.overall).toBe(0)
  })

  it('toggleCourse flips state and calls saveProgress', async () => {
    setupSubscribe()
    const { result } = renderHook(() => useProgress())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => result.current.toggleCourse('c1'))
    expect(result.current.progress.courses.c1).toBe(true)
    expect(mockSave).toHaveBeenCalledWith(null, expect.objectContaining({ courses: { c1: true } }))

    act(() => result.current.toggleCourse('c1'))
    expect(result.current.progress.courses.c1).toBe(false)
  })

  it('toggleTask updates overall stat', async () => {
    setupSubscribe()
    const { result } = renderHook(() => useProgress())
    await waitFor(() => expect(result.current.loading).toBe(false))

    const before = result.current.stats.overall
    act(() => result.current.toggleTask('p1t1'))
    expect(result.current.progress.tasks.p1t1).toBe(true)
    expect(result.current.stats.overall).toBeGreaterThan(before)
  })

  it('setProject updates project status', async () => {
    setupSubscribe()
    const { result } = renderHook(() => useProgress())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => result.current.setProject('pr1', 'in_progress'))
    expect(result.current.progress.projects.pr1).toBe('in_progress')
  })

  it('unsubscribes and resubscribes when user changes', async () => {
    const unsub1 = setupSubscribe()
    const { result, rerender } = renderHook(() => useProgress())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(mockSubscribe).toHaveBeenCalledWith(null, expect.any(Function))

    // Simulate sign-in
    const mockUser = { uid: 'uid-123' }
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false })
    const unsub2 = setupSubscribe()
    rerender()

    await waitFor(() => expect(mockSubscribe).toHaveBeenCalledWith(mockUser, expect.any(Function)))
    expect(unsub1).toHaveBeenCalled()
  })

  it('saveProgress passes user to storage', async () => {
    const mockUser = { uid: 'uid-123' }
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false })
    setupSubscribe()

    const { result } = renderHook(() => useProgress())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => result.current.toggleCourse('c1'))
    expect(mockSave).toHaveBeenCalledWith(mockUser, expect.objectContaining({ courses: { c1: true } }))
  })

  it('cycleProject cycles through not_started → in_progress → complete → not_started', async () => {
    setupSubscribe()
    const { result } = renderHook(() => useProgress())
    await waitFor(() => expect(result.current.loading).toBe(false))

    // First cycle: not_started → in_progress
    act(() => result.current.cycleProject('pr1'))
    expect(result.current.progress.projects.pr1).toBe('in_progress')
    expect(result.current.stats.projectsWip).toBe(1)

    // Second cycle: in_progress → complete
    act(() => result.current.cycleProject('pr1'))
    expect(result.current.progress.projects.pr1).toBe('complete')
    expect(result.current.stats.projectsDone).toBe(1)
    expect(result.current.stats.projectsWip).toBe(0)

    // Third cycle: complete → not_started
    act(() => result.current.cycleProject('pr1'))
    expect(result.current.progress.projects.pr1).toBe('not_started')
    expect(result.current.stats.projectsDone).toBe(0)
  })
})
