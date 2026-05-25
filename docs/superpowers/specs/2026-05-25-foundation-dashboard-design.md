# Foundation + Dashboard Design

> Sprint: foundation layer + Dashboard screen, both platforms in parallel.
> Branches: `feature/web-foundation-dashboard`, `feature/mobile-foundation-dashboard`
> Firebase Auth/Firestore: out of scope this sprint — local storage only.

## Scope

Two independent feature branches executed by parallel subagents. Each delivers:

1. **Routing** — persistent navigation shell connecting all 10 screen stubs
2. **Data layer** — real CCA-F static content (domains, courses, phases, projects)
3. **Storage service** — local-only progress persistence; Firestore methods are no-ops
4. **Progress state** — hook/provider wrapping the storage service
5. **Shared components/widgets** — the design system primitives
6. **Dashboard screen** — fully implemented, pixel-faithful to the Claude Design prototype

Progress starts at zero (all checkboxes unchecked, all bars at 0%).

Design reference: `docs/superpowers/specs/` — `data.js`, `screens-a.jsx`, `components.jsx`, `styles.css`

---

## Web — `feature/web-foundation-dashboard`

### Approach

Port the Claude Design prototype into the proper `src/` directory layout. Match visual output exactly; don't copy prototype's internal structure where it conflicts with React conventions.

### Dependencies

Add to `web/package.json`:
- `react-router-dom` v6

### New files

```
web/
├── index.html                        # add Geist + Geist Mono Google Fonts link
└── src/
    ├── index.css                     # port styles.css from prototype verbatim
    ├── App.jsx                       # shell: <Sidebar> + <Routes>
    ├── main.jsx                      # wrap with <BrowserRouter>
    ├── data/
    │   └── index.js                  # port data.js as ES module (CERT, DOMAINS, PHASES, COURSES, PROJECTS, REFERENCE, EXAM_DAY_CHECKLIST)
    ├── lib/
    │   ├── firebase.js               # stub — export null auth/db; no initialization
    │   └── storage.js                # localStorage-backed storage service
    ├── hooks/
    │   └── useProgress.js            # reads/writes via storage service
    ├── components/
    │   ├── Sidebar.jsx               # persistent left nav with NavLink active states
    │   ├── ProgressBar.jsx
    │   ├── DomainTag.jsx
    │   ├── StatTile.jsx
    │   ├── Card.jsx
    │   ├── Pill.jsx
    │   └── Checkbox.jsx
    └── screens/
        └── Dashboard.jsx             # fully implemented (replaces stub)
```

### Routing

`App.jsx` renders a two-column layout: fixed `<Sidebar>` on the left, `<Routes>` on the right. Routes:

| Path | Screen |
|---|---|
| `/` | Dashboard |
| `/blueprint` | ExamBlueprint |
| `/plan` | StudyPlan |
| `/courses` | Courses |
| `/projects` | Projects |
| `/domain/:id` | DomainDeepDive |
| `/concepts` | KeyConcepts |
| `/exam-day` | ExamDayChecklist |
| `/profile` | Profile |
| `/mobile` | MobileDownload |

All non-Dashboard screens remain stubs.

### Storage service (`src/lib/storage.js`)

```js
// Shape stored at localStorage key "ctracer_progress"
// { courses: {[id]: bool}, projects: {[id]: "not_started"|"in_progress"|"complete"}, tasks: {[id]: bool}, exam_day: {[id]: bool} }

getProgress()   → progress object (defaults to empty shape if not set)
saveProgress(p) → void (writes to localStorage; Firestore write is a no-op)
```

### Progress hook (`src/hooks/useProgress.js`)

```js
const { progress, toggleCourse, toggleTask, setProject, toggleExamDay } = useProgress()
```

Reads initial state from storage service. Each mutation saves back immediately.

### Dashboard (`src/screens/Dashboard.jsx`)

Port `ScreenDashboard` from `screens-a.jsx`. Replace the prototype's `navigate` prop with `useNavigate()` from react-router-dom. Replace `study.state` with values from `useProgress()`.

