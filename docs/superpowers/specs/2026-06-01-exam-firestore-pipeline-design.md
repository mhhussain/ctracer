# Exam Firestore Pipeline — Design Addendum

**Date:** 2026-06-01
**Status:** Design approved; implementation pending
**Builds on:** `docs/superpowers/specs/2026-05-30-exam-question-bank-design.md` (the bank shape) — this addendum covers the **runtime delivery** the bank spec deferred (§8).

---

## 1. Decision

Both exam modes are **fully server-backed** from the single Firestore `exam_questions` collection. Edits in Firestore reflect live for both practice and timed. The collection is locked from all client access; only Cloud Functions (Admin SDK) read it.

The server-only requirement exists to protect the **timed** answer key. **Practice** answers are public by design (revealed as you study), so the practice function returns the answer key in its payload; the timed function never does.

## 2. Components

| Piece | File | Responsibility |
|---|---|---|
| Collection | `exam_questions` (Firestore) | 60 docs in the bank shape; locked by rules |
| Rules | `firestore.rules` | `exam_questions`: `allow read, write: if false` |
| Seed | `functions/seedExamQuestions.mjs` | Local-run upsert of `data/exam-question-bank.firestore.json` |
| Bank loader + logic | `functions/examBank.js` (replaces `practiceBank.js`) | `loadBank`, `buildTimedSession`, `scoreSession`, `buildPracticeQuestions` |
| Timed start | `functions/startExam.js` | reads bank → stores session w/ key → returns sanitized timed Qs |
| Timed submit | `functions/submitExam.js` | scores from stored session → writes attempt → returns score + timed explanations |
| Practice fetch | `functions/getPracticeExam.js` (**new**, unauth allowed) | reads bank → returns 60 practice Qs **with** key + explanation |
| Client fns | `web/src/lib/examFunctions.js` | add `getPracticeExamFn` |
| Practice flow | `web/src/hooks/useExamAttempts.js` | practice `startAttempt` calls the function (async), builds server-resolved instances |
| Engine | `web/src/lib/practiceEngine.js` | `scoreAttempt` reads `inst.opts[].correct`; drop `BANK`/`renderInstance`/`createAttempt` |
| Runner/Results | `ExamRunner.jsx`, `ResultsReview.jsx` | both modes server-resolved; practice carries its key on the instance |
| Retire | `web/src/data/practiceQuestions.js`, in-code bank in `practiceBank.js` | deleted |

## 3. Data contracts

**`getPracticeExam()` → returns** (practice answers are public):
```js
{ questions: [ { qid, domain, stem: "<resolved string>",
                 opts: [ { text: "<resolved string>", correct: <bool> } ],  // 4 opts, shuffled
                 explanation: "<string>" } ] }   // 60 items
```

**`startExam({mode:'timed'})` → returns** (unchanged contract; no key):
```js
{ sessionId, mode:'timed', questions: [ { qid, domain, stem, opts: [ { text } ] } ] }
```
Stored session instance (server-only, in `exam_sessions`): `{ qid, domain, optOrder, correctOrigIdx, explanation }` — enough to score and reveal without re-reading the bank.

**`submitExam({sessionId, answers})` → returns** (unchanged): `{ score, review }` where `review[i] = { idx, qid, domain, correctDisplayPos, selectedPos, isCorrect, explanation }`.

**Client instance shapes**
- Practice instance: `{ qid, domain, stem, opts:[{text,correct}], explanation, _serverResolved:true }`
- Timed instance: `{ qid, domain, stem, opts:[{text}], _serverResolved:true }` (review arrives from `submitExam`)

## 4. Resolution helpers (new shape → display)

`buildTimedSession(bank)` per question: pick `stemIdx`, shuffle `optOrder` over the 4 options, pick a `timed` phrasing per option; sanitized opt text = `options[origIdx].timed[k % len]`; **no `correct`**. `correctOrigIdx = correctIndex`.

`buildPracticeQuestions(bank)`: shuffle the 60; per question pick `stemIdx`, shuffle option order, pick a `practice` phrasing per option; emit opt `{ text, correct: origIdx === correctIndex }` and the `explanation`.

## 5. Isolation guarantees (unchanged intent)

1. `exam_questions` unreadable by clients (rules).
2. Timed payloads never include `correct`/`correctIndex`/`explanation` (revealed only by `submitExam`).
3. Timed uses `timed` wordings; practice uses `practice` wordings — disjoint, so practice study doesn't reveal timed option text.
4. Practice deliberately returns its key (public study mode).

## 6. Auth

- `getPracticeExam`: unauthenticated allowed (free/public study).
- `startExam`/`submitExam`/`postToLeaderboard`: unchanged (timed is sign-in gated).

## 7. Out of scope

Admin UI for editing questions; pool>60 / weighted draw (bank is fixed 60); leaderboard delete callable (pre-existing follow-up).
