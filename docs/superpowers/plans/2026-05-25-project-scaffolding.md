# ctracer — Project Scaffolding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the complete monorepo directory structure, Firebase configuration files, screen stubs, CLAUDE.md hierarchy, and living spec as defined in `docs/superpowers/specs/2026-05-25-ctracer-project-structure-design.md`.

**Architecture:** Firebase config at repo root (Option A). Two independent app packages — `web/` (Vite + React) and `mobile/` (Flutter) — with mirrored directory structures. No shared build tooling, no Firebase Functions.

**Tech Stack:** Vite + React (web), Flutter/Dart (mobile), Firebase Auth + Firestore + Hosting, firebase npm SDK, FlutterFire plugin suite.

---

## File Map

| File | Action |
|---|---|
| `firebase.json` | Create |
| `.firebaserc` | Create — **replace `YOUR_PROJECT_ID`** with your Firebase project ID |
| `firestore.rules` | Create |
| `firestore.indexes.json` | Create |
| `.gitignore` | Create |
| `CLAUDE.md` | Create |
| `docs/spec.md` | Create |
| `web/` | Scaffold via Vite CLI |
| `web/CLAUDE.md` | Create |
| `web/src/screens/*.jsx` | Create — 10 stub files |
| `web/src/components/` | Create |
| `web/src/data/` | Create |
| `web/src/hooks/` | Create |
| `web/src/lib/` | Create |
| `mobile/` | Scaffold via Flutter CLI |
| `mobile/CLAUDE.md` | Create |
| `mobile/lib/screens/*.dart` | Create — 10 stub files |
| `mobile/lib/widgets/` | Create |
| `mobile/lib/data/` | Create |
| `mobile/lib/hooks/` | Create |
| `mobile/lib/services/` | Create |

---

## Prerequisite

Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com) before starting. Enable **Firestore** and **Authentication** (email/password + Google providers) in the Firebase console. Note your **Project ID** — you will need it in Task 1.

Install the Firebase CLI if not already present:

```bash
npm install -g firebase-tools
firebase login
```

---

## Task 1: Root Firebase config and .gitignore

**Files:**
- Create: `firebase.json`
- Create: `.firebaserc`
- Create: `firestore.rules`
- Create: `firestore.indexes.json`
- Create: `.gitignore`

- [ ] **Step 1: Create `firebase.json`**

```json
{
  "hosting": {
    "public": "web/dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

- [ ] **Step 2: Create `.firebaserc`**

Replace `YOUR_PROJECT_ID` with your actual Firebase project ID (e.g. `ctracer-abc12`).

```json
{
  "projects": {
    "default": "YOUR_PROJECT_ID"
  }
}
```

- [ ] **Step 3: Create `firestore.rules`**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

- [ ] **Step 4: Create `firestore.indexes.json`**

```json
{
  "indexes": [],
  "fieldOverrides": []
}
```

- [ ] **Step 5: Create `.gitignore`**

```
# Node
node_modules/
dist/
.env
.env.local

# Firebase
.firebase/
firebase-debug.log
.firebaserc.local

