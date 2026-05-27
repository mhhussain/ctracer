# Firebase Web Integration Design

**Date:** 2026-05-26
**Status:** Approved
**Scope:** Firebase Auth + Firestore SDK integration for the web app, plus GitHub Actions for automated deployment and PR preview channels. Mobile integration is a separate future plan.

---

## 1. What This Covers

The web app's Firebase SDK stubs (`auth = null`, `db = null`) and localStorage-only storage service need to be replaced with real Firebase Auth and Firestore integration. Additionally, a CI/CD pipeline using GitHub Actions will automate production deployments and create per-PR preview URLs via Firebase Hosting preview channels.

---

## 2. Firebase Project (Already Done)

- **Project ID:** `iammoo-ctracer`
- **Firestore:** Created, production mode, nam5 region
- **Auth providers:** Email/password and Google
- **Security rules:** Deployed — users can only read/write their own `users/{uid}/**` path
- **Web app registered:** App ID `<your-firebase-app-id>`

---

## 3. Environment Configuration

Firebase config values are embedded in the Vite bundle as `VITE_FIREBASE_*` env vars. This is standard for Firebase web apps — the config is not secret (security is enforced by Firestore rules and Auth, not by hiding the config). Values live in `.env.local` for local dev and as GitHub secrets for CI.

`.env.local` (gitignored):
```
VITE_FIREBASE_API_KEY=<run: firebase apps:sdkconfig WEB to get this value>
VITE_FIREBASE_AUTH_DOMAIN=iammoo-ctracer.firebaseapp.com (derived from project ID)
VITE_FIREBASE_PROJECT_ID=iammoo-ctracer
VITE_FIREBASE_STORAGE_BUCKET=iammoo-ctracer.firebasestorage.app (derived from project ID)
VITE_FIREBASE_MESSAGING_SENDER_ID=<your-messaging-sender-id>
VITE_FIREBASE_APP_ID=<your-firebase-app-id>
```

---

## 4. Firebase SDK Init (`src/lib/firebase.js`)

Replace the null stubs with a real Firebase initialization. Export `auth` (Auth instance) and `db` (Firestore instance). All other modules import from here — never initialize Firebase inside a component or hook.

```js
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const app = initializeApp({ ...env vars... })
export const auth = getAuth(app)
export const db = getFirestore(app)
```

---

## 5. Auth Layer

### 5.1 Auth helpers (`src/lib/auth.js`)

Thin wrappers over the Firebase Auth SDK:
- `signInWithEmail(email, password)`
- `signInWithGoogle()` — uses `GoogleAuthProvider` + `signInWithPopup`
- `signOut()`

No state lives here — these are fire-and-forget functions.

### 5.2 Auth context (`src/lib/AuthContext.jsx`)

A React context that holds the current Firebase `User` (or `null`). Wraps the app and subscribes to `onAuthStateChanged`. Exposes `{ user, loading }` via `useContext(AuthContext)`.

`loading` is `true` only during the initial auth state resolution (Firebase checks for an existing session on app load — typically <500ms). Screens don't need to gate on `loading` except the Profile screen.

`App.jsx` wraps its route tree in `<AuthProvider>`.

### 5.3 `useAuth` hook (`src/hooks/useAuth.js`)

Convenience hook: `const { user, loading } = useAuth()`. Reads from `AuthContext`.

---

## 6. Storage Service Upgrade (`src/lib/storage.js`)

The current storage service is synchronous and localStorage-only. The upgraded service is auth-aware and exposes a subscription model so `useProgress` stays reactive.

### Interface

```js
// Subscribe to progress changes. Returns an unsubscribe function.
// When user is null → reads localStorage and calls cb immediately (sync).
// When user is set → attaches a Firestore onSnapshot listener.
subscribeToProgress(user, callback) → () => void

// Persist progress to the correct backend.
// When user is null → localStorage (sync).
// When user is set → Firestore setDoc with merge (async, fire-and-forget).
saveProgress(user, progress) → void

// Clear localStorage (used on sign-out fallback reset).
clearProgress() → void
```

