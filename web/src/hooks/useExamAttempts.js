// web/src/hooks/useExamAttempts.js
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { createAttempt, scoreAttempt } from '../lib/practiceEngine'
import {
  subscribeToAttempts, addRemoteAttempt, addLocalAttempt,
  loadActive, saveActive, clearActive,
  loadPosted, savePosted, clearPosted,
} from '../lib/examStorage'

// Seeded leaderboard — ported from the design's SEED_LEADERBOARD.
// Part A renders these directly; Part B replaces with a Firestore collection.
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

  // subscribe to completed attempts (local or Firestore)
  useEffect(() => {
    const unsub = subscribeToAttempts(user, setAttempts)
    return unsub
  }, [user])

  // persist the active attempt on every change (resume-after-refresh)
  useEffect(() => {
    if (active) saveActive(active)
    else clearActive()
  }, [active])

  const startAttempt = useCallback((mode) => {
    setActive(createAttempt(mode))
  }, [])

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

  // returns the completed attempt record (so the screen can show results)
  const submit = useCallback(async () => {
    let record = null
    setActive((a) => {
      if (!a) return a
      const score = scoreAttempt(a)
      record = { ...a, submitted: true, submittedAt: Date.now(), score }
      return null
    })
    if (!record) return null
    if (user) await addRemoteAttempt(user, record)
    else addLocalAttempt(record)
    return record
  }, [user])

  const postToLeaderboard = useCallback((handle, anon) => {
    const best = bestTimed(attempts)
    if (!best) return
    const entry = {
      score: best.score.pct,
      handle: anon ? 'Anonymous' : handle || user?.displayName || user?.email || 'you',
      anon,
      date: todayISO(),
    }
    savePosted(entry)
    setPosted(entry)
  }, [attempts, user])

  const unpost = useCallback(() => {
    clearPosted()
    setPosted(null)
  }, [])

  return {
    attempts, active, posted,
    startAttempt, discardActive, select, flag, submit,
    postToLeaderboard, unpost,
  }
}
