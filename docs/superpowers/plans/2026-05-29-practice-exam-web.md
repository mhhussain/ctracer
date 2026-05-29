# Practice Exam (Web) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the CCA-F **Practice Exam** feature in the `web/` React app — a hub with Timed Exam + Practice modes over a shared 60-question domain-weighted bank, results/review, attempt history, and an opt-in global leaderboard — matching the committed Claude Design prototype, responsive down to phone widths.

**Architecture:** Two parts.
- **Part A — Web client (this can be executed by a standard model).** A faithful port of the Claude Design prototype into the real app's architecture (React Router, `useAuth`, the storage abstraction, Vitest). Both modes score **client-side** in Part A so the entire UI works end-to-end, is testable, and ships standalone. Leaderboard uses the seeded board + a locally-stored "posted" entry (exactly like the prototype).
- **Part B — Firebase Functions hardening (⚠️ USE A HIGHER-POWERED MODEL FOR ALL OF PART B).** Adds `functions/` with three callables (`startExam`, `submitExam`, `postToLeaderboard`), moves the timed answer key off the client (the timed content set lives only in `functions/practiceBank.js`), and replaces the seeded leaderboard with a real Firestore collection. Requires the Firebase **Blaze** plan (the maintainer enables this manually).

> **Mode-split content (answer-key isolation).** Per the spec's Question Model, each question has two **disjoint** content sets: a `practice` set (1–2 stem/phrasing wordings, distinct strings) shipped in the client at `web/src/data/practiceQuestions.js`, and a `timed` set (2–3 wordings) that lives **only** server-side in `functions/practiceBank.js` and is never imported by the web build. Practice mode renders the practice set client-side; timed mode renders the server-supplied set (answer key stripped). This is why the client file in Task 1 contains **only** practice wordings, and the server bank in Task 10 contains the **timed** wordings — they must never co-locate.

**Tech Stack:** Vite + React 19, react-router-dom, Firebase JS SDK (Auth + Firestore + Functions), Vitest + React Testing Library, plain CSS (single design system in `web/src/index.css`).

---

## Source Material (already committed to this repo)

The Claude Design prototype source is committed at **`docs/superpowers/specs/practice-exam-design/`**. You will port from these files — read them before each port task:

| File | What it is |
|---|---|
| `practice-data.js` | Question-bank generator + attempt logic (`createAttempt`, `renderInstance`, `scoreAttempt`). Prototype uses `window.CCA_PRACTICE`. |
| `practice-core.jsx` | Presentational atoms (`PScoreRing`, `PTimer`, `PDomainBars`, `POptionCard`, `PProgressGrid`, `DomainChip`) + `PracticeHub` + `ExamRunner`. |
| `practice-flow.jsx` | `ResultsReview`, `HistoryView`, `Sparkline`, `LeaderboardView`, and the prototype's `usePracticeState` (localStorage). |
| `practice-screen.jsx` | `ScreenPractice` controller (sub-view routing, timer, modals). |
| `practice.css` | All Practice Exam styles. Reuses existing tokens; only adds `--fail` / `--fail-soft`. |
| `screens/m-runner.png`, `screens/m-rest.png` | Mobile responsive reference screenshots. |

The spec this implements: **`docs/superpowers/specs/2026-05-29-practice-exam-design.md`** (source of truth).

### Prototype → real-app translation (applies to EVERY port task)

The prototype attaches everything to `window`. The real app uses ES modules. When porting, apply these substitutions:

| Prototype | Real app |
|---|---|
| `window.CCA_DATA.DOMAINS` | `import { DOMAINS } from '../data/index'` (or `../../data/index` from `components/practice/`) |
| `window.CCA_PRACTICE.PASS_PCT` etc. | `import { PASS_PCT, DURATION_MIN } from '../data/practiceQuestions'` |
| `window.CCA_PRACTICE.createAttempt` / `renderInstance` / `scoreAttempt` / `questionById` | `import { ... } from '../lib/practiceEngine'` |
| `Object.assign(window, { Foo })` global defs | `export default function Foo(...)` / `export function foo(...)` |
| Components referencing siblings via `window.Foo` | `import Foo from './Foo'` |
| Mock `usePracticeState` sign-in / `st.user` | real `useAuth()` from `../hooks/useAuth` |
| `SignInModal` (mock handle) | **delete it** — gate on real `useAuth().user`; "Sign in" actions `navigate('/profile')` |
| `.pe-mobile` device-frame class | **drop it** — responsiveness comes from the `@media (max-width: 820px)` block already in `practice.css` |
| `const { useState: usePS } = React` aliases | normal `import { useState, useEffect, useRef } from 'react'` |

---

## File Structure (Part A)

```
web/src/
  data/
    practiceQuestions.js        # CREATE — placeholder bank (PRACTICE content only) + lookup (PASS_PCT, DURATION_MIN, BLUEPRINT, BANK, questionById)
    practiceQuestions.test.js   # CREATE
  lib/
    practiceEngine.js           # CREATE — pure: shuffle, createAttempt, renderInstance, scoreAttempt
    practiceEngine.test.js      # CREATE
    examStorage.js              # CREATE — attempts + active + posted persistence (localStorage / Firestore)
    examStorage.test.js         # CREATE
  hooks/
    useExamAttempts.js          # CREATE — auth-aware attempts state + actions
  components/practice/          # CREATE dir — cohesive feature components
    ScoreRing.jsx
    Timer.jsx
    DomainBars.jsx
    OptionCard.jsx
    ProgressGrid.jsx
    DomainChip.jsx
    Sparkline.jsx
    PracticeHub.jsx
    ExamRunner.jsx
    ResultsReview.jsx
    HistoryView.jsx
    LeaderboardView.jsx
    PostModal.jsx
  screens/
    PracticeExam.jsx            # CREATE — controller (sub-view routing, timer, modals)
    PracticeExam.test.jsx       # CREATE
  styles/
    practice.css                # CREATE — ported from design practice.css
  App.jsx                       # MODIFY — add /practice-exam route
  main.jsx                      # MODIFY — import './styles/practice.css'
  components/Sidebar.jsx        # MODIFY — add Practice Exam to PREP_ITEMS
  components/PageTopbar.jsx     # MODIFY — add /practice-exam to ROUTE_META
```

---

# PART A — Web Client

## Task 1: Placeholder question bank — PRACTICE content only (`practiceQuestions.js`)

