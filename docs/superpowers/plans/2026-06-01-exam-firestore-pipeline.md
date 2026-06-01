# Exam Firestore Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve both exam modes from the Firestore `exam_questions` collection via Cloud Functions, retiring the in-bundle/in-code placeholder banks.

**Architecture:** `exam_questions` is locked from clients (rules); functions (Admin SDK) read it. `getPracticeExam` (unauth) returns practice-worded questions with the answer key; `startExam`/`submitExam` keep the timed key server-side. Client practice flow becomes async and server-resolved, reusing the existing `_serverResolved` instance seam.

**Tech Stack:** Firebase Functions v2 (gen2, Node 22, ESM), firebase-admin; web is Vite + React + Vitest. Function logic is unit-tested with Node's built-in test runner (`node --test`, Node 22).

**Specs:** `docs/superpowers/specs/2026-06-01-exam-firestore-pipeline-design.md` (this pipeline) and `…/2026-05-30-exam-question-bank-design.md` (bank shape). Read both before starting.

**Branch:** Work on `feature/practice-exam` (per user; no separate branch).

---

## Task 1: Lock the `exam_questions` collection in Firestore rules

**Files:** Modify `firestore.rules`

- [ ] **Step 1: Add a deny-all rule for `exam_questions`**

In `firestore.rules`, inside `match /databases/{database}/documents {`, add alongside the existing `exam_sessions` block:

```
    // Question bank holds the timed answer key — never client-accessible.
    // Functions (Admin SDK) bypass these rules.
    match /exam_questions/{qid} {
      allow read, write: if false;
    }
```

- [ ] **Step 2: Verify the rules compile**

Run: `npx --yes firebase-tools deploy --only firestore:rules --project iammoo-ctracer --dry-run` (or, if dry-run is unavailable, confirm syntax by eye against the existing blocks — every `match` closed, `rules_version = '2'` intact).
Expected: no compilation error.

- [ ] **Step 3: Commit**

```bash
git add firestore.rules
git commit -m "feat: lock exam_questions collection from client access"
```

---

## Task 2: Seed script for importing the bank into Firestore

**Files:** Create `functions/seedExamQuestions.mjs`

- [ ] **Step 1: Write the seed script**

`functions/seedExamQuestions.mjs`:

```js
// functions/seedExamQuestions.mjs
// Local-run upsert of data/exam-question-bank.firestore.json into Firestore `exam_questions`.
// Requires a service-account JSON via GOOGLE_APPLICATION_CREDENTIALS for project iammoo-ctracer.
//   PowerShell:  $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\sa.json"; node seedExamQuestions.mjs
//   bash:        GOOGLE_APPLICATION_CREDENTIALS=/path/sa.json node seedExamQuestions.mjs
import { readFileSync } from 'node:fs'
import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const data = JSON.parse(readFileSync(new URL('../data/exam-question-bank.firestore.json', import.meta.url)))
initializeApp({ credential: applicationDefault(), projectId: 'iammoo-ctracer' })
const db = getFirestore()

const ids = Object.keys(data)
const batch = db.batch()
for (const id of ids) batch.set(db.collection('exam_questions').doc(id), data[id])
await batch.commit()
console.log(`Seeded ${ids.length} questions into exam_questions`)
process.exit(0)
```

- [ ] **Step 2: Verify it parses (no live run yet)**

Run: `node --check functions/seedExamQuestions.mjs`
Expected: no output, exit 0. (The actual seeding run requires credentials and is performed in Task 8.)

- [ ] **Step 3: Commit**

```bash
git add functions/seedExamQuestions.mjs
git commit -m "feat: add exam_questions Firestore seed script"
```

---

## Task 3: Bank loader + session logic (`functions/examBank.js`) with tests

**Files:** Create `functions/examBank.js`, Create `functions/examBank.test.mjs`

- [ ] **Step 1: Write the failing tests**

`functions/examBank.test.mjs`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildTimedSession, scoreSession, buildPracticeQuestions } from './examBank.js'

