# ctracer — Project Structure Design

**Date:** 2026-05-25
**Status:** Approved
**Scope:** Monorepo layout, CLAUDE.md hierarchy, project spec, and architectural decisions. Does not cover implementation of any individual screen or feature.

---

## 1. Project Overview

**ctracer** is a monorepo containing two apps for tracking preparation and progress toward the Claude Certified Architect – Foundations (CCA-F) certification.

The CCA-F is Anthropic's first official technical credential (launched March 12, 2026). It is a proctored, 60-question, 120-minute exam testing production-grade Claude API architecture. Passing score: 720/1,000. Cost: $99. Requires Claude Partner Network membership to sit.

The apps serve as a personal learning management system: a roadmap, progress tracker, study guide, and exam-day checklist — all driven by real certification content.

---

## 2. Apps

### 2.1 Web App (free, public)

- **Tech:** Vite + React
- **Deployment:** Firebase Hosting
- **Access:** Free for anyone; no account required to use
- **Auth:** Optional — email/password or Google via Firebase Auth
- **Purpose:** Guided study hub with progress tracking, domain deep-dives, course and project tracking, key concept reference, and exam-day checklist

### 2.2 Mobile App ($1.99 one-time purchase)

- **Tech:** Flutter
- **Deployment:** Google Play Store + Apple App Store
- **Access:** $1.99 one-time purchase
- **Auth:** Optional — same Firebase Auth as web
- **Purpose:** Feature-equivalent to web app, plus a flashcard/MC quiz mode for exam practice

---

## 3. Architecture

### 3.1 Firebase Project

One Firebase project shared by both apps:

| Service | Role |
|---|---|
| Firebase Auth | Email/password and Google sign-in |
| Firestore | Persisted user progress (signed-in users only) |
| Firebase Hosting | Web app deployment |

Firebase Functions are **not used**. Both clients connect directly to Firestore and Auth via their respective SDKs. All access control is enforced through Firestore security rules.

### 3.2 Storage Strategy

Progress data has two storage modes depending on auth state:

| State | Storage |
|---|---|
| Not signed in | localStorage (web) / SharedPreferences (mobile) |
| Signed in | Firestore — source of truth |

**Rules:**
- Local storage is session-only scaffolding, not a sync target.
- On sign-in: Firestore data loads and local storage is discarded. On first sign-in with existing local progress, the implementation may optionally offer to merge local progress up to Firestore.
- On sign-out: app falls back to local storage. Firestore data is not wiped locally.
- Both web and mobile implement a thin **storage service** that switches transparently between local and Firestore so screens have no direct knowledge of which backend is active.

### 3.3 Static Content

Domain definitions, course listings, study plan phases, and quiz questions are hardcoded in each app's `data/` directory. They are not stored in Firestore. This keeps the data model simple and avoids unnecessary reads.

---

## 4. Directory Layout

```
ctracer/
├── CLAUDE.md                        # monorepo overview, links to spec, git conventions
├── firebase.json                    # Firebase Hosting config (→ web/dist)
├── .firebaserc                      # Firebase project alias
├── firestore.rules                  # Firestore security rules
├── firestore.indexes.json           # Composite indexes
├── .gitignore
│
├── docs/
│   ├── spec.md                      # living project spec (this document's canonical home)
│   └── superpowers/
│       └── specs/                   # design docs from brainstorming sessions
│
├── web/                             # Vite + React
│   ├── CLAUDE.md
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── screens/
│       │   ├── Dashboard.jsx
│       │   ├── ExamBlueprint.jsx
│       │   ├── StudyPlan.jsx
│       │   ├── Courses.jsx
│       │   ├── Projects.jsx
│       │   ├── DomainDeepDive.jsx
│       │   ├── KeyConcepts.jsx
│       │   ├── ExamDayChecklist.jsx
│       │   ├── Profile.jsx
│       │   └── MobileDownload.jsx
│       ├── components/              # reusable UI pieces
│       ├── data/                    # hardcoded static content
│       ├── hooks/                   # custom React hooks
│       └── lib/                    # Firebase SDK init, storage service, auth helpers
│
└── mobile/                          # Flutter
    ├── CLAUDE.md
    ├── pubspec.yaml
    └── lib/
        ├── screens/
        │   ├── dashboard_screen.dart
        │   ├── exam_blueprint_screen.dart
        │   ├── study_plan_screen.dart
        │   ├── courses_screen.dart
        │   ├── projects_screen.dart
        │   ├── domain_deep_dive_screen.dart
        │   ├── key_concepts_screen.dart
        │   ├── exam_day_screen.dart
        │   ├── flashcards_screen.dart  # mobile-only
        │   └── profile_screen.dart
        ├── widgets/                 # reusable UI widgets (mirrors web/components)
        ├── data/                    # hardcoded static content (mirrors web/data)
        ├── hooks/                   # state management (Provider or Riverpod)
        └── services/                # Firebase init, storage service, auth helpers
```