Port the bank generator from `docs/superpowers/specs/practice-exam-design/practice-data.js` into an ES module, but include **only the `practice` content set** (1–2 wordings per stem and per option). The `timed` set is authored separately in `functions/practiceBank.js` (Task 10) and must **never** appear in this client file — that is the whole point of the mode split. The real `DOMAINS` (in `web/src/data/index.js`) already has the exact shape the generator needs: `id` (`"d1"`–`"d5"`), `num`, `short`, `color`, and `topics: [{ name, desc }]`.

> The client question shape here uses plain phrasing arrays (`text: [practice wordings]`) — i.e. the practice-only projection of the canonical `{ practice, timed }` model in the spec. The engine (Task 2) operates on these arrays unchanged.

**Files:**
- Create: `web/src/data/practiceQuestions.js`
- Test: `web/src/data/practiceQuestions.test.js`

- [ ] **Step 1: Write the failing test**

```js
// web/src/data/practiceQuestions.test.js
import { describe, it, expect } from 'vitest'
import { BANK, BLUEPRINT, PASS_PCT, DURATION_MIN, questionById } from './practiceQuestions'

describe('practiceQuestions bank', () => {
  it('exposes exam constants', () => {
    expect(PASS_PCT).toBe(72)
    expect(DURATION_MIN).toBe(120)
    expect(BLUEPRINT).toEqual({ d1: 16, d2: 12, d3: 12, d4: 11, d5: 9 })
  })

  it('builds a 60-question bank weighted to the blueprint', () => {
    expect(BANK).toHaveLength(60)
    for (const [domain, count] of Object.entries(BLUEPRINT)) {
      expect(BANK.filter((q) => q.domain === domain)).toHaveLength(count)
    }
  })

  it('gives every question 4 options with exactly one correct', () => {
    for (const q of BANK) {
      expect(q.options).toHaveLength(4)
      expect(q.options.filter((o) => o.correct)).toHaveLength(1)
      // practice options carry 1-2 interchangeable phrasings (timed set lives server-side)
      for (const o of q.options) {
        expect(Array.isArray(o.text)).toBe(true)
        expect(o.text.length).toBeGreaterThanOrEqual(1)
        expect(o.text.length).toBeLessThanOrEqual(2)
      }
    }
  })

  it('looks up questions by id', () => {
    expect(questionById(BANK[0].id)).toBe(BANK[0])
    expect(questionById('nope')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm run test -- src/data/practiceQuestions.test.js`
Expected: FAIL — `Failed to resolve import "./practiceQuestions"`.

- [ ] **Step 3: Write the implementation**

```js
// web/src/data/practiceQuestions.js
// CCA-F Practice Exam — placeholder question bank (PRACTICE content set ONLY).
// Ported from docs/superpowers/specs/practice-exam-design/practice-data.js.
// Placeholder content; ~100 real questions supplied later by the maintainer.
//
// ⚠️ ANSWER-KEY ISOLATION: this file holds ONLY the `practice` wordings (1-2 per
// stem/option). The `timed` content set + answer key live exclusively in
// functions/practiceBank.js (Task 10) and must never be imported here, so the
// timed answer key never ships in the web bundle.
import { DOMAINS } from './index'

export const PASS_PCT = 72
export const DURATION_MIN = 120
// Blueprint weighting — must total 60.
export const BLUEPRINT = { d1: 16, d2: 12, d3: 12, d4: 11, d5: 9 }

// ---- PRACTICE phrasing pools (1-2 equivalent variants shown at random) ----
const CORRECT_POOL = [
  [
    'Apply the documented best-practice pattern and validate before continuing.',
    'Use the recommended pattern, then verify the output.',
  ],
  [
    'Use the recommended approach with explicit error handling and a fallback.',
    'Handle errors explicitly and add a fallback path.',
  ],
  [
    'Right-size the model for the step and constrain output to a schema.',
    'Match the model tier to the task and enforce an output schema.',
  ],
]
const DISTRACTOR_POOL = [
  ['Skip validation and trust the first response.'],
  [
    'Use the most expensive model tier for every step.',
    'Default to the top-tier model everywhere.',
  ],
  ['Cram all context into one unstructured prompt.'],
  [
    'Retry indefinitely with no backoff.',
    'Loop forever on failure with no exit.',
  ],
  ['Ignore returned errors and proceed.'],
  ['Hard-code the behavior and ignore edge cases.'],
]

function pick(arr, n) {
  // return n distinct random elements
  const copy = arr.slice()
  const out = []
  for (let i = 0; i < n && copy.length; i++) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0])
  }
  return out
}

// PRACTICE stems only (1-2 wordings). Timed stems are authored server-side.
function stemVariants(topic) {
  const t = topic.name.toLowerCase()
  return [
    `Which approach best handles ${t} in a production Claude system?`,
    `A team is implementing ${t}. What is the recommended pattern?`,
  ]
}

// ---- build a stable bank ----
let qCounter = 0
export const BANK = []
DOMAINS.forEach((d) => {
  const count = BLUEPRINT[d.id]
  for (let i = 0; i < count; i++) {
    const topic = d.topics[i % d.topics.length]
    const correct = CORRECT_POOL[(qCounter + i) % CORRECT_POOL.length]
    const distractors = pick(DISTRACTOR_POOL, 3)
    const options = [
      { correct: true, text: correct },
      ...distractors.map((dd) => ({ correct: false, text: dd })),
    ]
    BANK.push({
      id: `q${++qCounter}`,
      domain: d.id,
      topicName: topic.name,
      stem: stemVariants(topic),
      options,
      explanation:
        `Placeholder explanation — the correct choice applies the “${topic.name}” best practice from Domain ${d.num}; ` +
        `the distractors are common anti-patterns. Full rationale will be added with the real question content.`,
    })
  }
})

export function questionById(id) {
  return BANK.find((q) => q.id === id)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npm run test -- src/data/practiceQuestions.test.js`
Expected: PASS (4 tests).

> NOTE on `topics`: confirm each domain in `web/src/data/index.js` has a non-empty `topics` array of `{ name, desc }`. It does today (lines ~32, 67, 104, 142, 179). `stemVariants` reads `topic.name` and `topic.desc`.

- [ ] **Step 5: Commit**

```bash
git add web/src/data/practiceQuestions.js web/src/data/practiceQuestions.test.js
git commit -m "feat: add placeholder practice-exam question bank"
```

---

## Task 2: Practice engine (`practiceEngine.js`)

