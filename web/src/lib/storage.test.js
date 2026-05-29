import { beforeEach, describe, expect, it, vi } from 'vitest'
import { subscribeToProgress, saveProgress, clearProgress, resetProgress, DEFAULT_PROGRESS } from './storage'

const DEFAULT = { courses: {}, projects: {}, tasks: {}, exam_day: {}, practiceScore: null, examDate: null }

// vi.mock factories are hoisted — variables must be created with vi.hoisted()
const { mockUnsubscribe, mockOnSnapshot, mockSetDoc, mockDoc } = vi.hoisted(() => ({
  mockUnsubscribe: vi.fn(),
  mockOnSnapshot: vi.fn(),
  mockSetDoc: vi.fn().mockResolvedValue(undefined),
  mockDoc: vi.fn().mockReturnValue('mock-ref'),
}))

// Mock Firestore — the real module is never loaded in tests
vi.mock('./firebase', () => ({ db: {} }))
vi.mock('firebase/firestore', () => ({
  doc: mockDoc,
  onSnapshot: mockOnSnapshot,
  setDoc: mockSetDoc,
}))

describe('storage — localStorage path (user = null)', () => {
  beforeEach(() => {
    clearProgress()
    vi.clearAllMocks()
  })

  it('calls callback immediately with default progress when nothing saved', () => {
    const cb = vi.fn()
    const unsub = subscribeToProgress(null, cb)
    expect(cb).toHaveBeenCalledOnce()
    expect(cb).toHaveBeenCalledWith(DEFAULT)
    expect(typeof unsub).toBe('function')
  })

  it('calls callback with saved progress', () => {
    saveProgress(null, { ...DEFAULT, courses: { c1: true } })
    const cb = vi.fn()
    subscribeToProgress(null, cb)
    expect(cb).toHaveBeenCalledWith({ ...DEFAULT, courses: { c1: true } })
  })

  it('saveProgress persists to localStorage', () => {
    saveProgress(null, { ...DEFAULT, tasks: { t1: true } })
    const cb = vi.fn()
    subscribeToProgress(null, cb)
    expect(cb).toHaveBeenCalledWith({ ...DEFAULT, tasks: { t1: true } })
  })

  it('clearProgress resets localStorage', () => {
    saveProgress(null, { ...DEFAULT, courses: { c1: true } })
    clearProgress()
    const cb = vi.fn()
    subscribeToProgress(null, cb)
    expect(cb).toHaveBeenCalledWith(DEFAULT)
  })

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('ctracer_progress', 'not-json')
    const cb = vi.fn()
    subscribeToProgress(null, cb)
    expect(cb).toHaveBeenCalledWith(DEFAULT)
  })
})

describe('storage — Firestore path (user set)', () => {
  const mockUser = { uid: 'uid-123' }

  beforeEach(() => {
    clearProgress()
    vi.clearAllMocks()
    mockOnSnapshot.mockImplementation((_ref, cb) => {
      cb({ exists: () => true, data: () => ({ courses: { c1: true }, projects: {}, tasks: {}, exam_day: {}, practiceScore: null }) })
      return mockUnsubscribe
    })
  })

  it('attaches an onSnapshot listener and calls callback with Firestore data', () => {
    const cb = vi.fn()
    subscribeToProgress(mockUser, cb)
    expect(mockDoc).toHaveBeenCalledWith({}, 'users', 'uid-123', 'progress', 'data')
    expect(mockOnSnapshot).toHaveBeenCalledOnce()
    expect(cb).toHaveBeenCalledWith({ ...DEFAULT, courses: { c1: true } })
  })

  it('returns the onSnapshot unsubscribe function', () => {
    const unsub = subscribeToProgress(mockUser, vi.fn())
    expect(unsub).toBe(mockUnsubscribe)
  })

  it('uses DEFAULT_PROGRESS when Firestore doc does not exist', () => {
    mockOnSnapshot.mockImplementation((_ref, cb) => {
      cb({ exists: () => false, data: () => ({}) })
      return mockUnsubscribe
    })
    const cb = vi.fn()
    subscribeToProgress(mockUser, cb)
    expect(cb).toHaveBeenCalledWith(DEFAULT)
  })

  it('saveProgress calls setDoc with merge', () => {
    const progress = { ...DEFAULT, tasks: { t1: true } }
    saveProgress(mockUser, progress)
    expect(mockDoc).toHaveBeenCalledWith({}, 'users', 'uid-123', 'progress', 'data')
    expect(mockSetDoc).toHaveBeenCalledWith('mock-ref', progress, { merge: true })
  })
})

describe('resetProgress', () => {
  const mockUser = { uid: 'uid-123' }

  beforeEach(() => {
    clearProgress()
    vi.clearAllMocks()
  })

  it('clears localStorage and does not call setDoc when user is null', async () => {
    saveProgress(null, { ...DEFAULT, courses: { c1: true } })
    await resetProgress(null)
    expect(mockSetDoc).not.toHaveBeenCalled()
    const cb = vi.fn()
    subscribeToProgress(null, cb)
    expect(cb).toHaveBeenCalledWith(DEFAULT)
  })

  it('clears localStorage and calls setDoc with DEFAULT_PROGRESS when user is set', async () => {
    saveProgress(null, { ...DEFAULT, courses: { c1: true } })
    await resetProgress(mockUser)
    expect(mockDoc).toHaveBeenCalledWith({}, 'users', 'uid-123', 'progress', 'data')
    expect(mockSetDoc).toHaveBeenCalledWith('mock-ref', DEFAULT_PROGRESS)
    const cb = vi.fn()
    subscribeToProgress(null, cb)
    expect(cb).toHaveBeenCalledWith(DEFAULT)
  })
})
