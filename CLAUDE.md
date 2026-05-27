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

## Git Workflow

**Never commit directly to `main`.** All work happens on a feature branch and merges via Pull Request after code review.

```
git checkout -b feature/<short-description>
# ... implement, commit ...
git push -u origin feature/<short-description>
gh pr create
# ... review and approval ...
gh pr merge
```

### Branch naming
- `feature/<short-description>` — new functionality
- `fix/<short-description>` — bug fixes

### Commit style
- Imperative present tense: `add`, `fix`, `update`, `remove`
- Prefix: `feat:` for features, `fix:` for bugs, `chore:` for scaffolding/config, `docs:` for documentation

### Pull Requests
- Every PR requires code review before merging
- PR title should be concise (under 70 chars)
- PR description should summarize what changed and include a test plan

## Secrets and Config Values

**Never hardcode Firebase config values in any committed file** — not in docs, specs, plans, or source code comments. This includes:
- API keys (`AIzaSy...`)
- App IDs (`1:...:web:...`)
- Messaging sender IDs (GCP project numbers)

These values belong in:
- `web/.env.local` — local dev (gitignored via `*.local`)
- GitHub repository secrets — CI/CD (Settings → Secrets and variables → Actions)

To retrieve the current config values at any time:
```bash
firebase apps:sdkconfig WEB --project=iammoo-ctracer
```

Project-level identifiers (`iammoo-ctracer`, derived URLs like `iammoo-ctracer.firebaseapp.com`) are fine to reference in committed files since they're already public via `.firebaserc`.

## What Belongs in Each CLAUDE.md

- **Root (this file):** monorepo overview, Firebase setup, storage strategy, git conventions
- **web/CLAUDE.md:** React/Vite conventions, component patterns, Firebase SDK usage
- **mobile/CLAUDE.md:** Flutter/Dart conventions, widget patterns, FlutterFire usage
