# Firebase Web Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Firebase Auth and Firestore into the web app's storage and auth layers, implement the Profile screen, and add GitHub Actions for automated production deploys and PR preview deployments.

**Architecture:** Firebase SDK is already installed. `firebase.js` currently exports null stubs — we replace those with a real init using Vite env vars. A new `AuthContext` shares auth state app-wide. The storage service gains a subscription model: localStorage for unauthenticated users, a Firestore `onSnapshot` listener for signed-in users. `useProgress` subscribes through this service and gains a `loading` state.

**Tech Stack:** Firebase JS SDK v12 (Auth, Firestore), React context, Vitest + jsdom, FirebaseExtended/action-hosting-deploy GitHub Action

**Design doc:** `docs/superpowers/specs/2026-05-26-firebase-web-integration-design.md`

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `web/.env.local` | Create | Firebase config env vars (gitignored) |
| `web/src/lib/firebase.js` | Modify | Replace null stubs with real SDK init |
| `web/src/lib/auth.js` | Create | `signInWithEmail`, `signInWithGoogle`, `signOut` helpers |
| `web/src/lib/AuthContext.jsx` | Create | Auth context + `AuthProvider` component |
| `web/src/hooks/useAuth.js` | Create | `useAuth()` hook — reads `AuthContext` |
| `web/src/lib/storage.js` | Modify | Auth-aware subscription model (localStorage + Firestore) |
| `web/src/lib/storage.test.js` | Modify | Replace `getProgress` tests with new `subscribeToProgress`/`saveProgress` API |
| `web/src/hooks/useProgress.js` | Modify | Subscribe via storage service, add `loading` state, pass `user` to writes |
| `web/src/hooks/useProgress.test.js` | Modify | Mock `useAuth` + `storage`; add `loading` tests |
| `web/src/App.jsx` | Modify | Wrap route tree in `<AuthProvider>` |
| `web/src/screens/Profile.jsx` | Modify | Full sign-in/sign-out UI |
| `.github/workflows/deploy-production.yml` | Create | Deploy to live channel on push to `main` |
| `.github/workflows/deploy-preview.yml` | Create | Deploy preview channel on PR open/sync |

---

## Task 1: Firebase SDK Init

Wire up `firebase.js` with real config from env vars.

**Files:**
- Create: `web/.env.local`
- Modify: `web/src/lib/firebase.js`

- [ ] **Step 1: Create `.env.local` with Firebase config**

Create `web/.env.local` (this file is already gitignored via `*.local`):

```
VITE_FIREBASE_API_KEY=AIzaSyCFHA_Goxe_5f9KmsUDuL6UYAOybkgf04k
VITE_FIREBASE_AUTH_DOMAIN=iammoo-ctracer.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=iammoo-ctracer
VITE_FIREBASE_STORAGE_BUCKET=iammoo-ctracer.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=812768609578
VITE_FIREBASE_APP_ID=1:812768609578:web:3a5b0568eb2e94f7068a53
```

- [ ] **Step 2: Replace `firebase.js` with real SDK init**

Replace the full contents of `web/src/lib/firebase.js`:

```js
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
})

export const auth = getAuth(app)
export const db = getFirestore(app)
```

- [ ] **Step 3: Verify the app starts without errors**

```bash
cd web && npm run dev
```

Expected: Dev server starts at `http://localhost:5173`. No console errors about Firebase initialization. (Auth and Firestore won't do anything useful yet — that's fine.)

- [ ] **Step 4: Commit**

```bash
git add web/src/lib/firebase.js
git commit -m "feat: initialize Firebase SDK from env vars"
```

(Do not commit `.env.local` — it is gitignored.)

---

## Task 2: Auth Helpers

Thin wrappers over Firebase Auth SDK. No state — just functions.

**Files:**
- Create: `web/src/lib/auth.js`

- [ ] **Step 1: Create `web/src/lib/auth.js`**

```js
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth'
import { auth } from './firebase'

export function signInWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
}

export function signInWithGoogle() {
  return signInWithPopup(auth, new GoogleAuthProvider())
}

export function signOut() {
  return firebaseSignOut(auth)
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/lib/auth.js
git commit -m "feat: add auth helper functions"
```

---

## Task 3: Auth Context, useAuth Hook, and App Wiring

Shares auth state (current user + loading flag) across the whole app via React context.

**Files:**
- Create: `web/src/lib/AuthContext.jsx`
- Create: `web/src/hooks/useAuth.js`
- Modify: `web/src/App.jsx`

- [ ] **Step 1: Create `web/src/lib/AuthContext.jsx`**