Pure attempt logic ported from the same prototype file. An **attempt** freezes a shuffled question order, and per question freezes a random stem index, a shuffled option order, and a random phrasing index per option — so re-renders are stable. `renderInstance` resolves an instance to display text; `scoreAttempt` computes overall % + per-domain breakdown.

**Files:**
- Create: `web/src/lib/practiceEngine.js`
- Test: `web/src/lib/practiceEngine.test.js`

- [ ] **Step 1: Write the failing test**

```js
// web/src/lib/practiceEngine.test.js
import { describe, it, expect } from 'vitest'
import { createAttempt, renderInstance, scoreAttempt } from './practiceEngine'
import { questionById, PASS_PCT } from '../data/practiceQuestions'

describe('practiceEngine', () => {
  it('creates a 60-instance attempt with empty answers/flags', () => {
    const a = createAttempt('practice')
    expect(a.mode).toBe('practice')
    expect(a.instances).toHaveLength(60)
    expect(a.answers).toEqual({})
    expect(a.flags).toEqual({})
    expect(a.submitted).toBe(false)
    expect(a.durationMs).toBeNull()
  })

  it('sets a 120-minute duration for timed attempts', () => {
    const a = createAttempt('timed')
    expect(a.durationMs).toBe(120 * 60 * 1000)
  })

  it('renders an instance to a stem, 4 option texts, and explanation', () => {
    const a = createAttempt('practice')
    const r = renderInstance(a.instances[0])
    expect(typeof r.stem).toBe('string')
    expect(r.opts).toHaveLength(4)
    expect(r.opts.filter((o) => o.correct)).toHaveLength(1)
    r.opts.forEach((o) => expect(typeof o.text).toBe('string'))
    expect(typeof r.explanation).toBe('string')
  })

  it('scores a fully-correct attempt at 100% and passing', () => {
    const a = createAttempt('practice')
    a.instances.forEach((inst, i) => {
      // choose the display position whose original option is correct
      const correctPos = inst.optOrder.findIndex(
        (origIdx) => questionById(inst.qid).options[origIdx].correct,
      )
      a.answers[i] = correctPos
    })
    const s = scoreAttempt(a)
    expect(s.correct).toBe(60)
    expect(s.total).toBe(60)
    expect(s.pct).toBe(100)
    expect(s.pass).toBe(true)
    expect(s.pct >= PASS_PCT).toBe(true)
    // per-domain totals sum to 60
    const totals = Object.values(s.perDomain).reduce((n, d) => n + d.total, 0)
    expect(totals).toBe(60)
  })

  it('scores an all-wrong attempt at 0% and failing', () => {
    const a = createAttempt('practice')
    a.instances.forEach((inst, i) => {
      const correctPos = inst.optOrder.findIndex(
        (origIdx) => questionById(inst.qid).options[origIdx].correct,
      )
      a.answers[i] = (correctPos + 1) % 4
    })
    const s = scoreAttempt(a)
    expect(s.pct).toBe(0)
    expect(s.pass).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm run test -- src/lib/practiceEngine.test.js`
Expected: FAIL — cannot resolve `./practiceEngine`.

- [ ] **Step 3: Write the implementation**

```js
// web/src/lib/practiceEngine.js
// Pure attempt logic for the Practice Exam.
// Ported from docs/superpowers/specs/practice-exam-design/practice-data.js.
import { BANK, questionById, DURATION_MIN } from '../data/practiceQuestions'
import { DOMAINS } from '../data/index'

const PASS_PCT = 72

export function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Create an attempt: pick the full domain-weighted set (the bank IS the
// weighted 60), freeze a random phrasing + option order per question so
// re-renders stay stable.
export function createAttempt(mode) {
  const order = shuffle(BANK)
  const instances = order.map((q) => {
    const optOrder = shuffle(q.options.map((_, i) => i))
    return {
      qid: q.id,
      domain: q.domain,
      stemIdx: Math.floor(Math.random() * q.stem.length),
      optOrder, // display position -> original option index
      phraseIdx: q.options.map((o) => Math.floor(Math.random() * o.text.length)),
    }
  })
  return {
    id: `a${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    mode, // "timed" | "practice"
    createdAt: Date.now(),
    durationMs: mode === 'timed' ? DURATION_MIN * 60 * 1000 : null,
    instances,
    answers: {}, // instanceIndex -> displayPosition selected
    flags: {}, // instanceIndex -> bool
    submitted: false,
  }
}

// Resolve a display instance to renderable text.
export function renderInstance(inst) {
  const q = questionById(inst.qid)
  const opts = inst.optOrder.map((origIdx) => {
    const o = q.options[origIdx]
    return {
      origIdx,
      correct: o.correct,
      text: o.text[inst.phraseIdx[origIdx] % o.text.length],
    }
  })
  return { q, stem: q.stem[inst.stemIdx], opts, explanation: q.explanation }
}

