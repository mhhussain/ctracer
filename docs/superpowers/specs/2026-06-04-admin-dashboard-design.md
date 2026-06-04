# Admin Dashboard — Design Spec

**Date:** 2026-06-04  
**Status:** Approved

## Overview

A local-only HTML admin dashboard for viewing all users' progress and exam performance. No build step, no hosting — open the file in a browser, sign in, and see the data.

## Goals

- See every signed-in user's study progress (courses, projects, tasks, overall %)
- See each user's exam attempts and best timed score
- Identify display names where available (from leaderboard)
- Read-only; no writes

## Non-Goals

- Deployment or hosting
- Mobile-responsiveness (desktop-only is fine)
- Real-time live updates (one snapshot on load is sufficient)
- Editing or managing users

## Architecture

### Files

| File | Purpose | Committed? |
|------|---------|-----------|
| `admin/dashboard.html` | Main dashboard page | Yes |
| `admin/firebase-config.local.js` | Firebase config values (populated from `web/.env.local`) | No — gitignored |

### Authentication

User signs in with email/password via an inline login form. Once authenticated, Firestore reads proceed using the signed-in user's UID. The admin rule gates access to all user data.

### Data Fetching

Three parallel Firestore reads after sign-in:

1. `collectionGroup('progress')` — all `users/{uid}/progress/data` documents
2. `collectionGroup('exam_attempts')` — all `users/{uid}/exam_attempts/{id}` documents  
3. `collection('leaderboard')` — display names keyed by UID

UIDs are extracted from document reference paths. Leaderboard entries provide display names; users without leaderboard entries show as their UID.

### Firestore Rules Change

Add an admin read rule to `firestore.rules`:

```
// Admin: read all user data
match /users/{uid}/{document=**} {
  allow read: if request.auth != null
    && request.auth.uid == 'IhQZq0x5G4apm7wJSaH20ODKhdv1';
}
```

This is additive — the existing owner-only rule remains unchanged.

## Dashboard Layout

Single-page table with one row per user:

| Column | Source |
|--------|--------|
| User | `leaderboard.displayName` or UID |
| Overall % | `progress.data` — computed from courses/projects/tasks |
| Courses done | `progress.courses` — count of `true` values |
| Projects done | `progress.projects` — count of `"complete"` values |
| Tasks done | `progress.tasks` — count of `true` values |
| Practice score | `progress.practiceScore` |
| Exam attempts | count of `exam_attempts` docs |
| Best timed score | max `score.pct` from timed `exam_attempts` |
| Passed? | any timed attempt where `score.pass === true` |

Rows sorted by overall % descending.

Clicking a row expands to show each exam attempt (date, mode, score, pass/fail, per-domain breakdown).

## Firebase Config

`admin/firebase-config.local.js` exports a single `firebaseConfig` object. It is loaded as a `<script>` tag before the main dashboard script. The `.gitignore` entry `admin/firebase-config.local.js` prevents accidental commit.

The file is populated at setup time from the values in `web/.env.local`.

## Styling

Minimal dark theme (consistent with app): dark background (`#0f1117`), white text, amber accent for headers. Simple `<table>` with `border-collapse`. No external CSS dependencies.

## Setup Instructions (in dashboard comment)

1. Copy `web/.env.local` values into `admin/firebase-config.local.js`
2. Run Firebase emulator or use production project
3. Open `admin/dashboard.html` in a browser
4. Sign in with your account