// Minimal fixture bank in the new shape (2 questions, distinct domains).
const BANK = [
  { id: 'd1-001', domain: 'd1', stem: ['S1a', 'S1b'], correctIndex: 0,
    options: [
      { practice: ['p-correct'], timed: ['t-correct'] },
      { practice: ['p-wrong1'], timed: ['t-wrong1'] },
      { practice: ['p-wrong2'], timed: ['t-wrong2'] },
      { practice: ['p-wrong3'], timed: ['t-wrong3'] },
    ], explanation: 'because-1' },
  { id: 'd2-001', domain: 'd2', stem: ['S2a', 'S2b'], correctIndex: 2,
    options: [
      { practice: ['p-w'], timed: ['t-w'] },
      { practice: ['p-x'], timed: ['t-x'] },
      { practice: ['p-correct2'], timed: ['t-correct2'] },
      { practice: ['p-z'], timed: ['t-z'] },
    ], explanation: 'because-2' },
]

test('buildTimedSession sanitized leaks no answer key and uses timed wordings', () => {
  const { instances, sanitized } = buildTimedSession(BANK)
  assert.equal(sanitized.length, 2)
  for (const q of sanitized) {
    assert.equal(q.opts.length, 4)
    for (const o of q.opts) {
      assert.equal('correct' in o, false)          // no key
      assert.match(o.text, /^t-/)                   // timed wordings only
    }
  }
  // instances retain the key + explanation server-side
  for (const inst of instances) {
    assert.equal(typeof inst.correctOrigIdx, 'number')
    assert.equal(typeof inst.explanation, 'string')
  }
})

test('scoreSession scores against the stored key and returns explanations', () => {
  const { instances } = buildTimedSession(BANK)
  // answer every question with its correct display position
  const answers = {}
  instances.forEach((inst, i) => { answers[i] = inst.optOrder.indexOf(inst.correctOrigIdx) })
  const { score, review } = scoreSession(instances, answers)
  assert.equal(score.correct, 2)
  assert.equal(score.total, 2)
  assert.equal(score.pct, 100)
  assert.equal(review[0].isCorrect, true)
  assert.equal(typeof review[0].explanation, 'string')
})