Five sections:
1. **Hero card** — cert name, cost/format/duration/passing, ring progress (overall %)
2. **Phase pipeline** — 4 phases as clickable nodes with progress bars; active phase highlighted
3. **Stats row** — 4 StatTile: total hours, courses done/total, projects done/total, practice score
4. **Domain progress** — 5 domains with per-domain progress bars; click navigates to `/domain/:id`
5. **Today panel** — up to 4 incomplete tasks in the active phase with checkboxes

---

## Mobile — `feature/mobile-foundation-dashboard`

### Approach

Fresh Flutter build mirroring the web visual design. Use `flutter_hooks` for all local widget state; `Provider` + `ChangeNotifier` for app-wide progress state.

### Dependencies

Add to `mobile/pubspec.yaml`:
- `go_router: ^14.0.0`
- `flutter_hooks: ^0.20.0`

(`provider` and `shared_preferences` already present)

### New files

```
mobile/lib/
├── main.dart                         # MultiProvider + GoRouter setup
├── data/
│   └── content.dart                  # port data.js as Dart const objects (kCert, kDomains, kPhases, kCourses, kProjects, kExamDayChecklist)
├── services/
│   └── storage_service.dart          # SharedPreferences-backed; Firestore methods are stubs
├── hooks/
│   └── progress_provider.dart        # ChangeNotifier wrapping storage service
├── widgets/
│   ├── app_shell.dart                # persistent bottom nav shell (GoRouter ShellRoute)
│   ├── progress_bar.dart
│   ├── domain_tag.dart
│   ├── stat_tile.dart
│   ├── card_surface.dart
│   ├── pill.dart
│   └── checkbox_row.dart
└── screens/
    └── dashboard_screen.dart         # fully implemented (replaces stub)
```

### Routing

`GoRouter` with a `ShellRoute` for the persistent bottom nav bar. Routes mirror the web:

| Path | Screen |
|---|---|
| `/` | DashboardScreen |
| `/blueprint` | ExamBlueprintScreen |
| `/plan` | StudyPlanScreen |
| `/courses` | CoursesScreen |
| `/projects` | ProjectsScreen |
| `/domain/:id` | DomainDeepDiveScreen |
| `/concepts` | KeyConceptsScreen |
| `/exam-day` | ExamDayScreen |
| `/profile` | ProfileScreen |
| `/flashcards` | FlashcardsScreen |

All non-Dashboard screens remain stubs (their existing Scaffold/Center/Text).

Bottom nav shows the 5 primary destinations: Dashboard, Blueprint, Plan, Courses, Profile. Secondary screens are reachable via in-screen navigation (e.g. tapping a domain row navigates to `/domain/:id`).

### Storage service (`lib/services/storage_service.dart`)

Async methods backed by `SharedPreferences`. Stores progress as a JSON string under key `ctracer_progress`. Firestore read/write methods exist but immediately return without doing anything.

### Progress provider (`lib/hooks/progress_provider.dart`)

```dart
class ProgressProvider extends ChangeNotifier {
  ProgressModel get progress
  Future<void> toggleCourse(String id)
  Future<void> toggleTask(String id)
  Future<void> setProject(String id, String status)
  Future<void> toggleExamDay(String id)
}
```

`main.dart` initializes it, loads saved progress, then provides it via `ChangeNotifierProvider`.

### Theme

`ThemeData` in `main.dart`:
- `brightness: Brightness.dark`
- `scaffoldBackgroundColor: Color(0xFF0A0A0C)`
- `colorScheme` built from seed with custom surface/background overrides
- Domain color constants in `content.dart`: amber `0xFFCDA96A`, violet `0xFF9E8FD4`, emerald `0xFF6DB89A`, sky `0xFF6BA8C8`, pink `0xFFCC7FA8`
- Font family: system default (Geist isn't available as a Flutter package; use `-apple-system` equivalent via default sans-serif)

### Dashboard (`lib/screens/dashboard_screen.dart`)

`HookWidget` implementing the same five sections as the web Dashboard, using Flutter layout primitives. Reads `ProgressProvider` via `context.watch<ProgressProvider>()`. Local UI state (e.g. expanded/collapsed) uses `useState` from `flutter_hooks`.

---

## Out of scope this sprint

- Firebase initialization (requires `flutterfire configure` with a real project)
- Sign-in / auth flows
- Firestore reads or writes
- Any screen other than Dashboard (all others remain stubs)
- Web routing on mobile or vice versa