# Flutter
mobile/.dart_tool/
mobile/build/
mobile/.flutter-plugins
mobile/.flutter-plugins-dependencies
mobile/android/local.properties
mobile/ios/Pods/
mobile/*.iml
mobile/android/.gradle/
mobile/ios/.symlinks/

# OS
.DS_Store
Thumbs.db
```

- [ ] **Step 6: Verify Firebase CLI reads the project**

```bash
firebase projects:list
```

Expected: your Firebase project appears in the list. If not, run `firebase login` first.

- [ ] **Step 7: Commit**

```bash
git add firebase.json .firebaserc firestore.rules firestore.indexes.json .gitignore
git commit -m "chore: add root Firebase config and gitignore"
```

---

## Task 2: Scaffold web app (Vite + React + Firebase SDK)

**Files:**
- Create: `web/` (via Vite CLI)
- Modify: `web/package.json` (firebase added)
- Delete: `web/src/App.jsx`, `web/src/App.css`, `web/src/assets/react.svg`, `web/public/vite.svg` (Vite boilerplate, replaced in Task 3)

- [ ] **Step 1: Scaffold Vite + React app**

Run from the repo root:

```bash
npm create vite@latest web -- --template react
```

Expected output ends with:
```
Done. Now run:
  cd web
  npm install
  npm run dev
```

- [ ] **Step 2: Install dependencies**

```bash
cd web && npm install && npm install firebase
```

Expected: `node_modules/` created, `package.json` updated with `"firebase": "^..."`.

- [ ] **Step 3: Verify the dev server starts**

```bash
npm run dev
```

Expected output includes:
```
  VITE v5.x.x  ready in ... ms
  ➜  Local:   http://localhost:5173/
```

Press `q` to stop.

- [ ] **Step 4: Remove Vite boilerplate files**

From `web/`:

```bash
rm src/App.jsx src/App.css src/index.css
rm -f src/assets/react.svg public/vite.svg
```

- [ ] **Step 5: Commit**

```bash
cd ..
git add web/
git commit -m "chore: scaffold web app with Vite + React and Firebase SDK"
```

---

## Task 3: Web src directory structure and screen stubs

**Files:**
- Create: `web/src/screens/Dashboard.jsx`
- Create: `web/src/screens/ExamBlueprint.jsx`
- Create: `web/src/screens/StudyPlan.jsx`
- Create: `web/src/screens/Courses.jsx`
- Create: `web/src/screens/Projects.jsx`
- Create: `web/src/screens/DomainDeepDive.jsx`
- Create: `web/src/screens/KeyConcepts.jsx`
- Create: `web/src/screens/ExamDayChecklist.jsx`
- Create: `web/src/screens/Profile.jsx`
- Create: `web/src/screens/MobileDownload.jsx`
- Create: `web/src/components/.gitkeep`
- Create: `web/src/data/.gitkeep`
- Create: `web/src/hooks/.gitkeep`
- Create: `web/src/lib/.gitkeep`
- Modify: `web/src/main.jsx`

- [ ] **Step 1: Create screen stub files**

Each screen is a minimal named export. Create all ten:

`web/src/screens/Dashboard.jsx`:
```jsx
export default function Dashboard() {
  return <div>Dashboard</div>;
}
```

`web/src/screens/ExamBlueprint.jsx`:
```jsx
export default function ExamBlueprint() {
  return <div>Exam Blueprint</div>;
}
```

`web/src/screens/StudyPlan.jsx`:
```jsx
export default function StudyPlan() {
  return <div>Study Plan</div>;
}
```

`web/src/screens/Courses.jsx`:
```jsx
export default function Courses() {
  return <div>Courses</div>;
}
```

`web/src/screens/Projects.jsx`:
```jsx
export default function Projects() {
  return <div>Projects</div>;
}
```

`web/src/screens/DomainDeepDive.jsx`:
```jsx
export default function DomainDeepDive() {
  return <div>Domain Deep Dive</div>;
}
```

`web/src/screens/KeyConcepts.jsx`:
```jsx
export default function KeyConcepts() {
  return <div>Key Concepts</div>;
}
```

`web/src/screens/ExamDayChecklist.jsx`:
```jsx
export default function ExamDayChecklist() {
  return <div>Exam Day Checklist</div>;
}
```

`web/src/screens/Profile.jsx`:
```jsx
export default function Profile() {
  return <div>Profile</div>;
}
```

`web/src/screens/MobileDownload.jsx`:
```jsx
export default function MobileDownload() {
  return <div>Mobile Download</div>;
}
```

- [ ] **Step 2: Create placeholder files for empty directories**

```bash
touch web/src/components/.gitkeep
touch web/src/data/.gitkeep
touch web/src/hooks/.gitkeep
touch web/src/lib/.gitkeep
```

- [ ] **Step 3: Update `web/src/main.jsx` to a clean entry point**

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Dashboard from './screens/Dashboard.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Dashboard />
  </StrictMode>
);
```

- [ ] **Step 4: Verify the app still builds**

```bash
cd web && npm run build
```

Expected: `dist/` created, no errors.

- [ ] **Step 5: Commit**

```bash
cd ..
git add web/src/
git commit -m "chore: add web screen stubs and src directory structure"
```

---

## Task 4: Scaffold mobile app (Flutter + FlutterFire)

**Files:**
- Create: `mobile/` (via Flutter CLI)
- Modify: `mobile/pubspec.yaml` (FlutterFire packages added)

**Prerequisite:** Flutter SDK installed (`flutter --version` should return 3.x+). Run `flutter doctor` and resolve any issues before this task.

- [ ] **Step 1: Scaffold Flutter app**

Run from the repo root:

```bash
flutter create mobile --org com.ctracer --project-name ctracer_mobile
```

Expected output ends with:
```
All done!
```

- [ ] **Step 2: Add FlutterFire and shared_preferences to `mobile/pubspec.yaml`**

Open `mobile/pubspec.yaml`. Replace the `dependencies:` block with:

```yaml
dependencies:
  flutter:
    sdk: flutter
  firebase_core: ^3.3.0
  firebase_auth: ^5.1.0
  cloud_firestore: ^5.2.0
  shared_preferences: ^2.3.0
  cupertino_icons: ^1.0.8
```

- [ ] **Step 3: Install packages**

```bash
cd mobile && flutter pub get
```

Expected: `Resolving dependencies...` then `Got dependencies!` with no errors.

- [ ] **Step 4: Verify the app compiles**

```bash
flutter build apk --debug 2>&1 | tail -5
```

Expected last line: `✓ Built build/app/outputs/flutter-apk/app-debug.apk`

If no Android SDK is configured, run `flutter build web --debug` instead and expect `✓ Built build/web`.

- [ ] **Step 5: Commit**

```bash
cd ..
git add mobile/
git commit -m "chore: scaffold Flutter app with FlutterFire dependencies"
```

---

## Task 5: Mobile lib directory structure and screen stubs

**Files:**
- Delete: `mobile/lib/main.dart` (replaced below)
- Create: `mobile/lib/screens/dashboard_screen.dart`
- Create: `mobile/lib/screens/exam_blueprint_screen.dart`
- Create: `mobile/lib/screens/study_plan_screen.dart`
- Create: `mobile/lib/screens/courses_screen.dart`
- Create: `mobile/lib/screens/projects_screen.dart`
- Create: `mobile/lib/screens/domain_deep_dive_screen.dart`
- Create: `mobile/lib/screens/key_concepts_screen.dart`
- Create: `mobile/lib/screens/exam_day_screen.dart`
- Create: `mobile/lib/screens/flashcards_screen.dart`
- Create: `mobile/lib/screens/profile_screen.dart`
- Create: `mobile/lib/widgets/.gitkeep`
- Create: `mobile/lib/data/.gitkeep`
- Create: `mobile/lib/hooks/.gitkeep`
- Create: `mobile/lib/services/.gitkeep`
- Modify: `mobile/lib/main.dart`

- [ ] **Step 1: Create screen stub files**

Each screen is a minimal `StatelessWidget`. Create all ten:

`mobile/lib/screens/dashboard_screen.dart`:
```dart
import 'package:flutter/material.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text('Dashboard')));
  }
}
```

`mobile/lib/screens/exam_blueprint_screen.dart`:
```dart
import 'package:flutter/material.dart';

class ExamBlueprintScreen extends StatelessWidget {
  const ExamBlueprintScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text('Exam Blueprint')));
  }
}
```

`mobile/lib/screens/study_plan_screen.dart`:
```dart
import 'package:flutter/material.dart';

class StudyPlanScreen extends StatelessWidget {
  const StudyPlanScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text('Study Plan')));
  }
}
```

`mobile/lib/screens/courses_screen.dart`:
```dart
import 'package:flutter/material.dart';

class CoursesScreen extends StatelessWidget {
  const CoursesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text('Courses')));
  }
}
```

`mobile/lib/screens/projects_screen.dart`:
```dart
import 'package:flutter/material.dart';

class ProjectsScreen extends StatelessWidget {
  const ProjectsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text('Projects')));
  }
}
```

`mobile/lib/screens/domain_deep_dive_screen.dart`:
```dart
import 'package:flutter/material.dart';

class DomainDeepDiveScreen extends StatelessWidget {
  const DomainDeepDiveScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text('Domain Deep Dive')));
  }
}
```

`mobile/lib/screens/key_concepts_screen.dart`:
```dart
import 'package:flutter/material.dart';

class KeyConceptsScreen extends StatelessWidget {
  const KeyConceptsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text('Key Concepts')));
  }
}
```

`mobile/lib/screens/exam_day_screen.dart`:
```dart
import 'package:flutter/material.dart';

class ExamDayScreen extends StatelessWidget {
  const ExamDayScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text('Exam Day Checklist')));
  }
}
```

`mobile/lib/screens/flashcards_screen.dart`:
```dart
import 'package:flutter/material.dart';

class FlashcardsScreen extends StatelessWidget {
  const FlashcardsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text('Flashcards')));
  }
}
```

`mobile/lib/screens/profile_screen.dart`:
```dart
import 'package:flutter/material.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text('Profile')));
  }
}
```

- [ ] **Step 2: Create placeholder files for empty directories**

```bash
touch mobile/lib/widgets/.gitkeep
touch mobile/lib/data/.gitkeep
touch mobile/lib/hooks/.gitkeep
touch mobile/lib/services/.gitkeep
```

- [ ] **Step 3: Update `mobile/lib/main.dart` to a clean entry point**

```dart
import 'package:flutter/material.dart';
import 'screens/dashboard_screen.dart';

void main() {
  runApp(const CtracerApp());
}

class CtracerApp extends StatelessWidget {
  const CtracerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ctracer',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF6D28D9)),
        useMaterial3: true,
      ),
      home: const DashboardScreen(),
    );
  }
}
```

- [ ] **Step 4: Verify the app still compiles**

```bash
cd mobile && flutter build apk --debug 2>&1 | tail -3
```

Expected: `✓ Built build/app/outputs/flutter-apk/app-debug.apk`

- [ ] **Step 5: Commit**

```bash
cd ..
git add mobile/lib/
git commit -m "chore: add mobile screen stubs and lib directory structure"
```

---

## Task 6: Root CLAUDE.md

**Files:**
- Create: `CLAUDE.md`

- [ ] **Step 1: Create `CLAUDE.md`**

```markdown
# ctracer

A monorepo for two apps that track progress toward the Claude Certified Architect – Foundations (CCA-F) certification.

## Source of Truth

All architecture and implementation decisions are documented in `docs/spec.md`. Read it before making structural changes to either app.

Design history and brainstorming artifacts live in `docs/superpowers/specs/`.
Implementation plans live in `docs/superpowers/plans/`.

## Repository Structure

```
ctracer/
├── firebase.json          # Firebase Hosting config → web/dist
├── firestore.rules        # Firestore security rules (the only "backend" logic)
├── web/                   # Vite + React (free, public)
└── mobile/                # Flutter ($1.99 one-time purchase)
```

Each app has its own CLAUDE.md with platform-specific guidance.

## Apps

- **web/** — Study hub web app. Free for anyone. Firebase Hosting.
- **mobile/** — Feature-equivalent mobile app + flashcard quiz mode. Flutter. App Store + Play Store.

## Firebase

One Firebase project serves both apps:
- **Auth** — email/password and Google sign-in (optional for users)
- **Firestore** — persisted progress for signed-in users
- **Hosting** — web app deployment (`firebase deploy`)

No Firebase Functions are used. Both clients connect directly to Firestore and Auth via their SDKs.

## Storage Strategy

| Auth state | Storage |
|---|---|
| Signed out | localStorage (web) / SharedPreferences (mobile) |
| Signed in | Firestore — source of truth |

On sign-in, Firestore data takes over and local storage is discarded.

## Git Conventions

- Branch names: `feature/<short-description>` or `fix/<short-description>`
- Commit style: imperative present tense (`add`, `fix`, `update`, `remove`)
- Prefix: `feat:` for features, `fix:` for bugs, `chore:` for scaffolding/config, `docs:` for documentation

## What Belongs in Each CLAUDE.md

- **Root (this file):** monorepo overview, Firebase setup, storage strategy, git conventions
- **web/CLAUDE.md:** React/Vite conventions, component patterns, Firebase SDK usage
- **mobile/CLAUDE.md:** Flutter/Dart conventions, widget patterns, FlutterFire usage
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add root CLAUDE.md with monorepo overview"
```

---

## Task 7: web/CLAUDE.md

**Files:**
- Create: `web/CLAUDE.md`

- [ ] **Step 1: Create `web/CLAUDE.md`**

```markdown
# web — Vite + React

The web app for ctracer. A free, public study hub for the CCA-F certification exam.

## Setup and Dev Commands

```bash
npm install       # install dependencies
npm run dev       # start dev server at http://localhost:5173
npm run build     # build to dist/ for Firebase Hosting
npm run preview   # preview the production build locally
```

Deploy: `firebase deploy --only hosting` from the repo root.

## Architecture

**No backend.** The app connects directly to Firebase Auth and Firestore via the Firebase JS SDK.

Storage service (`src/lib/storage.js`) abstracts local vs. Firestore reads/writes. All screens use this service — never call `localStorage` or Firestore directly from a screen component.

## Directory Structure

```
src/
├── screens/      # one file per top-level screen (named export, PascalCase)
├── components/   # reusable UI pieces (named exports, PascalCase)
├── data/         # hardcoded static content (domains, courses, study plan)
├── hooks/        # custom React hooks (named, camelCase, prefix with "use")
└── lib/          # Firebase SDK init, storage service, auth helpers
```

## Naming Conventions

- Screen files: `PascalCase.jsx` — e.g. `DomainDeepDive.jsx`
- Component files: `PascalCase.jsx` — e.g. `ProgressBar.jsx`
- Hook files: `useCamelCase.js` — e.g. `useProgress.js`
- Data files: `camelCase.js` — e.g. `domains.js`, `courses.js`
- Lib files: `camelCase.js` — e.g. `firebase.js`, `storage.js`

## Screen vs. Component

- **Screen:** maps 1:1 to a route. Lives in `src/screens/`. Handles layout and data fetching via hooks.
- **Component:** reusable UI element. Lives in `src/components/`. Receives all data via props.

Screens do not call Firestore or localStorage directly — they use hooks (`src/hooks/`) which call the storage service.

## Firebase SDK Init

Firebase is initialized once in `src/lib/firebase.js` and imported wherever needed. Never initialize Firebase inside a component or hook.

## Static Content

Exam domains, courses, study plan, and quiz questions are defined in `src/data/` as plain JS objects. They are never stored in or fetched from Firestore.

## Styling

Follow the design system established in the Claude Design prototype:
- Dark theme as default
- Domain colors: D1 amber, D2 violet, D3 emerald, D4 sky, D5 pink
- Refer to `docs/superpowers/specs/` for the Claude Design source files
```

- [ ] **Step 2: Commit**

```bash
git add web/CLAUDE.md
git commit -m "docs: add web/CLAUDE.md with React/Vite conventions"
```

---

## Task 8: mobile/CLAUDE.md

**Files:**
- Create: `mobile/CLAUDE.md`

- [ ] **Step 1: Create `mobile/CLAUDE.md`**

```markdown
# mobile — Flutter

The mobile app for ctracer. $1.99 one-time purchase on App Store and Play Store.
Feature-equivalent to the web app, plus a flashcard/MC quiz mode.

## Setup and Dev Commands

```bash
flutter pub get          # install dependencies
flutter run              # run on connected device or emulator
flutter build apk        # build Android release APK
flutter build ios        # build iOS release (requires Xcode)
flutter build web        # build web output (for testing only)
```

## Architecture

**No backend.** The app connects directly to Firebase Auth and Firestore via the FlutterFire SDK.

Storage service (`lib/services/storage_service.dart`) abstracts local vs. Firestore reads/writes. All screens use this service — never call `SharedPreferences` or Firestore directly from a screen.

## Directory Structure

```
lib/
├── screens/      # one file per screen (StatelessWidget or StatefulWidget)
├── widgets/      # reusable UI widgets (mirrors web/src/components/)
├── data/         # hardcoded static content (mirrors web/src/data/)
├── hooks/        # state management providers (mirrors web/src/hooks/)
└── services/     # Firebase init, storage service, auth helpers (mirrors web/src/lib/)
```

## Naming Conventions

- Screen files: `snake_case_screen.dart` — class name: `PascalCaseScreen`
- Widget files: `snake_case_widget.dart` — class name: `PascalCaseWidget`
- Service files: `snake_case_service.dart` — class name: `PascalCaseService`
- Data files: `snake_case.dart` — e.g. `domains.dart`, `courses.dart`

## Screen vs. Widget

- **Screen:** maps 1:1 to a route. Lives in `lib/screens/`. Uses `Scaffold`. Reads state via providers in `lib/hooks/`.
- **Widget:** reusable UI element. Lives in `lib/widgets/`. Receives all data via constructor parameters.

Screens do not call SharedPreferences or Firestore directly — they use providers which call the storage service.

## Mirroring the Web App

The screen list mirrors the web app exactly, plus one mobile-only screen:

| Web screen | Mobile screen |
|---|---|
| Dashboard | DashboardScreen |
| ExamBlueprint | ExamBlueprintScreen |
| StudyPlan | StudyPlanScreen |
| Courses | CoursesScreen |
| Projects | ProjectsScreen |
| DomainDeepDive | DomainDeepDiveScreen |
| KeyConcepts | KeyConceptsScreen |
| ExamDayChecklist | ExamDayScreen |
| Profile | ProfileScreen |
| *(web only)* MobileDownload | — |
| — | FlashcardsScreen *(mobile only)* |

## State Management

Use **Provider** for state management. Each feature area (progress, auth) has its own `ChangeNotifier` in `lib/hooks/`.

## Static Content

Exam domains, courses, study plan, and quiz questions are defined in `lib/data/` as Dart objects. They are never stored in or fetched from Firestore.

## FlutterFire Setup

Firebase is initialized in `lib/main.dart` via `Firebase.initializeApp()`. Run `flutterfire configure` to generate the `firebase_options.dart` config file when connecting to the Firebase project.

## Styling

Match the web app's visual design:
- Dark theme as default
- Domain colors: D1 amber, D2 violet, D3 emerald, D4 sky, D5 pink
- Refer to `docs/superpowers/specs/` for the Claude Design source files
```

- [ ] **Step 2: Commit**

```bash
git add mobile/CLAUDE.md
git commit -m "docs: add mobile/CLAUDE.md with Flutter/Dart conventions"
```

---

## Task 9: Living project spec (`docs/spec.md`)

**Files:**
- Create: `docs/spec.md`

- [ ] **Step 1: Create `docs/spec.md`**

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add docs/spec.md
git commit -m "docs: add living project spec at docs/spec.md"
```

---

## Self-Review

**Spec coverage check:**
- Root Firebase config ✓ Task 1
- .gitignore ✓ Task 1
- Web scaffold ✓ Task 2
- Web src structure + screen stubs ✓ Task 3
- Mobile scaffold ✓ Task 4
- Mobile lib structure + screen stubs ✓ Task 5
- Root CLAUDE.md ✓ Task 6
- web/CLAUDE.md ✓ Task 7
- mobile/CLAUDE.md ✓ Task 8
- docs/spec.md ✓ Task 9
- All 10 web screens present ✓ (Dashboard, ExamBlueprint, StudyPlan, Courses, Projects, DomainDeepDive, KeyConcepts, ExamDayChecklist, Profile, MobileDownload)
- All 10 mobile screens present ✓ (same minus MobileDownload, plus Flashcards)
- Storage strategy documented in CLAUDE.md files ✓
- Mirroring rule documented ✓

**No placeholders, no TBDs, no "implement later" in any step.** The only open item is the Firebase project ID in `.firebaserc` — this is a genuine external dependency that cannot be known ahead of time and is clearly labelled.