test('buildPracticeQuestions exposes exactly one correct option + explanation', () => {
  const qs = buildPracticeQuestions(BANK)
  assert.equal(qs.length, 2)
  for (const q of qs) {
    assert.equal(q.opts.length, 4)
    assert.equal(q.opts.filter((o) => o.correct).length, 1)  // exactly one correct
    assert.match(q.opts[0].text, /^p-/)                       // practice wordings
    assert.equal(typeof q.explanation, 'string')
  }
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test functions/examBank.test.mjs`
Expected: FAIL — cannot resolve `./examBank.js` (not created yet).

- [ ] **Step 3: Implement `functions/examBank.js`**

```js
// functions/examBank.js
// Loads the question bank from Firestore and builds/scores sessions on the
// bank shape (stem[], options[].practice/.timed, correctIndex).
// Replaces the in-code placeholder bank in practiceBank.js.
import { getFirestore } from 'firebase-admin/firestore'

export const BLUEPRINT = { d1: 16, d2: 12, d3: 12, d4: 11, d5: 9 }
export const PASS_PCT = 72

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const pickPhrase = (arr, i) => arr[i % arr.length]

let _cache = null
// Reads all questions once per warm instance. Pass {force:true} to refresh.
export async function loadBank({ force = false } = {}) {
  if (_cache && !force) return _cache
  const snap = await getFirestore().collection('exam_questions').get()
  _cache = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return _cache
}

// TIMED: server-only `instances` (key + explanation) + client-safe `sanitized`.
export function buildTimedSession(bank) {
  const order = shuffle(bank)
  const instances = order.map((q) => ({
    qid: q.id,
    domain: q.domain,
    stemIdx: Math.floor(Math.random() * q.stem.length),
    optOrder: shuffle(q.options.map((_, i) => i)),
    phraseIdx: q.options.map((o) => Math.floor(Math.random() * o.timed.length)),
    correctOrigIdx: q.correctIndex,
    explanation: q.explanation, // server-only (stored in exam_sessions)
  }))
  const sanitized = instances.map((inst) => {
    const q = bank.find((b) => b.id === inst.qid)
    return {
      qid: inst.qid,
      domain: inst.domain,
      stem: q.stem[inst.stemIdx],
      opts: inst.optOrder.map((origIdx) => ({
        text: pickPhrase(q.options[origIdx].timed, inst.phraseIdx[origIdx]),
        // NO `correct` — answer key stays server-side
      })),
    }
  })
  return { instances, sanitized }
}

// Score a timed session from its stored instances (no bank re-read needed).
export function scoreSession(instances, answers) {
  let correct = 0
  const perDomain = {
    d1: { correct: 0, total: 0 }, d2: { correct: 0, total: 0 }, d3: { correct: 0, total: 0 },
    d4: { correct: 0, total: 0 }, d5: { correct: 0, total: 0 },
  }
  const review = instances.map((inst, idx) => {
    perDomain[inst.domain].total++
    const sel = answers[idx]
    const correctDisplayPos = inst.optOrder.indexOf(inst.correctOrigIdx)
    const isCorrect = sel !== undefined && Number(sel) === correctDisplayPos
    if (isCorrect) { correct++; perDomain[inst.domain].correct++ }
    return {
      idx, qid: inst.qid, domain: inst.domain, correctDisplayPos,
      selectedPos: sel !== undefined ? Number(sel) : null, isCorrect, explanation: inst.explanation,
    }
  })
  const total = instances.length
  const pct = Math.round((correct / total) * 100)
  return { score: { correct, total, pct, pass: pct >= PASS_PCT, perDomain }, review }
}

// PRACTICE: full questions WITH key + explanation (practice answers are public).
export function buildPracticeQuestions(bank) {
  return shuffle(bank).map((q) => {
    const stemIdx = Math.floor(Math.random() * q.stem.length)
    const optOrder = shuffle(q.options.map((_, i) => i))
    return {
      qid: q.id,
      domain: q.domain,
      stem: q.stem[stemIdx],
      opts: optOrder.map((origIdx) => ({
        text: pickPhrase(q.options[origIdx].practice, Math.floor(Math.random() * q.options[origIdx].practice.length)),
        correct: origIdx === q.correctIndex,
      })),
      explanation: q.explanation,
    }
  })
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test functions/examBank.test.mjs`
Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add functions/examBank.js functions/examBank.test.mjs
git commit -m "feat: add Firestore-backed exam bank loader + session logic with tests"
```

---

## Task 4: `getPracticeExam` callable function

**Files:** Create `functions/getPracticeExam.js`, Modify `functions/index.js`

- [ ] **Step 1: Write the function**

`functions/getPracticeExam.js`:

```js
// functions/getPracticeExam.js
// Returns the practice question set (practice wordings + answer key + explanations).
// Unauthenticated calls allowed — practice is the free/public study mode.
import { onCall } from 'firebase-functions/v2/https'
import { loadBank, buildPracticeQuestions } from './examBank.js'

export const getPracticeExam = onCall(async () => {
  const bank = await loadBank()
  return { questions: buildPracticeQuestions(bank) }
})
```

- [ ] **Step 2: Export it from `index.js`**

In `functions/index.js`, add after the `submitExam` export:

```js
export { getPracticeExam } from './getPracticeExam.js'
```

- [ ] **Step 3: Verify both parse**

Run: `node --check functions/getPracticeExam.js && node --check functions/index.js`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add functions/getPracticeExam.js functions/index.js
git commit -m "feat: add getPracticeExam callable (unauth, server-sourced)"
```

---

## Task 5: Point `startExam`/`submitExam` at the Firestore bank; retire `practiceBank.js`

**Files:** Modify `functions/startExam.js`, Modify `functions/submitExam.js`, Delete `functions/practiceBank.js`

- [ ] **Step 1: Update `startExam.js`**

Replace its import line and session build:

```js
// was: import { buildSession } from './practiceBank.js'
import { loadBank, buildTimedSession } from './examBank.js'
```

Inside the handler, replace `const { instances, sanitized } = buildSession()` with:

```js
  const bank = await loadBank()
  const { instances, sanitized } = buildTimedSession(bank)
```

(Everything else in `startExam.js` — the mode/auth guards, the `exam_sessions` write storing `instances`, the `{ sessionId, mode, questions: sanitized }` return — stays the same.)

- [ ] **Step 2: Update `submitExam.js`**

Change only the import:

```js
// was: import { scoreSession } from './practiceBank.js'
import { scoreSession } from './examBank.js'
```

(The `scoreSession(session.instances, answers)` call is unchanged; instances now carry `explanation`, which the new `scoreSession` reads directly.)

- [ ] **Step 3: Delete the placeholder bank**

```bash
git rm functions/practiceBank.js
```

- [ ] **Step 4: Verify no stale references remain**

Run: `grep -rn "practiceBank" functions --include=*.js --include=*.mjs` (exclude node_modules)
Expected: no matches.
Run: `node --check functions/startExam.js && node --check functions/submitExam.js`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add functions/startExam.js functions/submitExam.js
git commit -m "refactor: source timed exam from Firestore bank; remove placeholder practiceBank"
```

---

## Task 6: Add the client callable for practice

**Files:** Modify `web/src/lib/examFunctions.js`

- [ ] **Step 1: Add the binding**

Append to `web/src/lib/examFunctions.js`:

```js
export const getPracticeExamFn = httpsCallable(functions, 'getPracticeExam')
```

- [ ] **Step 2: Commit**

```bash
git add web/src/lib/examFunctions.js
git commit -m "feat: add getPracticeExam client binding"
```

---

## Task 7: Refactor the client practice engine

**Files:** Modify `web/src/lib/practiceEngine.js`

- [ ] **Step 1: Replace the file contents**

`web/src/lib/practiceEngine.js` (drops the `BANK`/`renderInstance`/`createAttempt` dependency on `practiceQuestions.js`; scoring now reads the resolved `opts[].correct` that the server provided):

```js
// web/src/lib/practiceEngine.js
// Pure scoring for the Practice Exam. Questions are server-resolved (each option
// carries a `correct` flag), so scoring reads the instances directly — no local bank.
import { DOMAINS } from '../data/index'

export const PASS_PCT = 72
export const DURATION_MIN = 120

export function scoreAttempt(attempt) {
  let correct = 0
  const perDomain = {}
  DOMAINS.forEach((d) => (perDomain[d.id] = { correct: 0, total: 0 }))
  attempt.instances.forEach((inst, idx) => {
    perDomain[inst.domain].total++
    const sel = attempt.answers[idx]
    if (sel === undefined) return
    if (inst.opts[sel]?.correct) {
      correct++
      perDomain[inst.domain].correct++
    }
  })
  const total = attempt.instances.length
  const pct = Math.round((correct / total) * 100)
  return { correct, total, pct, pass: pct >= PASS_PCT, perDomain }
}
```

- [ ] **Step 2: Verify no other file imports the removed exports**

Run: `grep -rn "renderInstance\|createAttempt\|questionById" web/src`
Expected: matches only in files updated by later tasks (ExamRunner, ResultsReview, useExamAttempts). Note them for Tasks 8–9; all must be removed there.

---

## Task 8: Make practice `startAttempt` server-backed in the hook

**Files:** Modify `web/src/hooks/useExamAttempts.js`

- [ ] **Step 1: Update imports**

Change the engine/functions imports:

```js
// was: import { startExamFn, submitExamFn, postToLeaderboardFn } from '../lib/examFunctions'
import { startExamFn, submitExamFn, postToLeaderboardFn, getPracticeExamFn } from '../lib/examFunctions'
// was: import { createAttempt, scoreAttempt } from '../lib/practiceEngine'
import { scoreAttempt } from '../lib/practiceEngine'
```

- [ ] **Step 2: Replace the practice branch of `startAttempt`**

In `startAttempt`, replace the practice branch:

```js
    if (mode === 'practice') {
      setActive(createAttempt('practice'))
      return
    }
```

with the async server-backed version:

```js
    if (mode === 'practice') {
      if (activeRef.current) return // don't overwrite an in-progress attempt
      try {
        const { data } = await getPracticeExamFn()
        // questions[i] = { qid, domain, stem, opts:[{text,correct}], explanation }
        const instances = data.questions.map((q) => ({
          qid: q.qid,
          domain: q.domain,
          stem: q.stem,
          opts: q.opts,
          explanation: q.explanation,
          _serverResolved: true,
        }))
        setActive({
          id: `a${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          mode: 'practice',
          createdAt: Date.now(),
          durationMs: null,
          instances,
          answers: {},
          flags: {},
          submitted: false,
        })
      } catch (err) {
        console.error('getPracticeExam failed', err)
        throw err
      }
      return
    }
