# Design Prompt — Practice Exam Section (paste into the existing Claude Design session)

> Copy everything below the line into your Claude Design session that already holds the
> CCA-F Study Hub design. It instructs the session to continue and design the full Practice
> Exam section for both web and mobile.

---

Continue from the existing CCA-F Study Hub design. I'm adding a new section called
**Practice Exam** and I want you to design the full thing — every screen and state — in
the established visual language (dark theme, Linear/Vercel aesthetic, the existing domain
color coding: D1 amber, D2 violet, D3 emerald, D4 sky, D5 pink). Design for **both the web
layout and the mobile layout**. Reuse existing components, spacing, typography, and the
sidebar/nav patterns already in the design — this should feel native to the app, not bolted
on.

## Where it lives
A new top-level nav item **"Practice Exam"** in the sidebar, inside the existing
**"Prep finish"** group (which already contains Key Concepts and Exam Day). On mobile,
surface it in the equivalent nav location. This is also the "Quiz" mode the mobile app
was always meant to have.

## What it is
A practice testing feature for the CCA-F exam with two modes over a shared question bank,
plus attempt history and a competitive leaderboard. Design the whole section as a hub with
sub-views.

## The two modes
- **Timed Exam** (sign-in required): 60 questions, a **120-minute countdown**, no feedback
  during the exam. On submit, the user sees their score and a full review. Eligible to post
  to the leaderboard.
- **Practice** (works signed-out): 60 questions, untimed, **instant feedback after each
  question** (correct/incorrect state + an explanation). Not on the leaderboard.

Both modes draw a domain-weighted set of 60 questions matching the real blueprint:
D1 ×16, D2 ×12, D3 ×12, D4 ×11, D5 ×9.

## Scoring shown to the user
Plain **% correct**, with a **72% pass line** (clear pass/fail treatment), plus a
**per-domain breakdown** (correct/total per domain, using the domain colors). No 1000-point
scaled score.

## Question + answer UI (important detail)
Every question is multiple choice with **exactly 4 options, one correct**. Each option has
2–3 equivalent phrasings and the app shows one at random per render, and shuffles option
order — so design the option list to look clean regardless of phrasing length. Use
**placeholder question and answer text** throughout (real content comes later). Each
question also has an **explanation** shown in practice-mode feedback and in end-of-exam
review.

## Screens / sub-views to design (web + mobile each)
1. **Hub / landing** — choose a mode (Timed Exam, Practice), plus the user's stats snapshot:
   best score, number of attempts, last result, per-domain strengths. Show the timed mode
   as sign-in-gated for signed-out users.
2. **Exam runner** — single-question view with a progress indicator (e.g. "Q12 of 60").
   Timed mode shows the **countdown timer** prominently; practice mode shows **instant
   feedback** after answering (correct option highlighted, explanation revealed, "Next"
   to continue). Design answered/unanswered/flagged states and a way to navigate/submit.
3. **Results & review** — overall % with pass/fail treatment against 72%, per-domain
   breakdown, and a question-by-question review with the correct answer + explanation.
   From here: a prompt to **post to the leaderboard** (timed mode only).
4. **History** — list of the user's past attempts (mode, score, date) with a simple
   progress trend over time.
5. **Leaderboard** — a global ranked board of **best timed score per user**. It is
   **opt-in**: design the flow where a user chooses to post and picks a **display handle**
   or posts as **Anonymous**. Users can see their own rank even if not public. Show the
   current user's row highlighted.

## States to cover
- Signed-out vs signed-in (timed mode gating; practice open to all).
- Empty states (no attempts yet, empty leaderboard).
- In-progress exam, time-running-low warning (timed), exam submitted.
- Per-question: unanswered, selected, correct/incorrect feedback (practice).
- Leaderboard opt-in / handle entry / anonymous toggle / not-yet-posted.

## Deliverable
Mockups for all five sub-views in **both web and mobile**, consistent with the existing
design system, plus any new shared components introduced (timer, progress bar, score ring,
per-domain bars, leaderboard row, option card). Note any new design tokens you add.

Use placeholders for all question/answer content — I'll supply ~100 real questions later.
