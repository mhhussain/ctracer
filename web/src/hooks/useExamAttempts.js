// web/src/hooks/useExamAttempts.js
// Auth-aware exam state. Part A: practice mode (client-side). Part B: timed mode (server-side via Functions).
import { useCallback, useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useAuth } from './useAuth'
import { db } from '../lib/firebase'
import { startExamFn, submitExamFn, postToLeaderboardFn } from '../lib/examFunctions'
import { createAttempt, scoreAttempt } from '../lib/practiceEngine'
import {
  subscribeToAttempts, addRemoteAttempt, addLocalAttempt,
  loadActive, saveActive, clearActive,
  loadPosted, savePosted, clearPosted,
} from '../lib/examStorage'

// Seeded leaderboard — used as fallback while Firestore data loads or if empty.
// Part A rendered these directly; Part B replaces with a real Firestore subscription.
export const SEED_LEADERBOARD = [
  { handle: 'agentsmith', score: 97, date: '2026-05-21', anon: false },
  { handle: 'mcp_maxine', score: 95, date: '2026-05-19', anon: false },
  { handle: 'Anonymous', score: 93, date: '2026-05-24', anon: true },
  { handle: 'promptwright', score: 92, date: '2026-05-12', anon: false },
  { handle: 'ctx_window', score: 90, date: '2026-05-18', anon: false },
  { handle: 'haiku_haiku', score: 88, date: '2026-05-20', anon: false },
  { handle: 'Anonymous', score: 87, date: '2026-05-22', anon: true },
  { handle: 'sonnet_dev', score: 85, date: '2026-05-15', anon: false },
  { handle: 'loop_breaker', score: 83, date: '2026-05-23', anon: false },
  { handle: 'tooluse_tia', score: 81, date: '2026-05-11', anon: false },
  { handle: 'ragnar', score: 78, date: '2026-05-17', anon: false },
  { handle: 'cache_control', score: 74, date: '2026-05-16', anon: false },
]

export function bestTimed(attempts) {
  const timed = attempts.filter((a) => a.mode === 'timed')
  if (!timed.length) return null
  return timed.reduce((b, a) => (a.score.pct > b.score.pct ? a : b))
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function useExamAttempts() {
  const { user } = useAuth()
  const [attempts, setAttempts] = useState([])
  const [active, setActive] = useState(() => loadActive())
  const [posted, setPosted] = useState(() => loadPosted())
  // Real Firestore leaderboard (Part B). Null while loading; falls back to SEED_LEADERBOARD.
  const [leaderboard, setLeaderboard] = useState(null)

  // subscribe to completed attempts (local or Firestore)
  useEffect(() => {
    const unsub = subscribeToAttempts(user, setAttempts)
    return unsub
  }, [user])

  // subscribe to real leaderboard from Firestore
  useEffect(() => {
    const ref = collection(db, 'leaderboard')
    const q = query(ref, orderBy('bestScore', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => {
        const data = d.data()
        return {
          handle: data.anonymous ? 'Anonymous' : (data.displayName || 'Anonymous'),
          score: data.bestScore,
          anon: data.anonymous,
          date: data.updatedAt?.toDate?.().toISOString().slice(0, 10) || todayISO(),
          isYou: user?.uid === d.id,
        }
      })
      setLeaderboard(rows.length > 0 ? rows : SEED_LEADERBOARD)
    }, () => {
      // on error (e.g. offline), fall back to seed
      setLeaderboard(SEED_LEADERBOARD)
    })
    return unsub
  }, [user])

  // persist the active attempt on every change (resume-after-refresh)
  useEffect(() => {
    if (active) saveActive(active)
    else clearActive()
  }, [active])

  const discardActive = useCallback(() => setActive(null), [])

  const select = useCallback((i, pos) => {
    setActive((a) => {
      if (!a || a.submitted) return a
      // practice mode locks an answer once chosen (instant feedback)
      if (a.mode === 'practice' && a.answers[i] !== undefined) return a
      return { ...a, answers: { ...a.answers, [i]: pos } }
    })
  }, [])

  const flag = useCallback((i) => {
    setActive((a) => (a ? { ...a, flags: { ...a.flags, [i]: !a.flags[i] } } : a))
  }, [])

  // startAttempt: practice stays client-side; timed goes through the server
  const startAttempt = useCallback(async (mode) => {
    if (mode === 'practice') {
      setActive(createAttempt('practice'))
      return
    }
    // timed mode: call the server to get a session + sanitized questions (no answer key)
    try {
      const { data } = await startExamFn({ mode: 'timed' })
      // Build the active attempt from server-supplied questions.
      // questions[i] = { qid, domain, stem (string), opts: [{ text }] }
      // We store them as "instances" with the same shape the runner expects,
      // but stem/opts are already resolved strings (not array indices).
      const instances = data.questions.map((q, i) => ({
        qid: q.qid,
        domain: q.domain,
        stem: q.stem,
        opts: q.opts, // [{ text }] — no correct field
        _serverResolved: true, // flag so ExamRunner knows not to call renderInstance
      }))
      setActive({
        id: data.sessionId,
        sessionId: data.sessionId,
        mode: 'timed',
        createdAt: Date.now(),
        durationMs: 120 * 60 * 1000,
        instances,
        answers: {},
        flags: {},
        submitted: false,
      })
    } catch (err) {
      console.error('startExam failed', err)
      throw err
    }
  }, [])

  // submit: practice scores client-side; timed calls submitExam on the server
  const submit = useCallback(async () => {
    let record = null
    let currentActive = null
    setActive((a) => {
      currentActive = a
      return a
    })
    if (!currentActive) return null

    if (currentActive.mode === 'practice') {
      // Client-side scoring for practice
      setActive(() => null)
      const score = scoreAttempt(currentActive)
      record = { ...currentActive, submitted: true, submittedAt: Date.now(), score }
      if (user) await addRemoteAttempt(user, record)
      else addLocalAttempt(record)
      return record
    }

    // Timed mode: server-side scoring via submitExam
    try {
      const { data } = await submitExamFn({
        sessionId: currentActive.sessionId,
        answers: currentActive.answers,
      })
      setActive(() => null)
      // data = { score: { pct, pass, perDomain, correct, total }, review: [...] }
      record = {
        ...currentActive,
        submitted: true,
        submittedAt: Date.now(),
        score: data.score,
        review: data.review,
      }
      // Server already persisted the attempt for signed-in users — just update local state
      setAttempts((prev) => [record, ...prev])
      return record
    } catch (err) {
      console.error('submitExam failed', err)
      throw err
    }
  }, [user])

  const postToLeaderboard = useCallback(async (handle, anon) => {
    if (!user) return
    try {
      await postToLeaderboardFn({ displayName: handle || user.displayName || '', anonymous: anon })
      // leaderboard subscription will update automatically via onSnapshot
    } catch (err) {
      console.error('postToLeaderboard failed', err)
      throw err
    }
  }, [user])

  const unpost = useCallback(() => {
    clearPosted()
    setPosted(null)
    // Note: removing from Firestore leaderboard requires a delete callable (Part B follow-up)
    // For now, the local posted state is cleared; the Firestore entry persists until manually removed.
  }, [])

  return {
    attempts,
    active,
    posted,
    leaderboard: leaderboard ?? SEED_LEADERBOARD,
    startAttempt,
    discardActive,
    select,
    flag,
    submit,
    postToLeaderboard,
    unpost,
  }
}