```

(The timed branch below it is unchanged. The practice branch of `submit` still calls `scoreAttempt(currentActive)`, which now reads `inst.opts[].correct` — no change needed there.)

- [ ] **Step 3: Verify the hook parses and no stale imports remain**

Run: `grep -n "createAttempt" web/src/hooks/useExamAttempts.js`
Expected: no matches.

- [ ] **Step 4: Commit (Tasks 7+8 together — they form one working change)**

```bash
git add web/src/lib/practiceEngine.js web/src/hooks/useExamAttempts.js
git commit -m "refactor: server-source practice mode; score from resolved options"
```

---

## Task 9: Unify the runner + results on server-resolved instances

**Files:** Modify `web/src/components/practice/ExamRunner.jsx`, Modify `web/src/components/practice/ResultsReview.jsx`

- [ ] **Step 1: ExamRunner — drop `renderInstance`, read the instance directly**

Remove the import `import { renderInstance } from '../../lib/practiceEngine';`.

Replace the resolution block:

```js
  const inst = attempt.instances[current];
  // Timed instances arrive pre-resolved from the server (no client answer key);
  // practice instances are resolved locally via renderInstance.
  const r = inst._serverResolved
    ? { stem: inst.stem, opts: inst.opts, explanation: null }
    : renderInstance(inst);