```jsx
import { createContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'

export const AuthContext = createContext({ user: null, loading: true })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}
```

- [ ] **Step 2: Create `web/src/hooks/useAuth.js`**

```js
import { useContext } from 'react'
import { AuthContext } from '../lib/AuthContext'

export function useAuth() {
  return useContext(AuthContext)
}
```

- [ ] **Step 3: Wrap the route tree in `<AuthProvider>` in `App.jsx`**

Replace the full contents of `web/src/App.jsx`:

```jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import Sidebar from './components/Sidebar'
import Dashboard from './screens/Dashboard'
import ExamBlueprint from './screens/ExamBlueprint'
import StudyPlan from './screens/StudyPlan'
import Courses from './screens/Courses'
import Projects from './screens/Projects'
import DomainDeepDive from './screens/DomainDeepDive'
import KeyConcepts from './screens/KeyConcepts'
import ExamDayChecklist from './screens/ExamDayChecklist'
import Profile from './screens/Profile'
import MobileDownload from './screens/MobileDownload'

export default function App() {
  return (
    <AuthProvider>
      <div className="app-layout">
        <Sidebar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/blueprint" element={<ExamBlueprint />} />
            <Route path="/plan" element={<StudyPlan />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/domain/:id" element={<DomainDeepDive />} />
            <Route path="/concepts" element={<KeyConcepts />} />
            <Route path="/exam-day" element={<ExamDayChecklist />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/mobile" element={<MobileDownload />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  )
}
```

- [ ] **Step 4: Verify the app still loads correctly**

```bash
cd web && npm run dev
```

Expected: App loads at `http://localhost:5173`, all existing screens navigate correctly, no console errors.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/AuthContext.jsx web/src/hooks/useAuth.js web/src/App.jsx
git commit -m "feat: add auth context and useAuth hook"
```

---

## Task 4: Storage Service Upgrade

Replace the synchronous localStorage-only API with an auth-aware subscription model. Unauthenticated path uses localStorage. Authenticated path uses a Firestore `onSnapshot` listener.

**Files:**
- Modify: `web/src/lib/storage.js`
- Modify: `web/src/lib/storage.test.js`

- [ ] **Step 1: Write the failing tests for the new API**

Replace the full contents of `web/src/lib/storage.test.js`:

```js
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { subscribeToProgress, saveProgress, clearProgress } from './storage'

const DEFAULT = { courses: {}, projects: {}, tasks: {}, exam_day: {}, practiceScore: null }

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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd web && npm test -- storage.test.js
```

Expected: Tests fail because `subscribeToProgress` doesn't exist yet.

- [ ] **Step 3: Replace `storage.js` with the new implementation**

Replace the full contents of `web/src/lib/storage.js`:

```js
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from './firebase'

const KEY = 'ctracer_progress'

const DEFAULT_PROGRESS = {
  courses: {},
  projects: {},
  tasks: {},
  exam_day: {},
  practiceScore: null,
}

function getLocalProgress() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT_PROGRESS }
    return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_PROGRESS }
  }
}

export function subscribeToProgress(user, callback) {
  if (!user) {
    callback(getLocalProgress())
    return () => {}
  }
  const ref = doc(db, 'users', user.uid, 'progress', 'data')
  return onSnapshot(ref, (snap) => {
    callback(snap.exists() ? { ...DEFAULT_PROGRESS, ...snap.data() } : { ...DEFAULT_PROGRESS })
  })
}

export function saveProgress(user, progress) {
  if (!user) {
    try {
      localStorage.setItem(KEY, JSON.stringify(progress))
    } catch {
      // quota exceeded or private browsing — in-memory state is still updated
    }
    return
  }
  const ref = doc(db, 'users', user.uid, 'progress', 'data')
  setDoc(ref, progress, { merge: true }).catch(() => {
    // Firestore has built-in offline persistence; this catch is a safety net only
  })
}

export function clearProgress() {
  localStorage.removeItem(KEY)
}
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
cd web && npm test -- storage.test.js
```

Expected: All 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/storage.js web/src/lib/storage.test.js
git commit -m "feat: upgrade storage service to auth-aware subscription model"
```

---

## Task 5: useProgress Hook Upgrade

`useProgress` gains `user` from `useAuth`, switches storage subscriptions on auth change, and adds a `loading` state for the initial data fetch.

**Files:**
- Modify: `web/src/hooks/useProgress.js`
- Modify: `web/src/hooks/useProgress.test.js`

- [ ] **Step 1: Write the updated tests**