export function scoreAttempt(attempt) {
  let correct = 0
  const perDomain = {}
  DOMAINS.forEach((d) => (perDomain[d.id] = { correct: 0, total: 0 }))
  attempt.instances.forEach((inst, idx) => {
    perDomain[inst.domain].total++
    const sel = attempt.answers[idx]
    if (sel === undefined) return
    const origIdx = inst.optOrder[sel]
    const q = questionById(inst.qid)
    if (q.options[origIdx].correct) {
      correct++
      perDomain[inst.domain].correct++
    }
  })
  const total = attempt.instances.length
  const pct = Math.round((correct / total) * 100)
  return { correct, total, pct, pass: pct >= PASS_PCT, perDomain }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npm run test -- src/lib/practiceEngine.test.js`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/practiceEngine.js web/src/lib/practiceEngine.test.js
git commit -m "feat: add practice-exam attempt engine"
```

---

## Task 3: Attempt & leaderboard storage (`examStorage.js`)

Persistence that mirrors the app's existing storage strategy (see `web/src/lib/storage.js`): **localStorage** when signed-out, **Firestore** when signed-in. Three concerns:

1. **Completed attempts** — signed-in: Firestore subcollection `users/{uid}/exam_attempts`; signed-out: localStorage array (practice attempts only, per spec).
2. **Active attempt** — transient resume-after-refresh; always localStorage.
3. **Posted leaderboard entry** — Part A keeps this locally (the real Firestore leaderboard is Part B); always localStorage.

> Why a new module instead of extending `progress.js`: attempts are a growing list, not the single fixed-shape progress doc. The spec's Firestore shape (`users/{uid}/exam_attempts/{attemptId}`) is a subcollection. Keeping it separate keeps both files focused.

**Files:**
- Create: `web/src/lib/examStorage.js`
- Test: `web/src/lib/examStorage.test.js`

- [ ] **Step 1: Write the failing test** (covers the signed-out localStorage paths — Firestore paths are exercised by the hook test against the emulator in Part B)

```js
// web/src/lib/examStorage.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadLocalAttempts, addLocalAttempt,
  loadActive, saveActive, clearActive,
  loadPosted, savePosted, clearPosted,
  clearExamStorage,
} from './examStorage'

describe('examStorage (signed-out / localStorage)', () => {
  beforeEach(() => clearExamStorage())

  it('starts with no attempts', () => {
    expect(loadLocalAttempts()).toEqual([])
  })

  it('prepends added attempts (newest first)', () => {
    addLocalAttempt({ id: 'a1', score: { pct: 50 } })
    addLocalAttempt({ id: 'a2', score: { pct: 80 } })
    const all = loadLocalAttempts()
    expect(all.map((a) => a.id)).toEqual(['a2', 'a1'])
  })

  it('round-trips the active attempt and clears it', () => {
    expect(loadActive()).toBeNull()
    saveActive({ id: 'live', mode: 'timed' })
    expect(loadActive().id).toBe('live')
    clearActive()
    expect(loadActive()).toBeNull()
  })

  it('round-trips the posted leaderboard entry and clears it', () => {
    expect(loadPosted()).toBeNull()
    savePosted({ score: 88, handle: 'me', anon: false, date: '2026-05-29' })
    expect(loadPosted().score).toBe(88)
    clearPosted()
    expect(loadPosted()).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm run test -- src/lib/examStorage.test.js`
Expected: FAIL — cannot resolve `./examStorage`.

- [ ] **Step 3: Write the implementation**

```js
// web/src/lib/examStorage.js
// Practice Exam persistence. Mirrors the local-vs-Firestore strategy in storage.js.
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from './firebase'

const ATTEMPTS_KEY = 'ctracer_exam_attempts'
const ACTIVE_KEY = 'ctracer_exam_active'
const POSTED_KEY = 'ctracer_exam_posted'

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}
function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // quota / private browsing — in-memory state still holds for the session
  }
}

// ---- completed attempts ----
export function loadLocalAttempts() {
  return readJSON(ATTEMPTS_KEY, [])
}
export function addLocalAttempt(attempt) {
  const all = [attempt, ...loadLocalAttempts()]
  writeJSON(ATTEMPTS_KEY, all)
  return all
}

// Signed-in: live subscription to the user's exam_attempts subcollection.
export function subscribeToAttempts(user, callback) {
  if (!user) {
    callback(loadLocalAttempts())
    return () => {}
  }
  const ref = collection(db, 'users', user.uid, 'exam_attempts')
  const q = query(ref, orderBy('submittedAt', 'desc'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

// Signed-in: persist a completed attempt to Firestore.
// (In Part B, TIMED attempts are written server-side by submitExam instead.)
export async function addRemoteAttempt(user, attempt) {
  const ref = collection(db, 'users', user.uid, 'exam_attempts')
  await addDoc(ref, attempt)
}

// ---- active (in-progress) attempt: always local, transient ----
export function loadActive() {
  return readJSON(ACTIVE_KEY, null)
}
export function saveActive(attempt) {
  writeJSON(ACTIVE_KEY, attempt)
}
export function clearActive() {
  localStorage.removeItem(ACTIVE_KEY)
}

// ---- posted leaderboard entry: local in Part A (Firestore in Part B) ----
export function loadPosted() {
  return readJSON(POSTED_KEY, null)
}
export function savePosted(entry) {
  writeJSON(POSTED_KEY, entry)
}
export function clearPosted() {
  localStorage.removeItem(POSTED_KEY)
}

export function clearExamStorage() {
  localStorage.removeItem(ATTEMPTS_KEY)
  localStorage.removeItem(ACTIVE_KEY)
  localStorage.removeItem(POSTED_KEY)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npm run test -- src/lib/examStorage.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/examStorage.js web/src/lib/examStorage.test.js
git commit -m "feat: add practice-exam storage (attempts, active, posted)"
```

---

## Task 4: `useExamAttempts` hook + seeded leaderboard

Auth-aware state for the screen: subscribes to attempts (local or Firestore), persists the active attempt, exposes attempt actions (`select`, `flag`, `submit`, `discard`), and the local leaderboard `post`/`unpost`. Mirrors the prototype's `usePracticeState` but uses the real auth + storage. Also defines the **seeded leaderboard** (ported from `practice-data.js` `SEED_LEADERBOARD`) used in Part A.

**Files:**
- Create: `web/src/hooks/useExamAttempts.js`

- [ ] **Step 1: Write the implementation** (no separate unit test — exercised via `PracticeExam.test.jsx` in Task 8; this hook is thin glue over already-tested modules)

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add web/src/hooks/useExamAttempts.js
git commit -m "feat: add useExamAttempts hook and seeded leaderboard"
```

---

## Task 5: Practice Exam styles (`styles/practice.css`)

Port the prototype stylesheet. It reuses tokens already defined in `web/src/index.css` (`--surface*`, `--border*`, `--accent*`, `--ok*`, `--warn*`, `--radius*`, `--gap`, `--font-mono`, `--font-ui`, `--text-2/3`); it only **adds** `--fail` / `--fail-soft`.

**Files:**
- Create: `web/src/styles/practice.css`
- Modify: `web/src/main.jsx`

- [ ] **Step 1: Copy the stylesheet**

Copy `docs/superpowers/specs/practice-exam-design/practice.css` verbatim to `web/src/styles/practice.css`, then **delete the `.pe-mobile` block** (lines ~444–479 — the device-frame-only rules under the "Mobile layout" header, every selector starting `.pe-mobile`). Keep the `@media (max-width: 820px)` block immediately after it — that is what drives real responsiveness. The top-of-file `:root { --fail … }` and `:root[data-theme="light"] { --fail … }` blocks stay.

- [ ] **Step 2: Import it globally**

In `web/src/main.jsx`, add directly below the existing `import './index.css'`:

```js
import './styles/practice.css'
```

- [ ] **Step 3: Verify the app still builds**

Run: `cd web && npm run build`
Expected: build succeeds (no CSS parse errors).

- [ ] **Step 4: Commit**

```bash
git add web/src/styles/practice.css web/src/main.jsx
git commit -m "feat: add practice-exam stylesheet"
```

---

## Task 6: Presentational components (atoms + sub-views)

Port the presentational pieces into `web/src/components/practice/`, one file per component, applying the **Prototype → real-app translation** table from the top of this plan. These are near-mechanical ports — read the named source file/lines, copy the function body, fix imports.

> All of these are presentational (props in, JSX out). Keep them prop-driven exactly as in the prototype. The only structural change is to `ExamRunner` (Step note below).

**Files (create each):**

- [ ] **Step 1: Atoms from `practice-core.jsx`**
  - `components/practice/ScoreRing.jsx` ← `PScoreRing` (lines 15–40). `export default function ScoreRing(...)`.
  - `components/practice/Timer.jsx` ← `PTimer` + `fmtClock` (lines 7–13, 42–52). Export `fmtClock` named, `Timer` default.
  - `components/practice/DomainBars.jsx` ← `PDomainBars` (lines 54–76). Replace `window.CCA_DATA` with `import { DOMAINS } from '../../data/index'`.
  - `components/practice/OptionCard.jsx` ← `POptionCard` (lines 78–93).
  - `components/practice/ProgressGrid.jsx` ← `PProgressGrid` (lines 95–115).
  - `components/practice/DomainChip.jsx` ← `DomainChip` (lines 324–331). Replace `window.CCA_DATA.DOMAINS` with `import { DOMAINS } from '../../data/index'`.

- [ ] **Step 2: Sub-views from `practice-core.jsx` / `practice-flow.jsx`**
  - `components/practice/PracticeHub.jsx` ← `PracticeHub` (core 119–208). Replace `window.CCA_PRACTICE.PASS_PCT` with `import { PASS_PCT } from '../../data/practiceQuestions'`; `import DomainBars from './DomainBars'`.
  - `components/practice/Sparkline.jsx` ← `Sparkline` (flow 237–256).
  - `components/practice/HistoryView.jsx` ← `HistoryView` + `fmtDate` (flow 193–235). `import Sparkline from './Sparkline'`; replace `window.CCA_PRACTICE.PASS_PCT` with the import.
  - `components/practice/LeaderboardView.jsx` ← `LeaderboardView` + `fmtDate2` (flow 260–330).
  - `components/practice/ResultsReview.jsx` ← `ResultsReview` (flow 89–189). Imports: `import { PASS_PCT } from '../../data/practiceQuestions'` (replace `P.PASS_PCT` usages), `import { renderInstance } from '../../lib/practiceEngine'` (replace `P.renderInstance`), `import { DOMAINS } from '../../data/index'`, `import ScoreRing from './ScoreRing'`, `import DomainBars from './DomainBars'`, `import DomainChip from './DomainChip'`. Keep `useState` for the filter.

- [ ] **Step 3: `ExamRunner.jsx` (with one structural change)** ← `ExamRunner` (core 212–322).
  Port it, then make these adaptations:
  - Imports: `import { useState } from 'react'`, `import { renderInstance } from '../../lib/practiceEngine'`, `import Timer from './Timer'`, `import OptionCard from './OptionCard'`, `import ProgressGrid from './ProgressGrid'`, `import DomainChip from './DomainChip'`.
  - Replace `const P = window.CCA_PRACTICE; const r = P.renderInstance(inst)` with `const r = renderInstance(inst)`.
  - Replace the inlined `<button className="pe-opt …">` map with `<OptionCard .../>` (the prototype already uses `POptionCard` — just rename to `OptionCard`). Keep `optState`, `correctPos`, `chosenCorrect` exactly as written.
  - In Part A both modes render from `renderInstance` (client-side), so feedback works for practice and timed is scored client-side on submit. **Part B will rework this** to consume server-supplied questions for timed mode.

- [ ] **Step 4: Sanity check — build**

Run: `cd web && npm run build`
Expected: build succeeds. (These components aren't wired to a route yet — that's Task 7.)

- [ ] **Step 5: Commit**

```bash
git add web/src/components/practice
git commit -m "feat: add practice-exam presentational components"
```

---

## Task 7: `PracticeExam` screen controller + nav wiring

Port `ScreenPractice` (`practice-screen.jsx`) into a real route screen, swapping the mock sign-in for real `useAuth` and the prototype's `usePracticeState` for `useExamAttempts`. Then register the route and nav entries.

**Files:**
- Create: `web/src/screens/PracticeExam.jsx`
- Modify: `web/src/App.jsx`, `web/src/components/Sidebar.jsx`, `web/src/components/PageTopbar.jsx`

- [ ] **Step 1: Write the screen controller**

```jsx
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
```

- [ ] **Step 2: Create `PostModal.jsx`** ← port `PostModal` from `practice-screen.jsx` (lines 269–306). Use `import { useState } from 'react'`. **Do NOT port `SignInModal`** (real auth handles sign-in).

```jsx
// web/src/components/practice/PostModal.jsx
import { useState } from 'react'

export default function PostModal({ score, defaultHandle, defaultAnon, onClose, onPost }) {
  const [handle, setHandle] = useState(defaultHandle || '')
  const [anon, setAnon] = useState(defaultAnon || false)
  return (
    <div className="modal-veil" onClick={onClose}>
      <div className="card modal pe-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pe-modal-head">
          <h2 className="modal-title">Post to leaderboard</h2>
          <button className="x-btn" onClick={onClose}>×</button>
        </div>
        <p className="pe-modal-sub">
          Posting your best timed score (<strong>{score}%</strong>) is opt-in. Choose how you appear — you can remove it anytime.
        </p>
        <label className={`pe-field ${anon ? 'is-disabled' : ''}`}>
          <span className="pe-field-label">Display handle</span>
          <input
            className="pe-input"
            placeholder="your handle"
            value={anon ? '' : handle}
            disabled={anon}
            onChange={(e) => setHandle(e.target.value)}
          />
        </label>
        <label className="pe-toggle">
          <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} />
          <span className="pe-toggle-box" />
          <span>Post as <strong>Anonymous</strong></span>
        </label>
        <div className="pe-modal-foot">
          <button className="ghost-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn" onClick={() => onPost(handle.trim() || 'you', anon)}>
            {anon ? 'Post anonymously →' : 'Post →'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Register the route** in `web/src/App.jsx`. Add the import next to the other screen imports and the route next to `/exam-day`:

```jsx
import PracticeExam from './screens/PracticeExam'
```
```jsx
<Route path="/practice-exam" element={<PracticeExam />} />
```

- [ ] **Step 4: Add the sidebar entry** in `web/src/components/Sidebar.jsx`. Extend `PREP_ITEMS` (currently lines 16–19) so Practice Exam sits in the "Prep finish" group:

```jsx
const PREP_ITEMS = [
  { to: '/concepts', label: 'Key Concepts', glyph: '≡' },
  { to: '/practice-exam', label: 'Practice Exam', glyph: '◆' },
  { to: '/exam-day', label: 'Exam Day', glyph: '★' },
]
```

- [ ] **Step 5: Add the topbar metadata** in `web/src/components/PageTopbar.jsx` `ROUTE_META` (after the `/concepts` line):

```jsx
'/practice-exam': { title: 'Practice Exam', sub: '60 questions · timed or practice · 72% to pass' },
```

- [ ] **Step 6: Manual smoke test**

Run: `cd web && npm run dev`, open http://localhost:5173/practice-exam and verify:
- Hub shows both mode cards; "Practice" starts immediately, "Timed Exam" shows "Sign in to start" while signed-out.
- Start Practice → runner renders Q1 of 60, selecting an option reveals instant feedback + explanation, "Next" advances, "Question map" opens.
- Submit → Results shows score ring, per-domain bars, question-by-question review with filters.
- History tab lists the attempt; Leaderboard tab shows the seeded board.
- Resize the window narrow (<820px) → layouts collapse to single column (compare against `screens/m-runner.png`).

- [ ] **Step 7: Commit**

```bash
git add web/src/screens/PracticeExam.jsx web/src/components/practice/PostModal.jsx web/src/App.jsx web/src/components/Sidebar.jsx web/src/components/PageTopbar.jsx
git commit -m "feat: wire up Practice Exam screen, route, and navigation"
```

---

## Task 8: Screen integration test

**Files:**
- Create: `web/src/screens/PracticeExam.test.jsx`

- [ ] **Step 1: Write the test**

```jsx
// web/src/screens/PracticeExam.test.jsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import PracticeExam from './PracticeExam'
import { AuthProvider } from '../lib/AuthContext'
import { clearExamStorage } from '../lib/examStorage'

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
    await u.click(screen.getByRole('button', { name: /Leaderboard/i }))
    expect(screen.getByText(/No timed score yet/i)).toBeInTheDocument()
    expect(screen.getByText('agentsmith')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test**

Run: `cd web && npm run test -- src/screens/PracticeExam.test.jsx`
Expected: PASS (5 tests). If the `AuthProvider` import path differs, confirm against `web/src/lib/AuthContext.jsx`.

- [ ] **Step 3: Run the full suite + lint**

Run: `cd web && npm run test && npm run lint`
Expected: all green. Fix any lint issues (unused imports from ports are the usual culprit).

- [ ] **Step 4: Commit**

```bash
git add web/src/screens/PracticeExam.test.jsx
git commit -m "test: add Practice Exam screen integration tests"
```

> **End of Part A.** The Practice Exam is fully functional and shippable client-side. Both modes work; attempts persist (localStorage signed-out, Firestore subcollection signed-in); the leaderboard is seeded with a locally-stored opt-in entry. Push and open a PR here if you want Part A reviewed/merged before Part B.

---

# PART B — Firebase Functions Hardening

> ## ⚠️ USE A HIGHER-POWERED MODEL FOR ALL OF PART B
> Part B introduces server-side code, security rules, the Blaze billing plan, the Firebase emulator, and a deploy. It is materially riskier than Part A. Do not execute Part B with a lightweight model.
>
> **Prerequisite (maintainer, manual):** the Firebase project `iammoo-ctracer` must be on the **Blaze** plan before `firebase deploy --only functions` will work. The maintainer has agreed to enable this.

**What Part B changes (and why):** Per the spec, the answer key must never ship to the client for the **timed** exam, and leaderboard scores must not be forgeable. Part B adds three callable functions and moves timed-mode selection/scoring server-side. Practice mode stays client-side (no stakes, must work signed-out).

## Task 9: Scaffold `functions/` and register it

**Files:**
- Create: `functions/package.json`, `functions/index.js`, `functions/.gitignore`
- Modify: `firebase.json`

- [ ] **Step 1: `functions/package.json`**

```json
{
  "name": "ctracer-functions",
  "description": "Practice Exam callable functions (scoped to the practice-exam feature)",
  "engines": { "node": "20" },
  "main": "index.js",
  "type": "module",
  "dependencies": {
    "firebase-admin": "^12.6.0",
    "firebase-functions": "^6.1.0"
  },
  "devDependencies": {
    "firebase-functions-test": "^3.3.0"
  },
  "private": true
}
```

- [ ] **Step 2: `functions/.gitignore`**

```
node_modules/
*.log
.env
```

- [ ] **Step 3: `functions/index.js` placeholder export**

```js
// functions/index.js — Practice Exam callable functions.
import { initializeApp } from 'firebase-admin/app'
initializeApp()

export { startExam } from './startExam.js'
export { submitExam } from './submitExam.js'
export { postToLeaderboard } from './postToLeaderboard.js'
```

(The three modules are created in the next tasks; you can stub them as `export const startExam = () => {}` temporarily to keep `firebase.json` valid, or create Task 10–12 first.)

- [ ] **Step 4: Register functions in `firebase.json`** — add a `"functions"` key alongside `hosting`/`firestore`:

```json
"functions": {
  "source": "functions",
  "runtime": "nodejs20"
}
```

- [ ] **Step 5: Install deps**

Run: `cd functions && npm install`
Expected: dependencies install cleanly.

- [ ] **Step 6: Commit**

```bash
git add functions/package.json functions/.gitignore functions/index.js firebase.json
git commit -m "chore: scaffold Firebase Functions for practice exam"
```

---

## Task 10: Server question bank (TIMED content) + `startExam`

The **timed** content set + answer key live **only** in `functions/` and are never imported by the web build — this is what keeps the timed answer key off the client. `startExam` performs domain-weighted selection, freezes phrasing + option order, strips `isCorrect`, writes a session doc, and returns sanitized questions + a `sessionId`.

**Files:**
- Create: `functions/practiceBank.js` (server-only bank + engine; it must NOT import from `web/`), `functions/startExam.js`

- [ ] **Step 1: `functions/practiceBank.js`** — build the **timed** bank and the server attempt/score logic. Use the **`timed` pools** (2–3 wordings each) and **timed stems** (2–3) from `docs/superpowers/specs/practice-exam-design/practice-data.js` (the `timed:` arrays in `CORRECT_POOL` / `DISTRACTOR_POOL` / `stemVariants`) — these are **distinct strings** from the practice set in Task 1. Do **not** copy the practice wordings here, and do **not** import `web/src/data/practiceQuestions.js`. Because Functions can't import the web `DOMAINS`, inline a minimal domain list `[{id:'d1',num:1},…,{id:'d5',num:5}]`, plus the same `BLUEPRINT` and build loop. Export `BANK`, `BLUEPRINT`, `PASS_PCT`, `buildSession()` (returns `{ instances, sanitized }` where `instances` keep `correct` server-side and `sanitized` strips it), `scoreSession(sessionInstances, answers)`.

  > Since this bank holds a single content set (timed only), option `text` here is a plain array of the timed wordings — mirror Task 1's shape, just with the timed strings. Keep the **same instance shape** (`qid`, `domain`, `stemIdx`, `optOrder`, `phraseIdx`) so scoring matches Part A exactly.

- [ ] **Step 2: `functions/startExam.js`**

```js
// functions/startExam.js
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { buildSession } from './practiceBank.js'

export const startExam = onCall(async (req) => {
  const mode = req.data?.mode
  if (mode !== 'timed' && mode !== 'practice') {
    throw new HttpsError('invalid-argument', 'mode must be "timed" or "practice"')
  }
  if (mode === 'timed' && !req.auth) {
    throw new HttpsError('unauthenticated', 'Timed exams require sign-in')
  }
  const { instances, sanitized } = buildSession()
  const db = getFirestore()
  const ref = await db.collection('exam_sessions').add({
    uid: req.auth?.uid || null,
    mode,
    instances,            // full instances incl. answer key — server only
    createdAt: FieldValue.serverTimestamp(),
    durationMs: mode === 'timed' ? 120 * 60 * 1000 : null,
    submitted: false,
  })
  return { sessionId: ref.id, mode, questions: sanitized } // no isCorrect leaves the server
})
```

- [ ] **Step 3: Emulator smoke test** (see Task 13 for emulator setup; if running tasks in order, defer this verification). Expected when called: returns `{ sessionId, questions }` with 60 questions and no `correct` field present.

- [ ] **Step 4: Commit**

```bash
git add functions/practiceBank.js functions/startExam.js
git commit -m "feat: add startExam function with server-side question selection"
```

---

## Task 11: `submitExam`

Scores the stored session server-side, persists the completed attempt under the user, and returns the result + the answer key/explanations for the review screen.

**Files:**
- Create: `functions/submitExam.js`

- [ ] **Step 1: `functions/submitExam.js`**

```js
// functions/submitExam.js
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { scoreSession } from './practiceBank.js'

export const submitExam = onCall(async (req) => {
  const { sessionId, answers } = req.data || {}
  if (!sessionId || typeof answers !== 'object') {
    throw new HttpsError('invalid-argument', 'sessionId and answers are required')
  }
  const db = getFirestore()
  const sref = db.collection('exam_sessions').doc(sessionId)
  const snap = await sref.get()
  if (!snap.exists) throw new HttpsError('not-found', 'session not found')
  const session = snap.data()
  if (session.uid && session.uid !== (req.auth?.uid || null)) {
    throw new HttpsError('permission-denied', 'not your session')
  }
  if (session.submitted) throw new HttpsError('failed-precondition', 'already submitted')

  const { score, review } = scoreSession(session.instances, answers)
  await sref.update({ submitted: true, submittedAt: FieldValue.serverTimestamp() })

  // persist completed attempt for signed-in users (timed mode is always signed-in)
  if (req.auth) {
    await db.collection('users').doc(req.auth.uid).collection('exam_attempts').add({
      mode: session.mode,
      score: score.pct,
      passed: score.pass,
      perDomain: score.perDomain,
      submittedAt: FieldValue.serverTimestamp(),
    })
  }
  return { score, review } // review carries correct positions + explanations
})
```

- [ ] **Step 2: Commit**

```bash
git add functions/submitExam.js
git commit -m "feat: add submitExam function with server-side scoring"
```

---

## Task 12: `postToLeaderboard` + leaderboard reads

Opt-in write of the user's **best timed score** to a public, read-only `leaderboard/{uid}` doc.

**Files:**
- Create: `functions/postToLeaderboard.js`

- [ ] **Step 1: `functions/postToLeaderboard.js`**

```js
// functions/postToLeaderboard.js
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

export const postToLeaderboard = onCall(async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'sign-in required')
  const { displayName, anonymous } = req.data || {}
  const db = getFirestore()

  // server computes the user's best timed score — clients can't forge it
  const attemptsSnap = await db
    .collection('users').doc(req.auth.uid).collection('exam_attempts')
    .where('mode', '==', 'timed').get()
  let best = null
  attemptsSnap.forEach((d) => {
    const s = d.data().score
    if (best == null || s > best) best = s
  })
  if (best == null) throw new HttpsError('failed-precondition', 'no timed score to post')

  await db.collection('leaderboard').doc(req.auth.uid).set({
    displayName: anonymous ? null : (displayName || null),
    anonymous: !!anonymous,
    bestScore: best,
    updatedAt: FieldValue.serverTimestamp(),
  })
  return { bestScore: best }
})
```

- [ ] **Step 2: Commit**

```bash
git add functions/postToLeaderboard.js
git commit -m "feat: add postToLeaderboard function"
```

---

## Task 13: Firestore rules + emulator verification

**Files:**
- Modify: `firestore.rules`

- [ ] **Step 1: Update `firestore.rules`** — leaderboard is world-readable but only writable by Functions (Admin SDK bypasses rules); `exam_sessions` is fully locked to clients (only Functions touch it):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    // Public leaderboard: anyone can read; only Functions (Admin SDK) can write.
    match /leaderboard/{uid} {
      allow read: if true;
      allow write: if false;
    }
    // Exam sessions hold the answer key — never client-accessible.
    match /exam_sessions/{sessionId} {
      allow read, write: if false;
    }
  }
}
```

- [ ] **Step 2: Start the emulator suite**

Run: `firebase emulators:start --only functions,firestore`
Expected: Functions + Firestore emulators boot; the three callables are listed.

- [ ] **Step 3: Verify each callable** via the emulator (Functions shell or a scratch client call):
  - `startExam({mode:'timed'})` unauthenticated → `unauthenticated` error; authenticated → `{sessionId, questions(60, no "correct")}`.
  - `submitExam({sessionId, answers})` → `{score, review}`; second call → `failed-precondition`.
  - `postToLeaderboard({displayName, anonymous})` with no timed attempts → `failed-precondition`; after a timed submit → writes `leaderboard/{uid}`.

- [ ] **Step 4: Commit**

```bash
git add firestore.rules
git commit -m "feat: add leaderboard + exam_sessions Firestore rules"
```

---

## Task 14: Wire the web client to Functions

Swap timed-mode selection/scoring and the leaderboard from client-side to the callables. Practice mode stays client-side.

**Files:**
- Modify: `web/src/lib/firebase.js` (export `functions`), create `web/src/lib/examFunctions.js`, modify `web/src/hooks/useExamAttempts.js`, `web/src/components/practice/ExamRunner.jsx`, `web/src/components/practice/LeaderboardView.jsx` data source.

- [ ] **Step 1: Export Functions in `web/src/lib/firebase.js`**

```js
import { getFunctions } from 'firebase/functions'
// ...
export const functions = getFunctions(app)
```

- [ ] **Step 2: Create `web/src/lib/examFunctions.js`** — `httpsCallable` wrappers:

```js
// web/src/lib/examFunctions.js
import { httpsCallable } from 'firebase/functions'
import { functions } from './firebase'

export const startExam = httpsCallable(functions, 'startExam')
export const submitExam = httpsCallable(functions, 'submitExam')
export const postToLeaderboard = httpsCallable(functions, 'postToLeaderboard')
```

- [ ] **Step 3: Timed mode through the server.** In `useExamAttempts`:
  - For `startAttempt('timed')`: call `startExam({mode:'timed'})`, build the active attempt from the returned `questions` (each already has resolved `stem`/option `text`, no `correct`), store the `sessionId` on the active attempt. Practice mode keeps using `createAttempt('practice')`.
  - For `submit()` of a timed attempt: call `submitExam({sessionId, answers})`, use the returned `{score, review}` for the results screen instead of `scoreAttempt`. The Function already persisted the attempt, so don't `addRemoteAttempt` for timed.
  - `ExamRunner` for timed mode renders from the server `questions` (no `renderInstance`, no `correct` → no feedback, which is correct for timed). For results review of timed attempts, use the `review` payload (correct positions + explanations) from `submitExam`.

  > Implement this as a `mode` branch so practice mode behavior is untouched. Keep the normalized attempt shape (`instances` with display text) so `ExamRunner`/`ResultsReview` need minimal changes.

- [ ] **Step 4: Real leaderboard read** — replace `SEED_LEADERBOARD` usage with a Firestore read of the `leaderboard` collection ordered by `bestScore desc`, mapped to the existing row shape (`{handle: displayName ?? 'Anonymous', score: bestScore, anon: anonymous, isYou: uid===me}`). `postToLeaderboard` action calls the callable instead of `savePosted`. Keep `unpost` (delete `leaderboard/{uid}` via a small additional callable or leave as documented follow-up).

- [ ] **Step 5: Connect emulators in dev (optional but recommended)** — guard with `import.meta.env.DEV` and `connectFunctionsEmulator(functions, 'localhost', 5001)` so local dev hits the emulator.

- [ ] **Step 6: Re-run web tests** — practice-mode tests (Part A) must still pass unchanged. Add a timed-mode test that mocks `examFunctions` (vi.mock) to assert the runner shows no feedback and results come from the mocked `submitExam`.

Run: `cd web && npm run test`
Expected: all green.

- [ ] **Step 7: Commit**

```bash
git add web/src/lib/firebase.js web/src/lib/examFunctions.js web/src/hooks/useExamAttempts.js web/src/components/practice
git commit -m "feat: route timed exam + leaderboard through Firebase Functions"
```

---

## Task 15: Deploy

- [ ] **Step 1: Deploy rules + functions** (maintainer, after Blaze is enabled)

Run: `firebase deploy --only firestore:rules,functions --project=iammoo-ctracer`
Expected: three functions deploy; rules publish.

- [ ] **Step 2: Build + deploy hosting**

Run: `cd web && npm run build && cd .. && firebase deploy --only hosting --project=iammoo-ctracer`
Expected: web app live with the working Practice Exam.

- [ ] **Step 3: Production smoke test** — sign in, run a timed exam, confirm results render, post to the leaderboard, confirm the row appears and is highlighted as YOU.

---

## Verification (end-to-end)

**Part A (client-only, no Functions needed):**
1. `cd web && npm run test && npm run lint && npm run build` — all pass.
2. `npm run dev` → `/practice-exam`: practice run start→answer→feedback→submit→results→review; history populates; seeded leaderboard renders; opt-in post shows your row; responsive collapse <820px matches `screens/m-runner.png` and `screens/m-rest.png`.

**Part B (Functions):**
3. `firebase emulators:start --only functions,firestore` and verify the three callables (Task 13 Step 3).
4. With emulators connected, a timed exam shows **no** per-question feedback, the returned questions contain **no** answer key (inspect network payload), and results come from `submitExam`.
5. After deploy: production timed run + leaderboard post works.

---

## Spec coverage check

- Two modes, sign-in gating, 60 questions, 120-min timer, domain-weighted selection → Tasks 1–2, 6–7 (Part A); hardened in Task 10/14.
- Anti-memorization phrasings + shuffled options → Task 1 (pools) + Task 2 (`createAttempt`/`renderInstance`).
- Mode-split content / answer-key isolation (practice set client-side, timed set server-only, distinct wordings) → Task 1 (practice pools only) + Task 10 (timed pools only, never imported by web) + Task 14 (timed renders server payload).
- Scoring (% correct, 72% pass, per-domain) → Task 2 (`scoreAttempt`), server mirror Task 11.
- Instant feedback (practice) / none (timed) → Task 6 (`ExamRunner` `optState`) + Task 14 timed branch.
- Persistence (Firestore signed-in / localStorage signed-out; attempts list) → Tasks 3–4, server writes Task 11.
- History + trend → Task 6 (`HistoryView`/`Sparkline`).
- Leaderboard (global, best timed/user, opt-in, anon, your-rank) → Task 6 (`LeaderboardView`) + Tasks 12, 14.
- Firebase Functions (`startExam`/`submitExam`/`postToLeaderboard`) → Tasks 10–12.
- Navigation under "Prep finish" → Task 7.
- Responsive-for-mobile → Task 5 (`@media` block) + Task 6 components.
- Out of scope (scaled score, adaptive, time-window boards, authoring UI) → not implemented, as specified.
