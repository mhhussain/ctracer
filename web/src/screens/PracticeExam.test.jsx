// web/src/screens/PracticeExam.test.jsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import PracticeExam from './PracticeExam'
import { AuthProvider } from '../lib/AuthContext'
import { clearExamStorage } from '../lib/examStorage'

// Mock firebase/auth so AuthProvider doesn't need a real Firebase app.
// onAuthStateChanged calls back with null (signed-out) synchronously.
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth, cb) => { cb(null); return () => {} },
  getAuth: vi.fn(),
}))

// Mock firestore so subscribeToAttempts + the leaderboard subscription don't blow up.
// getFirestore is needed because src/lib/firebase.js calls it at module load.
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  addDoc: vi.fn(),
  onSnapshot: vi.fn(() => () => {}),
  query: vi.fn(),
  orderBy: vi.fn(),
}))

// Mock functions so firebase.js init (getFunctions + connectFunctionsEmulator)
// and the exam callables don't require a live backend in tests.
vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(() => ({})),
  connectFunctionsEmulator: vi.fn(),
  httpsCallable: vi.fn(() => vi.fn()),
}))

const wrap = (ui) => render(<AuthProvider><MemoryRouter>{ui}</MemoryRouter></AuthProvider>)

describe('PracticeExam', () => {
  beforeEach(() => clearExamStorage())

  it('renders the hub with both modes', () => {
    wrap(<PracticeExam />)
    expect(screen.getByText('Timed Exam')).toBeInTheDocument()
    expect(screen.getByText('Practice')).toBeInTheDocument()
  })

  it('gates timed mode behind sign-in when signed out', () => {
    wrap(<PracticeExam />)
    expect(screen.getByText(/Sign in to start/i)).toBeInTheDocument()
  })

  it('starts a practice attempt and shows the runner', async () => {
    const u = userEvent.setup()
    wrap(<PracticeExam />)
    await u.click(screen.getByRole('button', { name: /Start practice/i }))
    expect(screen.getByText(/of 60/i)).toBeInTheDocument()
  })

  it('reveals instant feedback after answering in practice mode', async () => {
    const u = userEvent.setup()
    wrap(<PracticeExam />)
    await u.click(screen.getByRole('button', { name: /Start practice/i }))
    const options = screen.getAllByText(/A|B|C|D/).length // sanity that options rendered
    expect(options).toBeGreaterThan(0)
    // click the first option card (letter A)
    const firstOpt = document.querySelector('.pe-opt')
    await u.click(firstOpt)
    // feedback panel appears (Correct / Not quite)
    expect(document.querySelector('.pe-feedback')).toBeTruthy()
  })

  it('shows an empty leaderboard banner state and the seeded board', async () => {
    const u = userEvent.setup()
    wrap(<PracticeExam />)
    // Two buttons match /Leaderboard/i (tab + hub shortcut); click the tab (first one)
    await u.click(screen.getAllByRole('button', { name: /Leaderboard/i })[0])
    expect(screen.getByText(/No timed score yet/i)).toBeInTheDocument()
    expect(screen.getByText('agentsmith')).toBeInTheDocument()
  })
})