Replace the full contents of `web/src/hooks/useProgress.test.js`:

```js
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
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd web && npm test -- useProgress.test.js
```

Expected: Tests fail — `useProgress` still uses the old `getProgress`/`saveProgress` API and doesn't accept a user.

- [ ] **Step 3: Replace `useProgress.js` with the upgraded implementation**

Replace the full contents of `web/src/hooks/useProgress.js`:

```js
import { useCallback, useEffect, useState } from 'react'
import { saveProgress, subscribeToProgress } from '../lib/storage'
import { COURSES, PHASES, PROJECTS } from '../data/index'
import { useAuth } from './useAuth'

const ALL_TASKS = PHASES.flatMap((p) => p.tasks)
const HOURS_TOTAL = Math.round(ALL_TASKS.reduce((s, t) => s + t.hours, 0) * 10) / 10

const DEFAULT_PROGRESS = {
  courses: {},
  projects: {},
  tasks: {},
  exam_day: {},
  practiceScore: null,
}

export function useProgress() {
  const { user } = useAuth()
  const [progress, setProgress] = useState(DEFAULT_PROGRESS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const unsubscribe = subscribeToProgress(user, (p) => {
      setProgress(p)
      setLoading(false)
    })
    return unsubscribe
  }, [user])

  const update = useCallback(
    (fn) => {
      setProgress((prev) => {
        const next = fn(prev)
        saveProgress(user, next)
        return next
      })
    },
    [user],
  )

  const toggleCourse = useCallback(
    (id) => update((p) => ({ ...p, courses: { ...p.courses, [id]: !p.courses[id] } })),
    [update],
  )

  const toggleTask = useCallback(
    (id) => update((p) => ({ ...p, tasks: { ...p.tasks, [id]: !p.tasks[id] } })),
    [update],
  )

  const setProject = useCallback(
    (id, status) => update((p) => ({ ...p, projects: { ...p.projects, [id]: status } })),
    [update],
  )

  const toggleExamDay = useCallback(
    (id) => update((p) => ({ ...p, exam_day: { ...p.exam_day, [id]: !p.exam_day[id] } })),
    [update],
  )

  const setPracticeScore = useCallback(
    (score) => update((p) => ({ ...p, practiceScore: score })),
    [update],
  )

  const coursesDone = COURSES.filter((c) => progress.courses[c.id]).length
  const partnerDone = COURSES.filter((c) => c.partnerRequired && progress.courses[c.id]).length
  const partnerTotal = COURSES.filter((c) => c.partnerRequired).length
  const projectsDone = PROJECTS.filter((p) => progress.projects[p.id] === 'complete').length
  const projectsWip = PROJECTS.filter((p) => progress.projects[p.id] === 'in_progress').length
  const tasksDone = ALL_TASKS.filter((t) => progress.tasks[t.id]).length
  const hoursDone =
    Math.round(ALL_TASKS.filter((t) => progress.tasks[t.id]).reduce((s, t) => s + t.hours, 0) * 10) / 10
  const overall = ALL_TASKS.length > 0 ? Math.round((tasksDone / ALL_TASKS.length) * 100) : 0

  return {
    progress,
    loading,
    toggleCourse,
    toggleTask,
    setProject,
    toggleExamDay,
    setPracticeScore,
    stats: {
      coursesDone,
      coursesTotal: COURSES.length,
      partnerDone,
      partnerTotal,
      projectsDone,
      projectsTotal: PROJECTS.length,
      projectsWip,
      hoursDone,
      hoursTotal: HOURS_TOTAL,
      overall,
    },
  }
}
```

- [ ] **Step 4: Run all tests and verify they pass**

```bash
cd web && npm test
```

Expected: All tests pass, including the full suite (storage + useProgress + App tests).

- [ ] **Step 5: Commit**

```bash
git add web/src/hooks/useProgress.js web/src/hooks/useProgress.test.js
git commit -m "feat: upgrade useProgress to subscribe through auth-aware storage service"
```

---

## Task 6: Profile Screen

Implements sign-in (email/password + Google) and sign-out UI. This is the only screen with auth-facing UI.

**Files:**
- Modify: `web/src/screens/Profile.jsx`

- [ ] **Step 1: Replace `Profile.jsx` with the full implementation**

Replace the full contents of `web/src/screens/Profile.jsx`:

