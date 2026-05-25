# ctracer — Project Spec

> Living source of truth for all implementation decisions.
> Design history: `docs/superpowers/specs/2026-05-25-ctracer-project-structure-design.md`
> Update this file as decisions change; don't let it go stale.

## What This Is

ctracer is a monorepo for two apps that help users prepare for the Claude Certified Architect – Foundations (CCA-F) certification exam.

**CCA-F quick facts:** 60 questions, 120 min, passing score 720/1000, cost $99. Requires Claude Partner Network membership to sit the exam.

## Apps

| App | Tech | Access | Deployment |
|---|---|---|---|
| Web | Vite + React | Free, public | Firebase Hosting |
| Mobile | Flutter | $1.99 one-time | App Store + Play Store |

## Tech Stack

| Layer | Technology |
|---|---|
| Web frontend | Vite + React |
| Mobile frontend | Flutter (Dart) |
| Authentication | Firebase Auth (email/password + Google) |
| Database | Firestore |
| Hosting | Firebase Hosting (web only) |
| Backend logic | None — clients connect directly to Firebase |

## Architecture Decision: No Firebase Functions

Both clients use the Firebase SDK directly. Firestore security rules enforce access control. Functions are not used and not planned unless a use case requires server-side logic (e.g. email notifications, hidden API keys).

## Storage Strategy

| Auth state | Web | Mobile |
|---|---|---|
| Signed out | localStorage | SharedPreferences |
| Signed in | Firestore | Firestore |

On sign-in, Firestore data takes over. Local storage is discarded. On first sign-in with existing local data, implementation may offer to merge local progress into Firestore (decision deferred to implementation).

Each app implements a storage service that switches transparently between local and Firestore. Screens and widgets never call localStorage or Firestore directly.

## Screens

| Screen | Web | Mobile |
|---|---|---|
| Dashboard | ✓ | ✓ |
| Exam Blueprint | ✓ | ✓ |
| Study Plan | ✓ | ✓ |
| Courses | ✓ | ✓ |
| Projects | ✓ | ✓ |
| Domain Deep Dive | ✓ | ✓ |
| Key Concepts | ✓ | ✓ |
| Exam Day Checklist | ✓ | ✓ |
| Profile | ✓ | ✓ |
| Mobile Download | ✓ | — |
| Flashcards / Quiz | — | ✓ |

## Firestore Data Model

Progress is stored per user. Static content (domains, courses, study plan, quiz questions) is hardcoded in each app's `data/` directory — never in Firestore.

```
users/{uid}/
  progress/
    courses:   { [courseId: string]: boolean }
    projects:  { [projectId: string]: "not_started" | "in_progress" | "complete" }
    tasks:     { [taskId: string]: boolean }
    exam_day:  { [itemId: string]: boolean }
```

Local storage uses the same shape, serialized to JSON.

## Auth

- Email/password and Google sign-in via Firebase Auth
- Anonymous (unauthenticated) use is fully supported
- Sign-in is never required to access any feature

## Design Reference

Visual design: Claude Design prototype with 8 screens (dark theme, Linear/Vercel aesthetic).
Source files: `docs/superpowers/specs/` — `data.js`, `screens-a.jsx`, `screens-b.jsx`, `components.jsx`, `styles.css`

Domain color coding (consistent across both apps):
- D1 Agentic: amber
- D2 Claude Code: violet
- D3 Prompt Engineering: emerald
- D4 Tools & MCP: sky
- D5 Context & Memory: pink

## Out of Scope

- Firebase Functions
- Push notifications
- In-app purchase implementation (handled by app stores)
- Social features, leaderboards, sharing
- Content management via Firestore (all study content is hardcoded)
