# Practice Exam — Design Spec

> Design history artifact. Source of truth for structural decisions is `docs/spec.md`.
> This spec amends two prior decisions in `docs/spec.md` (see "Spec Amendments" below).

## What This Is

A new top-level **Practice Exam** feature for both the web and mobile apps, scoped under
the **"Prep finish"** sidebar section (alongside Key Concepts and Exam Day). It is the
realization of the "Flashcards / Quiz" mode the mobile spec called out.

It provides two modes over a shared question bank, attempt history, and a global
competitive leaderboard. It is built around an anti-memorization question model and
server-validated scoring.

**Status:** Web implementation first; mobile follows. Design (this spec) covers both.

## Spec Amendments

This feature changes two decisions previously recorded in `docs/spec.md`:

1. **Firebase Functions are now in scope** (previously "No Firebase Functions"). The
   complexity of secure scoring and leaderboard integrity merits server-side logic. See
   "Firebase Functions" below. Functions remain scoped *only* to this feature; the rest
   of the apps continue to talk directly to Firestore/Auth.
2. **A leaderboard is now in scope** (previously "Social features, leaderboards, sharing"
   were out of scope). It is opt-in and privacy-respecting (see "Leaderboard").

## Modes

| | Timed Exam | Practice |
|---|---|---|
| Sign-in required | Yes | No (works signed-out) |
| Questions | 60 | 60 |
| Timer | 120-min countdown | None (untimed) |
| Feedback during exam | None | Instant, per question (correct/incorrect + explanation) |
| Selection | Domain-weighted | Domain-weighted |
| End-of-exam result | % score, pass/fail vs 72%, per-domain breakdown, full review | Same review surface; running tally |
| Leaderboard eligible | Yes (opt-in) | No |

**Domain-weighted selection** mirrors the real CCA-F blueprint counts (out of 60):

| Domain | Count |
|---|---|
| D1 Agentic | 16 |
| D2 Claude Code | 12 |
| D3 Prompt Engineering | 12 |
| D4 Tools & MCP | 11 |
| D5 Context & Memory | 9 |

The engine selects 60 questions from the bank weighted to these counts, shuffles option
order, and picks one phrasing per option per render (see Question Model).

## Scoring

- Plain **% correct** (we intentionally do not replicate the real exam's proprietary
  scaled 1000-point score). Pass line: **72%**.
- **Per-domain breakdown** in every result (correct / total per domain) so users see
  where they are weak.
- Scaled-score replication is explicitly out of scope — feedback and progress tracking
  matter more than mirroring the opaque scoring formula.

## Question Model

Content does not exist yet. The design uses **placeholder questions**. The user will
supply ~100 real questions later as a static data file (hardcoded in each app's `data/`
directory, per the project's content strategy — never in Firestore).

Each question:

```
question:
  id            # stable unique id
  domain        # "D1".."D5" — drives weighted selection and per-domain stats
  prompt        # the question stem
  explanation   # shown in feedback (practice) and review (both modes)
  options:      # exactly 4
    - id
      isCorrect # exactly one option is true
      phrasings # array of 2-3 equivalent wordings of this option
```

**Anti-memorization mechanic:** each option carries 2–3 interchangeable phrasings that
mean the same thing. On each render the engine picks one phrasing per option at random.
The correct *option* is always correct regardless of which phrasing shows, so users learn
the concept rather than memorizing a literal answer string. Option display order is also
shuffled per render.

Bank size ~100 questions; each timed/practice session draws a domain-weighted random 60.

## Firebase Functions

The answer key must never ship to the client, and leaderboard scores must not be
forgeable. Three scoped callable functions:

- **`startExam(mode)`** — server performs the domain-weighted selection of 60 questions,
  strips `isCorrect` from options, picks/locks the phrasing + option order for the
  session, records a session document, and returns the sanitized question set + a
  `sessionId`.
- **`submitExam(sessionId, answers)`** — server scores against the stored session, returns
  the result (overall %, pass/fail, per-domain breakdown, and the correct answers +
  explanations for the review screen), and persists the completed attempt.
- **`postToLeaderboard(handle | anonymous)`** — opt-in. Writes/updates the user's *best*
  timed score into a public, read-only leaderboard collection under the chosen display
  identity.

Practice mode may score client-side (no stakes, signed-out support), reusing the same
review UI. Timed mode always scores via Functions.

## Persistence & History

| Auth state | Storage | Scope |
|---|---|---|
| Signed in | Firestore (under the user) | All attempts: mode, score, per-domain, timestamp |
| Signed out | localStorage / SharedPreferences | Practice attempts only |

History view lists past attempts with score and date and shows a simple progress trend
over time.

Proposed Firestore shape (additive to existing `users/{uid}/progress`):

```
users/{uid}/
  exam_attempts/{attemptId}
    mode: "timed" | "practice"
    score: number            # percent
    passed: boolean
    perDomain: { D1: {correct, total}, ... }
    completedAt: timestamp

leaderboard/{uid}            # public, read-only to clients; written only via Function
    displayName: string | null   # null => shown as "Anonymous"
    anonymous: boolean
    bestScore: number
    updatedAt: timestamp
```

## Leaderboard

- **Global**, ranked, **best timed score per user** (one row per user — your best stands).
- **Opt-in**: a user must explicitly choose to post a score. Posting is never automatic.
- **Privacy**: when posting, a user picks a display **handle** or posts as **Anonymous**.
- Users can see their own rank even if they have not made themselves public.
- Rendered as a sub-view within the Practice Exam screen.
- Practice-mode scores never appear on the leaderboard.

## Navigation & Screen Structure

New sidebar item **"Practice Exam"** under the **"Prep finish"** group (with Key Concepts
and Exam Day). The screen is a hub with sub-views:

1. **Hub / landing** — mode picker (Timed Exam, Practice) + the user's stats snapshot
   (best score, attempts, last result, per-domain strengths).
2. **Exam runner** — one-question view with progress indicator; countdown timer in timed
   mode; instant per-question feedback in practice mode.
3. **Results & review** — overall %, pass/fail, per-domain breakdown, question-by-question
   review with explanations.
4. **History** — list of past attempts with trend.
5. **Leaderboard** — global ranked best-scores, opt-in to appear.

Sign-in prompts: Timed Exam is gated behind auth; Practice is open. Posting to the
leaderboard requires auth + explicit opt-in.

## Out of Scope (for this feature)

- Real scaled-score (1000-point) replication.
- Spaced repetition / adaptive difficulty.
- Time-window leaderboards (weekly/monthly) — single all-time global board only.
- Question authoring UI — content is hardcoded data, authored by the maintainer.
- Multiplayer / live head-to-head.