```jsx
import { useState } from 'react'
import { signInWithEmail, signInWithGoogle, signOut } from '../lib/auth'
import { useAuth } from '../hooks/useAuth'

export default function Profile() {
  const { user, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  if (loading) return null

  if (user) {
    return (
      <div className="screen-container">
        <h1 className="screen-title">Profile</h1>
        <div className="profile-signed-in">
          <p className="profile-name">{user.displayName || user.email}</p>
          <p className="profile-email">{user.displayName ? user.email : null}</p>
          <button className="btn btn-secondary" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>
    )
  }

  async function handleEmailSignIn(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signInWithEmail(email, password)
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogleSignIn() {
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(friendlyError(err.code))
      }
    }
  }

  return (
    <div className="screen-container">
      <h1 className="screen-title">Sign In</h1>
      <p className="profile-subtitle">Sign in to sync your progress across devices.</p>

      <form className="profile-form" onSubmit={handleEmailSignIn}>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          autoComplete="email"
        />
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          autoComplete="current-password"
        />
        {error && <p className="profile-error">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="profile-divider">
        <span>or</span>
      </div>

      <button className="btn btn-google" onClick={handleGoogleSignIn}>
        Sign in with Google
      </button>
    </div>
  )
}

function friendlyError(code) {
  switch (code) {
    case 'auth/invalid-credential':
      return 'Incorrect email or password.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later.'
    case 'auth/network-request-failed':
      return 'Network error. Check your connection.'
    default:
      return 'Something went wrong. Try again.'
  }
}
```

- [ ] **Step 2: Run tests to confirm nothing is broken**

```bash
cd web && npm test
```