**Mirroring rule:** `web/src/X/` maps to `mobile/lib/X/`, except:
- `web/src/components/` → `mobile/lib/widgets/` (idiomatic Flutter name)
- `web/src/lib/` → `mobile/lib/services/` (idiomatic Flutter name)

Screen naming follows platform convention: PascalCase `.jsx` for React, `snake_case_screen.dart` for Flutter.

---

## 5. Screens

| Screen | Web | Mobile | Notes |
|---|---|---|---|
| Dashboard | ✓ | ✓ | |
| Exam Blueprint | ✓ | ✓ | |
| Study Plan | ✓ | ✓ | |
| Courses | ✓ | ✓ | |
| Projects | ✓ | ✓ | |
| Domain Deep Dive | ✓ | ✓ | One template, 5 domains |
| Key Concepts | ✓ | ✓ | |
| Exam Day Checklist | ✓ | ✓ | |
| Profile | ✓ | ✓ | Account info, sign out |
| Mobile Download | ✓ | — | Web only — App Store / Play Store links |
| Flashcards / Quiz | — | ✓ | Mobile only — MC flashcard drill mode |

---

## 6. CLAUDE.md Hierarchy

### `/CLAUDE.md` (root)
- What ctracer is and its two-app structure
- Link to `docs/spec.md` as the source of truth for all decisions
- Firebase project setup notes
- Git conventions: branch naming (`feature/`, `fix/`), commit style
- What belongs in each package's CLAUDE.md vs. the root

### `/web/CLAUDE.md`
- Vite + React setup and dev commands
- Firebase SDK initialization pattern (`lib/firebase.js`)
- Storage service interface (how screens access progress data)
- Screen vs. component distinction and file naming
- Routing approach
- Styling conventions

### `/mobile/CLAUDE.md`
- Flutter project structure and FlutterFire setup
- Storage service interface (mirrors web pattern)
- Screen vs. widget distinction and Dart naming conventions
- State management package choice (Provider or Riverpod — to be decided at implementation)
- How the screen list mirrors the web app

---

## 7. Data Model (Firestore)

Progress data per user. Static content is never stored in Firestore.

```
users/{uid}/
  progress/
    courses:    { [courseId]: boolean }     # completion toggle
    projects:   { [projectId]: string }     # "not_started" | "in_progress" | "complete"
    tasks:      { [taskId]: boolean }       # study plan task checkboxes
    exam_day:   { [checklistItemId]: boolean }
```

Local storage (unauthenticated) uses the same shape, serialized to JSON.

---

## 8. Auth

- **Providers:** Email/password, Google
- **Anonymous use:** Fully supported. Progress stored locally; no account required.
- **Sign-in flow:** User can sign in at any time. On sign-in, Firestore data takes over; local storage is discarded.
- **First sign-in merge:** Implementation may offer to merge local progress into Firestore on first sign-in (decision deferred to implementation).
- **Sign-out:** App returns to local storage. Firestore data is not cleared.

---

## 9. Deployment

| Target | Method |
|---|---|
| Web | `firebase deploy` (Firebase Hosting, deploys `web/dist`) |
| Android | Google Play Store — $1.99 one-time purchase |
| iOS | Apple App Store — $1.99 one-time purchase |

---

## 10. Design Reference

The visual design is defined in a Claude Design export. The prototype is an 8-screen interactive React app with:
- Dark theme, modern SaaS aesthetic (Linear/Vercel influenced)
- Domain color coding: D1 amber, D2 violet, D3 emerald, D4 sky, D5 pink
- Persistent sidebar navigation

The Claude Design export lives at `docs/superpowers/specs/` and its source files (`data.js`, `screens-a.jsx`, `screens-b.jsx`, `components.jsx`, `styles.css`) are the visual source of truth for all UI implementation decisions.

---

## 11. Out of Scope

- Firebase Functions (deferred — only needed if notifications, scheduled jobs, or hidden API keys are required)
- Push notifications
- In-app purchase implementation details (handled by App Store / Play Store)
- Social sharing or leaderboards
- Content management via Firestore (all study content is hardcoded)