### Behavior on auth state changes

- **Sign-in:** `onAuthStateChanged` fires with a user. `useProgress` unsubscribes from localStorage and subscribes to Firestore. Firestore data takes over — local progress is discarded.
- **Sign-out:** `onAuthStateChanged` fires with null. `useProgress` unsubscribes from Firestore and subscribes to localStorage (reading fresh from `localStorage.getItem`).
- **No merge prompt** — spec decision: Firestore is always authoritative on sign-in. Local-only progress is discarded. This keeps the implementation simple and avoids edge cases.

### Firestore path

```
users/{uid}/progress/data   ← single document holding the full progress object
```

Single document per user (not subcollections per field) because all progress fields are written together and the total size is well under Firestore's 1MB document limit.

---

## 7. `useProgress` Hook Upgrade

`useProgress` gains `user` as an input (read from `useAuth`) and switches its storage subscription when `user` changes.

Key changes:
- `useState` initial value becomes `DEFAULT_PROGRESS` (not `getProgress()` — we don't know which backend yet)
- `useEffect` subscribes to `subscribeToProgress(user, setProgress)` and returns the unsubscribe cleanup
- A `loading` state is added: `true` until the first callback fires from either backend
- `saveProgress(user, next)` replaces the current `saveProgress(next)` call in `update`

Computed stats and all toggle/set functions are unchanged.

---

## 8. Profile Screen

The Profile screen handles sign-in and account display. It is the only screen that renders auth UI.

**Signed-out state:**
- Email + password form with sign-in button
- "Sign in with Google" button
- Brief copy: "Sign in to sync your progress across devices"

**Signed-in state:**
- Display name and email
- Sign-out button
- No progress management UI on this screen (progress is managed on the relevant screen)

Error handling: Firebase Auth errors (wrong password, network error) surface as inline messages below the form.

---

## 9. GitHub Actions CI/CD

### 9.1 Production deploy (`.github/workflows/deploy-production.yml`)

Trigger: push to `main`

Steps:
1. Checkout
2. Install Node deps (`npm ci` in `web/`)
3. Build (`npm run build`)
4. Deploy to Firebase Hosting live channel (`firebase deploy --only hosting`)

Uses `FIREBASE_SERVICE_ACCOUNT_IAMMOO_CTRACER` GitHub secret (service account JSON) and `VITE_FIREBASE_*` secrets for the build env.

### 9.2 PR preview deploy (`.github/workflows/deploy-preview.yml`)

Trigger: `pull_request` (types: opened, synchronize, reopened)

Steps:
1. Checkout
2. Install deps + build
3. Deploy to a Firebase Hosting preview channel named after the PR number
4. Post the preview URL as a PR comment (handled automatically by `FirebaseExtended/action-hosting-deploy`)

Preview channels expire after 7 days automatically.

### 9.3 Required GitHub secrets

| Secret | Value |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT_IAMMOO_CTRACER` | Service account JSON key |
| `VITE_FIREBASE_API_KEY` | From Firebase config |
| `VITE_FIREBASE_AUTH_DOMAIN` | From Firebase config |
| `VITE_FIREBASE_PROJECT_ID` | `iammoo-ctracer` |
| `VITE_FIREBASE_STORAGE_BUCKET` | From Firebase config |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `<your-messaging-sender-id>` |
| `VITE_FIREBASE_APP_ID` | From Firebase config |

The service account key is generated via the Firebase CLI / GCP Console and added to GitHub repo settings → Secrets and variables → Actions.

---

## 10. What Is Not In Scope

- Mobile Firebase integration (separate plan)
- Local-to-Firestore progress merge on first sign-in
- Anonymous Firebase Auth (spec says unauthenticated use is supported, not anonymous accounts)
- Firestore offline persistence (can be added later)
- Firebase emulator setup for local testing (can be added later)