Expected: All tests pass. (Profile screen has no unit tests — it's tested manually in the next step.)

- [ ] **Step 3: Manually verify the Profile screen in the browser**

```bash
cd web && npm run dev
```

Navigate to `http://localhost:5173/profile`. Verify:
- Signed-out state shows the sign-in form and Google button
- Email/password sign-in works (use a real account or create one at `https://console.firebase.google.com/project/iammoo-ctracer/authentication/users`)
- Google sign-in popup opens and completes
- Signed-in state shows user name/email and a Sign out button
- Sign out returns to the signed-out form

Also verify that checking off a course while signed in and then reloading the page preserves the progress (Firestore persistence).

- [ ] **Step 4: Commit**

```bash
git add web/src/screens/Profile.jsx
git commit -m "feat: implement Profile screen with email and Google sign-in"
```

---

## Task 7: Service Account for GitHub Actions

GitHub Actions needs a Firebase service account to deploy. This task generates the key and adds it to GitHub secrets.

**Files:** None (configuration only)

- [ ] **Step 1: Generate a Firebase service account key**

Run this in the terminal (requires `gcloud` CLI — if not installed, use the GCP Console alternative below):

```bash
# Option A: Firebase CLI (interactive — recommended)
firebase init hosting:github
# Follow prompts: choose "iammoo-ctracer", authorize GitHub, select your repo.
# This creates the service account and adds the secret automatically. Skip to Step 3 if this succeeds.

# Option B: Manual via gcloud CLI
gcloud iam service-accounts create firebase-gh-deploy \
  --project=iammoo-ctracer \
  --display-name="Firebase GitHub Deploy"

gcloud projects add-iam-policy-binding iammoo-ctracer \
  --member="serviceAccount:firebase-gh-deploy@iammoo-ctracer.iam.gserviceaccount.com" \
  --role="roles/firebase.developAdmin"

gcloud iam service-accounts keys create /tmp/firebase-sa-key.json \
  --iam-account=firebase-gh-deploy@iammoo-ctracer.iam.gserviceaccount.com \
  --project=iammoo-ctracer
```

**Option C: GCP Console (no CLI needed)**
1. Go to `https://console.cloud.google.com/iam-admin/serviceaccounts?project=iammoo-ctracer`
2. Click **Create service account** → name it `firebase-gh-deploy`
3. Grant role: **Firebase Develop Admin**
4. Click the created account → **Keys** tab → **Add key** → **JSON**
5. Download the JSON file

- [ ] **Step 2: Add the service account as a GitHub secret**

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add secret named `FIREBASE_SERVICE_ACCOUNT_IAMMOO_CTRACER` with the full contents of the JSON key file.

- [ ] **Step 3: Add Firebase config as GitHub secrets**

In the same GitHub Secrets UI, add these 6 secrets:

| Name | Value |
|------|-------|
| `VITE_FIREBASE_API_KEY` | `AIzaSyCFHA_Goxe_5f9KmsUDuL6UYAOybkgf04k` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `iammoo-ctracer.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `iammoo-ctracer` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `iammoo-ctracer.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `812768609578` |
| `VITE_FIREBASE_APP_ID` | `1:812768609578:web:3a5b0568eb2e94f7068a53` |

---

## Task 8: GitHub Actions — Production Deploy

Automatically deploys to the Firebase Hosting live channel on every push to `main`.

**Files:**
- Create: `.github/workflows/deploy-production.yml`

- [ ] **Step 1: Create the `.github/workflows/` directory if it doesn't exist**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Create `.github/workflows/deploy-production.yml`**

```yaml
name: Deploy to Firebase Hosting (Production)

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: web/package-lock.json

      - name: Install dependencies
        run: npm ci
        working-directory: web

      - name: Build
        run: npm run build
        working-directory: web
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}

      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_IAMMOO_CTRACER }}
          channelId: live
          projectId: iammoo-ctracer
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy-production.yml
git commit -m "chore: add GitHub Actions production deploy workflow"
```

---

## Task 9: GitHub Actions — PR Preview Deploy

Deploys a unique preview URL for each PR. The `FirebaseExtended/action-hosting-deploy` action automatically posts the preview URL as a PR comment.

**Files:**
- Create: `.github/workflows/deploy-preview.yml`

- [ ] **Step 1: Create `.github/workflows/deploy-preview.yml`**

```yaml
name: Deploy PR Preview to Firebase Hosting

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  preview:
    runs-on: ubuntu-latest
    permissions:
      checks: write
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: web/package-lock.json

      - name: Install dependencies
        run: npm ci
        working-directory: web

      - name: Build
        run: npm run build
        working-directory: web
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}

      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_IAMMOO_CTRACER }}
          projectId: iammoo-ctracer
          expires: 7d
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy-preview.yml
git commit -m "chore: add GitHub Actions PR preview deploy workflow"
```

---

## Task 10: End-to-End Verification

Manual smoke test to confirm the full integration works before raising the PR.

**Files:** None

- [ ] **Step 1: Run the full test suite**

```bash
cd web && npm test
```

Expected: All tests pass.

- [ ] **Step 2: Build the app for production**

```bash
cd web && npm run build
```

Expected: Build completes successfully with no errors. Output in `web/dist/`.

- [ ] **Step 3: Verify the full auth + Firestore flow in the browser**

```bash
cd web && npm run dev
```

Walk through:
1. Navigate to `/profile` — confirm sign-in form is shown
2. Sign in with email/password — confirm the signed-in state (name/email shown)
3. Go to `/courses` — toggle a course completion — reload the page — confirm the toggle is persisted (Firestore)
4. Go to `/profile` — click Sign out — confirm the signed-out form returns
5. Confirm all other screens still load and function correctly

- [ ] **Step 4: Push the branch and open a PR**

```bash
git push -u origin <current-branch>
gh pr create --title "feat: Firebase web integration + GitHub Actions CI/CD" \
  --body "$(cat <<'EOF'
## Summary
- Wires Firebase Auth and Firestore into the web app
- Upgrades storage service to auth-aware subscription model (localStorage → Firestore on sign-in)
- Implements Profile screen with email/password and Google sign-in
- Adds GitHub Actions for production deploy on merge to main
- Adds GitHub Actions for PR preview deployments (7-day expiry)

## Test Plan
- [ ] `npm test` passes in `web/`
- [ ] Sign in with email/password — progress syncs to Firestore on reload
- [ ] Sign in with Google — same
- [ ] Sign out — app falls back to localStorage
- [ ] PR preview URL appears as a comment on this PR (requires GitHub secrets to be configured)
EOF
)"
```

- [ ] **Step 5: Confirm the preview deploy runs in GitHub Actions**

In GitHub, navigate to the PR → **Actions** tab. Confirm the `Deploy PR Preview to Firebase Hosting` workflow runs and completes. A comment with the preview URL should appear on the PR.

---

## Notes for the Implementing Engineer

**CSS classes used in Profile.jsx** (`screen-container`, `screen-title`, `btn`, `btn-primary`, `btn-secondary`, `btn-google`, `input`, `profile-*`) follow the same convention as other screens. If these classes don't exist yet in the design system, add minimal styles or adapt to the classes already defined in `index.css`.

**Firebase Auth domain restriction:** If Google sign-in fails with `auth/unauthorized-domain` on the preview URL, add the preview domain to Firebase Auth's authorized domains at `https://console.firebase.google.com/project/iammoo-ctracer/authentication/settings`.

**`loading` in `useProgress`:** Existing screens that use `useProgress` don't check `loading`. This is fine — they'll render with `DEFAULT_PROGRESS` until the subscription fires, which is fast enough to be imperceptible for the localStorage path and typically under 500ms for Firestore.
