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
