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