```

with:

```js
  const inst = attempt.instances[current];
  // Both modes are now server-resolved: stem/opts are strings. Practice instances
  // additionally carry `opts[].correct` + `explanation` for instant feedback;
  // timed instances do not (the key is revealed only by submitExam).
  const r = { stem: inst.stem, opts: inst.opts, explanation: inst.explanation ?? null };
```

(`correctPos = r.opts.findIndex((o) => o.correct)` stays. For timed, `showFeedback` is false, so `correctPos` is unused during the run.)

- [ ] **Step 2: ResultsReview — import PASS_PCT from the engine, branch by mode**

Change the imports:

```js
// was: import { PASS_PCT } from '../../data/practiceQuestions';
// was: import { renderInstance } from '../../lib/practiceEngine';
import { PASS_PCT } from '../../lib/practiceEngine';
```

Replace the `rows` mapping:

```js
  const rows = instances.map((inst, i) => {
    if (inst._serverResolved) {
      const rev = attempt.review?.[i] ?? {};
      const sel = rev.selectedPos == null ? undefined : rev.selectedPos;
      return {
        i, inst,
        r: { stem: inst.stem, opts: inst.opts, explanation: rev.explanation },
        sel, correctPos: rev.correctDisplayPos, isCorrect: !!rev.isCorrect, skipped: sel === undefined,
      };
    }
    const r = renderInstance(inst);
    const sel = attempt.answers[i];
    const correctPos = r.opts.findIndex((o) => o.correct);
    const isCorrect = sel === correctPos;
    return { i, inst, r, sel, correctPos, isCorrect, skipped: sel === undefined };
  });
```

with a mode-based branch (timed uses server `review`; practice uses the resolved key on the instance):

```js
  const rows = instances.map((inst, i) => {
    if (isTimed) {
      // Timed: answer key + result come from the server review payload.
      const rev = attempt.review?.[i] ?? {};
      const sel = rev.selectedPos == null ? undefined : rev.selectedPos;
      return {
        i, inst,
        r: { stem: inst.stem, opts: inst.opts, explanation: rev.explanation },
        sel, correctPos: rev.correctDisplayPos, isCorrect: !!rev.isCorrect, skipped: sel === undefined,
      };
    }
    // Practice: instance carries opts[].correct + explanation (answers are public).
    const sel = attempt.answers[i];
    const correctPos = inst.opts.findIndex((o) => o.correct);
    const isCorrect = sel === correctPos;
    return {
      i, inst,
      r: { stem: inst.stem, opts: inst.opts, explanation: inst.explanation },
      sel, correctPos, isCorrect, skipped: sel === undefined,
    };
  });
```

(`const isTimed = attempt.mode === "timed";` already exists above this block. The `!hasDetail` empty-state for past timed attempts from History is unchanged.)

- [ ] **Step 3: Verify no stale references remain**

Run: `grep -rn "renderInstance" web/src`
Expected: no matches.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/practice/ExamRunner.jsx web/src/components/practice/ResultsReview.jsx
git commit -m "refactor: unify runner/results on server-resolved instances"
```

---

## Task 10: Delete the placeholder client bank; update web tests

**Files:** Delete `web/src/data/practiceQuestions.js`, Delete `web/src/data/practiceQuestions.test.js` (if it only tests the placeholder), Modify `web/src/screens/PracticeExam.test.jsx`

