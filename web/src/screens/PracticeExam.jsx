// web/src/screens/PracticeExam.jsx
// Practice Exam hub controller. Ported from
// docs/superpowers/specs/practice-exam-design/practice-screen.jsx (ScreenPractice),
// using real auth (useAuth) and real persistence (useExamAttempts).
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useExamAttempts, bestTimed, SEED_LEADERBOARD } from '../hooks/useExamAttempts'
import { DOMAINS } from '../data/index'
import PracticeHub from '../components/practice/PracticeHub'
import ExamRunner from '../components/practice/ExamRunner'
import ResultsReview from '../components/practice/ResultsReview'
import HistoryView from '../components/practice/HistoryView'
import LeaderboardView from '../components/practice/LeaderboardView'
import PostModal from '../components/practice/PostModal'

function emptyPerDomain() {
  const pd = {}
  DOMAINS.forEach((d) => (pd[d.id] = { correct: 0, total: 0 }))
  return pd
}

export default function PracticeExam() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const ex = useExamAttempts()
  const { attempts, active, posted } = ex

  const [sub, setSub] = useState('hub') // hub | runner | results | history | leaderboard
  const [review, setReview] = useState(null)
  const [current, setCurrent] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [postOpen, setPostOpen] = useState(false)

  // route to runner whenever an attempt is active
  useEffect(() => {
    if (active && !active.submitted) {
      setSub('runner')
      setCurrent(0)
    }
  }, [active?.id])

  // timed countdown + auto-submit
  useEffect(() => {
    if (!active || active.mode !== 'timed' || active.submitted) return
    const id = setInterval(() => {
      const left = Math.ceil((active.createdAt + active.durationMs - Date.now()) / 1000)
      setNow(Date.now())
      if (left <= 0) {
        clearInterval(id)
        doSubmit()
      }
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id])

  const secondsLeft =
    active && active.mode === 'timed'
      ? Math.max(0, Math.ceil((active.createdAt + active.durationMs - now) / 1000))
      : null

  const stats = useMemo(() => {
    if (!attempts.length)
      return { attempts: 0, best: 0, bestPass: false, last: null, perDomain: emptyPerDomain() }
    const best = attempts.reduce((b, a) => (a.score.pct > b.score.pct ? a : b))
    const last = attempts.slice().sort((a, b) => b.submittedAt - a.submittedAt)[0]
    return {
      attempts: attempts.length,
      best: best.score.pct,
      bestPass: best.score.pass,
      last: last.score.pct,
      perDomain: best.score.perDomain,
    }
  }, [attempts])

  const board = useMemo(() => {
    const seed = SEED_LEADERBOARD.map((e) => ({ ...e }))
    let all = seed
    if (posted) all = [...seed, { ...posted, isYou: true }]
    all.sort((a, b) => b.score - a.score || new Date(a.date) - new Date(b.date))
    return all
  }, [posted])

  const yourBest = useMemo(() => {
    const b = bestTimed(attempts)
    return b ? b.score.pct : null
  }, [attempts])

  // ---- actions ----
  function handleStart(mode) {
    if (mode === 'timed' && !user) {
      navigate('/profile') // timed mode is sign-in gated; send to the real auth screen
      return
    }
    ex.startAttempt(mode)
  }
  async function doSubmit() {
    const record = await ex.submit()
    if (record) {
      setReview(record)
      setSub('results')
    } else {
      setSub('hub')
    }
  }
  function handleSubmit() {
    if (!active) return
    const unanswered = active.instances.length - Object.keys(active.answers).length
    if (unanswered > 0 && active.mode === 'timed') {
      if (!window.confirm(`${unanswered} question(s) are unanswered. Submit anyway?`)) return
    }
    doSubmit()
  }
  function handleExit() {
    if (window.confirm('Exit and discard this attempt? Your progress will be lost.')) {
      ex.discardActive()
      setSub('hub')
    }
  }

  // ---- runner is full-focus ----
  if (sub === 'runner' && active) {
    return (
      <div className="screen pe-screen pe-screen-runner">
        <ExamRunner
          attempt={active}
          current={current}
          secondsLeft={secondsLeft}
          onSelect={(pos) => ex.select(current, pos)}
          onFlag={() => ex.flag(current)}
          onNav={(i) => setCurrent(i)}
          onPrev={() => setCurrent((c) => Math.max(0, c - 1))}
          onNext={() => setCurrent((c) => Math.min(active.instances.length - 1, c + 1))}
          onSubmit={handleSubmit}
          onExit={handleExit}
        />
      </div>
    )
  }

  return (
    <div className="screen pe-screen">
      <div className="pe-subnav">
        <div className="pe-tabs">
          {[
            { id: 'hub', label: 'Overview' },
            { id: 'history', label: 'History' },
            { id: 'leaderboard', label: 'Leaderboard' },
          ].map((tb) => (
            <button
              key={tb.id}
              className={`pe-tab ${sub === tb.id || (sub === 'results' && tb.id === 'hub') ? 'is-active' : ''}`}
              onClick={() => setSub(tb.id)}
            >
              {tb.label}
            </button>
          ))}
        </div>
        <div className="pe-auth">
          {user ? (
            <span className="pe-auth-who">
              <span className="pe-auth-dot" />
              {user.displayName || user.email}
            </span>
          ) : (
            <button className="ghost-btn-sm" onClick={() => navigate('/profile')}>Sign in</button>
          )}
        </div>
      </div>

      {sub === 'hub' ? (
        <PracticeHub
          stats={stats}
          signedIn={!!user}
          user={user}
          onStart={handleStart}
          onSignIn={() => navigate('/profile')}
          onGoto={(v) => setSub(v)}
        />
      ) : null}

      {sub === 'results' && review ? (
        <ResultsReview
          attempt={review}
          posted={posted}
          onPost={() => setPostOpen(true)}
          onRetake={() => handleStart(review.mode)}
          onHome={() => setSub('hub')}
          onLeaderboard={() => setSub('leaderboard')}
        />
      ) : null}

      {sub === 'history' ? (
        <HistoryView
          attempts={attempts}
          onOpen={(a) => { setReview(a); setSub('results') }}
          onStart={() => setSub('hub')}
        />
      ) : null}

      {sub === 'leaderboard' ? (
        <LeaderboardView
          board={board}
          you={posted}
          yourBest={yourBest}
          onOpenPost={() => setPostOpen(true)}
          onUnpost={() => { if (window.confirm('Remove your score from the leaderboard?')) ex.unpost() }}
        />
      ) : null}

      {postOpen ? (
        <PostModal
          score={yourBest}
          defaultHandle={posted?.handle && posted.handle !== 'Anonymous' ? posted.handle : (user?.displayName || '')}
          defaultAnon={posted?.anon || false}
          onClose={() => setPostOpen(false)}
          onPost={(handle, anon) => { ex.postToLeaderboard(handle, anon); setPostOpen(false); setSub('leaderboard') }}
        />
      ) : null}
    </div>
  )
}