- [ ] **Step 1: Confirm nothing imports the placeholder bank**

Run: `grep -rn "practiceQuestions" web/src`
Expected: matches only in `practiceQuestions.test.js` (and any not-yet-updated test). If a non-test source file still imports it, fix that import before deleting.

- [ ] **Step 2: Delete the placeholder bank and its unit test**

```bash
git rm web/src/data/practiceQuestions.js web/src/data/practiceQuestions.test.js
```

- [ ] **Step 3: Mock `getPracticeExam` in the screen test**

In `web/src/screens/PracticeExam.test.jsx`, the `firebase/functions` mock must make `httpsCallable` return a resolver whose practice call yields a question payload. Ensure the mock looks like:

```js
vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(() => ({})),
  connectFunctionsEmulator: vi.fn(),
  httpsCallable: vi.fn(() => vi.fn(async () => ({
    data: {
      questions: Array.from({ length: 60 }, (_, i) => ({
        qid: `q${i}`, domain: 'd1', stem: 'Stem?',
        opts: [
          { text: 'A', correct: true }, { text: 'B', correct: false },
          { text: 'C', correct: false }, { text: 'D', correct: false },
        ],
        explanation: 'because',
      })),
    },
  }))),
}))
```

(If the existing test asserts specifics of the old client-side practice start, update those assertions to await the async `startAttempt` and assert the runner renders a server-resolved question.)

- [ ] **Step 4: Run the web test suite**

Run: `npm test` in `web`
Expected: all tests pass. Fix any assertions still tied to the removed `BANK`/`renderInstance`/`createAttempt`.

- [ ] **Step 5: Commit**

```bash
git add -A web/src
git commit -m "chore: remove placeholder client question bank; update tests for server practice"
```

---

## Task 11: Full verification + seed + deploy

- [ ] **Step 1: Function logic tests**

Run: `node --test functions/examBank.test.mjs`
Expected: pass.

- [ ] **Step 2: Web build + tests**

Run: `npm test` and `npm run build` in `web`
Expected: tests pass; build succeeds.

- [ ] **Step 3: Seed the bank into Firestore** (requires a service-account JSON for `iammoo-ctracer`)

PowerShell:
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\sa.json"
node functions/seedExamQuestions.mjs
```
Expected: `Seeded 60 questions into exam_questions`. Confirm in the Firebase console that `exam_questions` has 60 docs.

- [ ] **Step 4: Deploy rules + functions**

Run: `npx --yes firebase-tools deploy --only firestore:rules,functions --project iammoo-ctracer`
Expected: `getPracticeExam`, `startExam`, `submitExam`, `postToLeaderboard` deploy; rules released. (CI also deploys functions on merge to main — this is the immediate manual push.)

- [ ] **Step 5: Smoke test**

In the running app: start a **practice** exam (signed out) — questions load from the server, answering shows instant feedback + explanation. Start a **timed** exam (signed in) — questions load with no key in the network payload; submit reveals score + explanations. Confirm a wrong answer in timed is graded correctly and History shows the summary.

---

## Out of scope (per addendum §7)

Admin editing UI; pool > 60 / weighted random draw; a leaderboard-delete callable.

---

## Self-Review (completed by plan author)

- **Spec coverage:** rules §2 → Task 1; seed → Task 2; `examBank` loader/build/score §3–4 → Task 3; `getPracticeExam` unauth §2,§6 → Task 4; timed refactor §2 → Task 5; client binding → Task 6; engine refactor §2 → Task 7; practice flow §3 → Task 8; runner/results contracts §3 → Task 9; retire placeholders → Tasks 5,10; isolation §5 → enforced by `buildTimedSession` (no `correct` in sanitized — asserted in the Task 3 test) + rules. Covered.
- **Placeholder scan:** all code shown in full; no TBDs.
- **Type consistency:** `buildTimedSession`/`scoreSession`/`buildPracticeQuestions` names match across examBank, its tests, startExam, submitExam, getPracticeExam. Instance fields (`optOrder`, `correctOrigIdx`, `explanation`, `stemIdx`, `phraseIdx`) consistent between build and score. Client instance fields (`qid`, `domain`, `stem`, `opts[].text/.correct`, `explanation`, `_serverResolved`) match the `getPracticeExam` contract and the runner/results consumers.
