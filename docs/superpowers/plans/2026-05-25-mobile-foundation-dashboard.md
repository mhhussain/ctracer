# Mobile Foundation + Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Flutter app foundation (routing, data layer, storage service, shared widgets) and a fully implemented DashboardScreen, working on `feature/mobile-foundation-dashboard`.

**Architecture:** GoRouter provides declarative routing with a persistent bottom nav shell via `ShellRoute`. A `SharedPreferences`-backed `StorageService` is wrapped by a `ChangeNotifier` (`ProgressProvider`) provided via the Provider package. `flutter_hooks` (`HookWidget`) replaces `StatefulWidget` for all local UI state. DashboardScreen mirrors the web Dashboard visually. Firebase is stubbed — no initialization yet.

**Tech Stack:** Flutter 3.x, go_router ^14.0.0, flutter_hooks ^0.20.0, provider (existing), shared_preferences (existing)

**Design reference:** `docs/superpowers/specs/` — `data.js`, `screens-a.jsx`, `styles.css`

**Package name:** `ctracer_mobile`

---

### Task 1: Feature branch and new dependencies

**Files:**
- Modify: `mobile/pubspec.yaml`

- [ ] **Step 1: Create the feature branch**

```bash
git checkout main && git pull
git checkout -b feature/mobile-foundation-dashboard
```

- [ ] **Step 2: Add dependencies to pubspec.yaml**

In `mobile/pubspec.yaml`, under `dependencies:`, add:
```yaml
go_router: ^14.0.0
flutter_hooks: ^0.20.0
```

The `dependencies` block should now include (existing entries preserved):
```yaml
dependencies:
  flutter:
    sdk: flutter
  firebase_core: ^3.3.0
  firebase_auth: ^5.1.0
  cloud_firestore: ^5.2.0
  shared_preferences: ^2.3.0
  provider: any
  go_router: ^14.0.0
  flutter_hooks: ^0.20.0
  cupertino_icons: ^1.0.8
```

- [ ] **Step 3: Fetch dependencies**

Run from `mobile/`:
```bash
flutter pub get
```
Expected: resolves without errors.

- [ ] **Step 4: Commit**

```bash
git add mobile/pubspec.yaml mobile/pubspec.lock
git commit -m "chore: add go_router and flutter_hooks to mobile"
```

---

### Task 2: ProgressModel

**Files:**
- Create: `mobile/lib/services/progress_model.dart`
- Create: `mobile/test/services/progress_model_test.dart`

- [ ] **Step 1: Write the failing test**

Create `mobile/test/services/progress_model_test.dart`:
```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:ctracer_mobile/services/progress_model.dart';

void main() {
  group('ProgressModel', () {
    test('default instance has empty collections', () {
      const p = ProgressModel();
      expect(p.courses, isEmpty);
      expect(p.projects, isEmpty);
      expect(p.tasks, isEmpty);
      expect(p.examDay, isEmpty);
      expect(p.practiceScore, isNull);
    });

    test('copyWith replaces only the specified fields', () {
      const p = ProgressModel(courses: {'c1': true});
      final p2 = p.copyWith(tasks: {'p1t1': true});
      expect(p2.courses, {'c1': true});
      expect(p2.tasks, {'p1t1': true});
    });

    test('toJson / fromJson round-trips correctly', () {
      const p = ProgressModel(
        courses: {'c1': true},
        projects: {'pr1': 'in_progress'},
        tasks: {'p1t1': true},
        examDay: {'x1': true},
      );
      final json = p.toJson();
      final restored = ProgressModel.fromJson(json);
      expect(restored.courses, p.courses);
      expect(restored.projects, p.projects);
      expect(restored.tasks, p.tasks);
      expect(restored.examDay, p.examDay);
    });
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
flutter test test/services/progress_model_test.dart
```
Expected: FAIL — file not found.

- [ ] **Step 3: Implement ProgressModel**

Create `mobile/lib/services/progress_model.dart`:
```dart
class ProgressModel {
  final Map<String, bool> courses;
  final Map<String, String> projects; // 'not_started' | 'in_progress' | 'complete'
  final Map<String, bool> tasks;
  final Map<String, bool> examDay;
  final String? practiceScore;

  const ProgressModel({
    this.courses = const {},
    this.projects = const {},
    this.tasks = const {},
    this.examDay = const {},
    this.practiceScore,
  });

  ProgressModel copyWith({
    Map<String, bool>? courses,
    Map<String, String>? projects,
    Map<String, bool>? tasks,
    Map<String, bool>? examDay,
    String? practiceScore,
  }) {
    return ProgressModel(
      courses: courses ?? this.courses,
      projects: projects ?? this.projects,
      tasks: tasks ?? this.tasks,
      examDay: examDay ?? this.examDay,
      practiceScore: practiceScore ?? this.practiceScore,
    );
  }

  Map<String, dynamic> toJson() => {
    'courses': courses,
    'projects': projects,
    'tasks': tasks,
    'exam_day': examDay,
    if (practiceScore != null) 'practiceScore': practiceScore,
  };

  factory ProgressModel.fromJson(Map<String, dynamic> json) {
    return ProgressModel(
      courses: Map<String, bool>.from(json['courses'] as Map? ?? {}),
      projects: Map<String, String>.from(json['projects'] as Map? ?? {}),
      tasks: Map<String, bool>.from(json['tasks'] as Map? ?? {}),
      examDay: Map<String, bool>.from(json['exam_day'] as Map? ?? {}),
      practiceScore: json['practiceScore'] as String?,
    );
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
flutter test test/services/progress_model_test.dart
```
Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add mobile/lib/services/progress_model.dart mobile/test/services/progress_model_test.dart
git commit -m "feat: add ProgressModel with JSON serialization"
```

---

### Task 3: Data layer

**Files:**
- Create: `mobile/lib/data/content.dart`
- Create: `mobile/test/data/content_test.dart`

- [ ] **Step 1: Write the failing test**

Create `mobile/test/data/content_test.dart`:
```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:ctracer_mobile/data/content.dart';

void main() {
  group('content data', () {
    test('cert has required fields', () {
      expect(kCert.name, 'Claude Certified Architect – Foundations');
      expect(kCert.cost, '\$99');
      expect(kCert.passing, '720 / 1000');
    });

    test('has 5 domains', () => expect(kDomains, hasLength(5)));

    test('domains have all required fields', () {
      for (final d in kDomains) {
        expect(d.id, isNotEmpty);
        expect(d.weight, greaterThan(0));
        expect(d.questions, greaterThan(0));
      }
    });

    test('has 4 phases each with tasks', () {
      expect(kPhases, hasLength(4));
      for (final p in kPhases) {
        expect(p.tasks, isNotEmpty);
      }
    });

    test('has 9 courses', () => expect(kCourses, hasLength(9)));
    test('has 5 projects', () => expect(kProjects, hasLength(5)));
    test('domain weights sum to 100', () {
      final total = kDomains.fold(0, (s, d) => s + d.weight);
      expect(total, 100);
    });
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
flutter test test/data/content_test.dart
```
Expected: FAIL — file not found.

- [ ] **Step 3: Implement content.dart**

Create `mobile/lib/data/content.dart`. Port all data from `docs/superpowers/specs/data.js`.

Domain colors are approximate oklch→sRGB conversions matching the CSS variables:
- amber `--c-amber: oklch(0.78 0.16 65)` → `0xFFCDA96A`
- violet `--c-violet: oklch(0.74 0.16 290)` → `0xFF9E8FD4`
- emerald `--c-emerald: oklch(0.74 0.13 160)` → `0xFF6DB89A`
- sky `--c-sky: oklch(0.74 0.14 220)` → `0xFF6BA8C8`
- pink `--c-pink: oklch(0.74 0.16 350)` → `0xFFCC7FA8`

```dart
import 'package:flutter/material.dart';

// ── Color constants ────────────────────────────────────────────────────────
class DomainColors {
  static const amber   = Color(0xFFCDA96A);
  static const violet  = Color(0xFF9E8FD4);
  static const emerald = Color(0xFF6DB89A);
  static const sky     = Color(0xFF6BA8C8);
  static const pink    = Color(0xFFCC7FA8);
}

// ── Data models ───────────────────────────────────────────────────────────
class CertInfo {
  final String name, short, launched, cost, format, duration, passing;
  const CertInfo({
    required this.name, required this.short, required this.launched,
    required this.cost, required this.format, required this.duration,
    required this.passing,
  });
}

class DomainModel {
  final String id, short, name, difficulty, blurb;
  final int num, weight, questions;
  final Color color;
  const DomainModel({
    required this.id, required this.num, required this.short,
    required this.name, required this.weight, required this.questions,
    required this.color, required this.difficulty, required this.blurb,
  });
}

class TaskModel {
  final String id, label, kind;
  final double hours;
  final String? domain;
  const TaskModel({
    required this.id, required this.label, required this.kind,
    required this.hours, this.domain,
  });
}

class PhaseModel {
  final String id, week, name, goal;
  final int num;
  final double hours;
  final List<TaskModel> tasks;
  const PhaseModel({
    required this.id, required this.num, required this.week,
    required this.name, required this.goal, required this.hours,
    required this.tasks,
  });
}

class CourseModel {
  final String id, name, level, blurb;
  final double hours;
  final List<String> domains;
  final bool partnerRequired;
  const CourseModel({
    required this.id, required this.name, required this.hours,
    required this.level, required this.domains, required this.partnerRequired,
    required this.blurb,
  });
}

class ProjectModel {
  final String id, name, complexity, summary;
  final double hours;
  final List<String> domains;
  const ProjectModel({
    required this.id, required this.name, required this.domains,
    required this.complexity, required this.hours, required this.summary,
  });
}

class ExamDayItem {
  final String id, label;
  final bool critical;
  const ExamDayItem({required this.id, required this.label, required this.critical});
}

// ── Static data (ported from docs/superpowers/specs/data.js) ─────────────

const kCert = CertInfo(
  name: 'Claude Certified Architect – Foundations',
  short: 'CCA-F',
  launched: 'March 12, 2026',
  cost: '\$99',
  format: '60 questions • multiple choice + scenario',
  duration: '120 min',
  passing: '720 / 1000',
);

// Port all 5 domains from data.js DOMAINS array.
// Map color string → DomainColors constant: amber→DomainColors.amber, etc.
const kDomains = [
  DomainModel(
    id: 'd1', num: 1, short: 'Agentic',
    name: 'Agentic Architecture & Orchestration',
    weight: 27, questions: 16, color: DomainColors.amber,
    difficulty: 'Hardest',
    blurb: 'Design autonomous multi-step systems that reliably complete complex tasks without human intervention.',
  ),
  DomainModel(
    id: 'd2', num: 2, short: 'Claude Code',
    name: 'Claude Code Configuration & Workflows',
    weight: 20, questions: 12, color: DomainColors.violet,
    difficulty: 'Production',
    blurb: 'Production-level use of Claude Code — configuring it at the architecture level for teams and CI/CD pipelines.',
  ),
  DomainModel(
    id: 'd3', num: 3, short: 'Prompts',
    name: 'Prompt Engineering & Structured Output',
    weight: 20, questions: 12, color: DomainColors.emerald,
    difficulty: 'Production',
    blurb: 'Engineering-grade prompt systems with validation and fallback — not clever prompts, reliable ones.',
  ),
  DomainModel(
    id: 'd4', num: 4, short: 'Tools & MCP',
    name: 'Tool Design & MCP Integration',
    weight: 18, questions: 11, color: DomainColors.sky,
    difficulty: 'Core',
    blurb: 'Build and connect tools Claude can call — including designing good schemas and shipping production MCP servers.',
  ),
  DomainModel(
    id: 'd5', num: 5, short: 'Context',
    name: 'Context Management & Reliability',
    weight: 15, questions: 9, color: DomainColors.pink,
    difficulty: 'Core',
    blurb: 'Manage the context window so Claude stays focused, accurate, and consistent across long interactions.',
  ),
];

// Port all 4 phases from data.js PHASES array. Convert hours to double.
const kPhases = [
  PhaseModel(
    id: 'p1', num: 1, week: 'Week 1', name: 'Foundation',
    goal: 'Refresh core concepts, fill any gaps', hours: 8,
    tasks: [
      TaskModel(id: 'p1t1', label: 'Claude Code 101', hours: 2, kind: 'course'),
      TaskModel(id: 'p1t2', label: 'Claude 101', hours: 3, kind: 'course'),
      TaskModel(id: 'p1t3', label: 'Building with the Claude API — Modules 1–3', hours: 2, kind: 'course'),
      TaskModel(id: 'p1t4', label: 'Review Messages API reference', hours: 1, kind: 'review'),
    ],
  ),
  PhaseModel(
    id: 'p2', num: 2, week: 'Weeks 2–3', name: 'Core Exam Domains',
    goal: 'Cover all five domains with hands-on projects', hours: 22.5,
    tasks: [
      TaskModel(id: 'p2t1', label: 'Agents & Workflows module', hours: 1.5, kind: 'course', domain: 'd1'),
      TaskModel(id: 'p2t2', label: 'Introduction to Subagents', hours: 1, kind: 'course', domain: 'd1'),
      TaskModel(id: 'p2t3', label: 'Introduction to MCP', hours: 2, kind: 'course', domain: 'd4'),
      TaskModel(id: 'p2t4', label: 'MCP: Advanced Topics', hours: 2, kind: 'course', domain: 'd4'),
      TaskModel(id: 'p2t5', label: 'Project — MCP server w/ tools + resources + prompts', hours: 3, kind: 'project', domain: 'd4'),
      TaskModel(id: 'p2t6', label: 'Project — Multi-step agentic workflow w/ fallback', hours: 3, kind: 'project', domain: 'd1'),
      TaskModel(id: 'p2t7', label: 'Claude Code in Action (full)', hours: 6, kind: 'course', domain: 'd2'),
      TaskModel(id: 'p2t8', label: 'Introduction to Agent Skills', hours: 1, kind: 'course', domain: 'd2'),
      TaskModel(id: 'p2t9', label: 'Prompt Engineering module', hours: 1, kind: 'course', domain: 'd3'),
      TaskModel(id: 'p2t10', label: 'Prompt Evaluation module', hours: 1, kind: 'course', domain: 'd3'),
      TaskModel(id: 'p2t11', label: 'Project — CLAUDE.md hierarchy + custom Skill', hours: 2, kind: 'project', domain: 'd2'),
      TaskModel(id: 'p2t12', label: 'Project — Prompt eval pipeline w/ auto-grading', hours: 2, kind: 'project', domain: 'd3'),
    ],
  ),
  PhaseModel(
    id: 'p3', num: 3, week: 'Week 4', name: 'Context & Integration',
    goal: 'Close out Domain 5; do full RAG build', hours: 9,
    tasks: [
      TaskModel(id: 'p3t1', label: 'RAG & Agentic Search module', hours: 1.5, kind: 'course', domain: 'd5'),
      TaskModel(id: 'p3t2', label: 'Features of Claude module', hours: 1.5, kind: 'course', domain: 'd5'),
      TaskModel(id: 'p3t3', label: 'Project — Full RAG pipeline', hours: 4, kind: 'project', domain: 'd5'),
      TaskModel(id: 'p3t4', label: 'Project — Prompt caching on high-volume prompt', hours: 1, kind: 'project', domain: 'd3'),
      TaskModel(id: 'p3t5', label: 'Review extended thinking, PDF/image, Citations, Files API', hours: 1, kind: 'review', domain: 'd5'),
    ],
  ),
  PhaseModel(
    id: 'p4', num: 4, week: 'Week 5', name: 'Exam Prep',
    goal: 'Solidify, identify gaps, practice scenarios', hours: 8,
    tasks: [
      TaskModel(id: 'p4t1', label: 'claudecertifications.com — 33+ practice questions', hours: 2, kind: 'practice'),
      TaskModel(id: 'p4t2', label: 'Review all 5 domain anti-patterns', hours: 1, kind: 'review'),
      TaskModel(id: 'p4t3', label: 'Re-read tool use ref, MCP spec, Claude Code docs', hours: 2, kind: 'review'),
      TaskModel(id: 'p4t4', label: 'Review architecture tradeoffs (latency / cost / reliability)', hours: 1, kind: 'review'),
      TaskModel(id: 'p4t5', label: 'Mock exam simulation (timed, no reference)', hours: 2, kind: 'practice'),
    ],
  ),
];

// Port all 9 courses from data.js COURSES array.
const kCourses = [
  CourseModel(id: 'c1', name: 'Building with the Claude API', hours: 4, level: 'Intermediate', domains: ['d3', 'd4', 'd5'], partnerRequired: true, blurb: 'API auth, prompt engineering, tool use, RAG, MCP, agents & workflows — the spine of the prep.'),
  CourseModel(id: 'c2', name: 'Introduction to Agent Skills', hours: 1, level: 'Intermediate', domains: ['d2'], partnerRequired: true, blurb: 'Reusable Skills with frontmatter — how they differ from CLAUDE.md, hooks, and subagents.'),
  CourseModel(id: 'c3', name: 'Introduction to Model Context Protocol', hours: 2, level: 'Intermediate', domains: ['d4'], partnerRequired: true, blurb: 'MCP primitives — Tools, Resources, Prompts — and the Python SDK decorator pattern.'),
  CourseModel(id: 'c4', name: 'Claude Code in Action', hours: 6, level: 'Intermediate', domains: ['d2'], partnerRequired: true, blurb: 'Production Claude Code — context control, custom commands, MCP, hooks, SDK.'),
  CourseModel(id: 'c5', name: 'Claude Code 101', hours: 2, level: 'Beginner', domains: ['d2'], partnerRequired: false, blurb: 'Best first course for developers. Covers daily development workflow with Claude Code.'),
  CourseModel(id: 'c6', name: 'Claude 101', hours: 3, level: 'Beginner', domains: [], partnerRequired: false, blurb: 'Non-developer / business stakeholder primer. Projects, Artifacts, Skills, Connectors, desktop app.'),
  CourseModel(id: 'c7', name: 'MCP: Advanced Topics', hours: 2, level: 'Advanced', domains: ['d4'], partnerRequired: false, blurb: 'Advanced implementation patterns for production MCP server development.'),
  CourseModel(id: 'c8', name: 'Introduction to Subagents', hours: 1, level: 'Intermediate', domains: ['d1'], partnerRequired: false, blurb: 'Subagents to manage context and delegate specialized tasks — directly supports Domain 1.'),
  CourseModel(id: 'c9', name: 'AI Fluency: Framework & Foundations', hours: 4, level: 'Beginner', domains: [], partnerRequired: false, blurb: '4D Framework — Delegation, Description, Discernment, Diligence. Good for team distribution.'),
];

// Port all 5 projects from data.js PROJECTS array.
const kProjects = [
  ProjectModel(id: 'pr1', name: 'RAG Knowledge Assistant', domains: ['d5', 'd3'], complexity: 'Medium', hours: 5, summary: 'Document ingestion → vector database → Claude with structured prompts.'),
  ProjectModel(id: 'pr2', name: 'Tool-Enabled Support Chatbot', domains: ['d4', 'd1'], complexity: 'Medium', hours: 4, summary: 'Claude calling external APIs for real data retrieval in a multi-turn conversation.'),
  ProjectModel(id: 'pr3', name: 'Multi-Step Autonomous Agent', domains: ['d1'], complexity: 'High', hours: 8, summary: 'Orchestrated tool sequences completing complex tasks autonomously with fallback logic.'),
  ProjectModel(id: 'pr4', name: 'MCP Server', domains: ['d4'], complexity: 'Medium', hours: 4, summary: 'Python MCP server with tools, resources, and prompts; tested via Server Inspector.'),
  ProjectModel(id: 'pr5', name: 'Prompt Eval Pipeline', domains: ['d3'], complexity: 'Medium', hours: 4, summary: 'Automated eval system with test datasets, model-based grading, and retry on failure.'),
];

const kExamDayChecklist = [
  ExamDayItem(id: 'x1', label: 'All 4 Partner Network courses complete', critical: true),
  ExamDayItem(id: 'x2', label: 'All 5 projects built', critical: true),
  ExamDayItem(id: 'x3', label: 'Practice questions scoring 80%+', critical: true),
  ExamDayItem(id: 'x4', label: 'All 5 domain anti-patterns reviewed', critical: true),
  ExamDayItem(id: 'x5', label: 'Claude Partner Network membership active', critical: true),
  ExamDayItem(id: 'x6', label: 'Exam registered at anthropic.skilljar.com', critical: true),
  ExamDayItem(id: 'x7', label: 'Quiet, distraction-free environment lined up', critical: false),
  ExamDayItem(id: 'x8', label: 'Government ID ready for proctor check', critical: false),
  ExamDayItem(id: 'x9', label: 'Reliable internet + power; backup if remote', critical: false),
];

// Precomputed lookup maps (use in Dashboard for domain progress calculation)
final Map<String, List<CourseModel>> coursesByDomain = () {
  final map = <String, List<CourseModel>>{};
  for (final c in kCourses) {
    for (final d in c.domains) {
      map.putIfAbsent(d, () => []).add(c);
    }
  }
  return map;
}();

final Map<String, List<ProjectModel>> projectsByDomain = () {
  final map = <String, List<ProjectModel>>{};
  for (final p in kProjects) {
    for (final d in p.domains) {
      map.putIfAbsent(d, () => []).add(p);
    }
  }
  return map;
}();
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
flutter test test/data/content_test.dart
```
Expected: 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add mobile/lib/data/content.dart mobile/test/data/content_test.dart
git commit -m "feat: add CCA-F data layer as Dart constants"
```

---

### Task 4: Storage service

**Files:**
- Create: `mobile/lib/services/storage_service.dart`
- Create: `mobile/test/services/storage_service_test.dart`

- [ ] **Step 1: Write the failing test**

Create `mobile/test/services/storage_service_test.dart`:
```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:ctracer_mobile/services/storage_service.dart';
import 'package:ctracer_mobile/services/progress_model.dart';

void main() {
  group('StorageService', () {
    setUp(() => SharedPreferences.setMockInitialValues({}));

    test('returns empty ProgressModel when nothing is saved', () async {
      final svc = StorageService();
      final p = await svc.getProgress();
      expect(p.courses, isEmpty);
      expect(p.tasks, isEmpty);
      expect(p.projects, isEmpty);
      expect(p.examDay, isEmpty);
    });

    test('saves and retrieves progress', () async {
      final svc = StorageService();
      final original = ProgressModel(courses: {'c1': true}, tasks: {'p1t1': true});
      await svc.saveProgress(original);
      final loaded = await svc.getProgress();
      expect(loaded.courses['c1'], isTrue);
      expect(loaded.tasks['p1t1'], isTrue);
    });

    test('clearProgress resets to empty', () async {
      final svc = StorageService();
      await svc.saveProgress(const ProgressModel(courses: {'c1': true}));
      await svc.clearProgress();
      final p = await svc.getProgress();
      expect(p.courses, isEmpty);
    });
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
flutter test test/services/storage_service_test.dart
```
Expected: FAIL — file not found.

- [ ] **Step 3: Implement StorageService**

Create `mobile/lib/services/storage_service.dart`:
```dart
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'progress_model.dart';

class StorageService {
  static const _key = 'ctracer_progress';

  Future<ProgressModel> getProgress() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null) return const ProgressModel();
    try {
      return ProgressModel.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return const ProgressModel();
    }
  }

  Future<void> saveProgress(ProgressModel progress) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, jsonEncode(progress.toJson()));
  }

  Future<void> clearProgress() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }

  // Firestore stubs — no-ops until Firebase sprint
  Future<ProgressModel?> getProgressFromFirestore(String uid) async => null;
  Future<void> saveProgressToFirestore(String uid, ProgressModel progress) async {}
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
flutter test test/services/storage_service_test.dart
```
Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add mobile/lib/services/storage_service.dart mobile/test/services/storage_service_test.dart
git commit -m "feat: add SharedPreferences-backed StorageService"
```

---

### Task 5: Progress provider

**Files:**
- Create: `mobile/lib/hooks/progress_provider.dart`
- Create: `mobile/test/hooks/progress_provider_test.dart`

- [ ] **Step 1: Write the failing test**

Create `mobile/test/hooks/progress_provider_test.dart`:
```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:ctracer_mobile/hooks/progress_provider.dart';
import 'package:ctracer_mobile/services/storage_service.dart';

void main() {
  group('ProgressProvider', () {
    setUp(() => SharedPreferences.setMockInitialValues({}));

    test('starts with empty progress after load', () async {
      final provider = ProgressProvider(StorageService());
      await provider.load();
      expect(provider.progress.courses, isEmpty);
      expect(provider.progress.tasks, isEmpty);
    });

    test('toggleCourse flips completion', () async {
      final provider = ProgressProvider(StorageService());
      await provider.load();
      await provider.toggleCourse('c1');
      expect(provider.progress.courses['c1'], isTrue);
      await provider.toggleCourse('c1');
      expect(provider.progress.courses['c1'], isFalse);
    });

    test('toggleTask flips completion', () async {
      final provider = ProgressProvider(StorageService());
      await provider.load();
      await provider.toggleTask('p1t1');
      expect(provider.progress.tasks['p1t1'], isTrue);
    });

    test('setProject updates project status', () async {
      final provider = ProgressProvider(StorageService());
      await provider.load();
      await provider.setProject('pr1', 'in_progress');
      expect(provider.progress.projects['pr1'], 'in_progress');
      await provider.setProject('pr1', 'complete');
      expect(provider.progress.projects['pr1'], 'complete');
    });

    test('toggleExamDay flips completion', () async {
      final provider = ProgressProvider(StorageService());
      await provider.load();
      await provider.toggleExamDay('x1');
      expect(provider.progress.examDay['x1'], isTrue);
    });
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
flutter test test/hooks/progress_provider_test.dart
```
Expected: FAIL — file not found.

- [ ] **Step 3: Implement ProgressProvider**

Create `mobile/lib/hooks/progress_provider.dart`:
```dart
import 'package:flutter/foundation.dart';
import '../services/progress_model.dart';
import '../services/storage_service.dart';

class ProgressProvider extends ChangeNotifier {
  ProgressProvider(this._storage);

  final StorageService _storage;
  ProgressModel _progress = const ProgressModel();

  ProgressModel get progress => _progress;

  Future<void> load() async {
    _progress = await _storage.getProgress();
    notifyListeners();
  }

  Future<void> _update(ProgressModel next) async {
    _progress = next;
    notifyListeners();
    await _storage.saveProgress(next);
  }

  Future<void> toggleCourse(String id) => _update(
    _progress.copyWith(
      courses: {..._progress.courses, id: !(_progress.courses[id] ?? false)},
    ),
  );

  Future<void> toggleTask(String id) => _update(
    _progress.copyWith(
      tasks: {..._progress.tasks, id: !(_progress.tasks[id] ?? false)},
    ),
  );

  Future<void> setProject(String id, String status) => _update(
    _progress.copyWith(
      projects: {..._progress.projects, id: status},
    ),
  );

  Future<void> toggleExamDay(String id) => _update(
    _progress.copyWith(
      examDay: {..._progress.examDay, id: !(_progress.examDay[id] ?? false)},
    ),
  );

  Future<void> setPracticeScore(String score) => _update(
    _progress.copyWith(practiceScore: score),
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
flutter test test/hooks/progress_provider_test.dart
```
Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add mobile/lib/hooks/progress_provider.dart mobile/test/hooks/progress_provider_test.dart
git commit -m "feat: add ProgressProvider ChangeNotifier"
```

---

### Task 6: Shared widgets

**Files:**
- Create: `mobile/lib/widgets/progress_bar.dart`
- Create: `mobile/lib/widgets/domain_tag.dart`
- Create: `mobile/lib/widgets/stat_tile.dart`
- Create: `mobile/lib/widgets/card_surface.dart`
- Create: `mobile/lib/widgets/pill.dart`
- Create: `mobile/lib/widgets/checkbox_row.dart`
- Create: `mobile/test/widgets/widgets_test.dart`

- [ ] **Step 1: Write widget render tests**

Create `mobile/test/widgets/widgets_test.dart`:
```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ctracer_mobile/data/content.dart';
import 'package:ctracer_mobile/widgets/progress_bar.dart';
import 'package:ctracer_mobile/widgets/domain_tag.dart';
import 'package:ctracer_mobile/widgets/stat_tile.dart';
import 'package:ctracer_mobile/widgets/card_surface.dart';
import 'package:ctracer_mobile/widgets/pill.dart';
import 'package:ctracer_mobile/widgets/checkbox_row.dart';

Widget wrap(Widget child) => MaterialApp(home: Scaffold(body: child));

void main() {
  testWidgets('ProgressBar renders without errors', (tester) async {
    await tester.pumpWidget(wrap(const ProgressBar(value: 50, color: Color(0xFF9E8FD4))));
    expect(find.byType(ProgressBar), findsOneWidget);
  });

  testWidgets('DomainTag shows D1', (tester) async {
    await tester.pumpWidget(wrap(DomainTag(domain: kDomains.first)));
    expect(find.text('D1'), findsOneWidget);
  });

  testWidgets('StatTile shows label and value', (tester) async {
    await tester.pumpWidget(wrap(const StatTile(label: 'Courses', value: '3/9')));
    expect(find.text('Courses'), findsOneWidget);
    expect(find.text('3/9'), findsOneWidget);
  });

  testWidgets('CardSurface renders child', (tester) async {
    await tester.pumpWidget(wrap(const CardSurface(child: Text('hello'))));
    expect(find.text('hello'), findsOneWidget);
  });

  testWidgets('Pill renders label', (tester) async {
    await tester.pumpWidget(wrap(const Pill(label: 'Active', isAccent: true)));
    expect(find.text('Active'), findsOneWidget);
  });

  testWidgets('CheckboxRow calls onChanged when tapped', (tester) async {
    bool changed = false;
    await tester.pumpWidget(wrap(CheckboxRow(
      label: 'Task 1', sub: '2h', checked: false,
      onChanged: (_) => changed = true,
    )));
    await tester.tap(find.byType(Checkbox));
    expect(changed, isTrue);
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
flutter test test/widgets/widgets_test.dart
```
Expected: FAIL — widget files not found.

- [ ] **Step 3: Create widget files**

Create `mobile/lib/widgets/progress_bar.dart`:
```dart
import 'package:flutter/material.dart';

class ProgressBar extends StatelessWidget {
  final double value; // 0–100
  final Color color;
  final double height;

  const ProgressBar({super.key, required this.value, required this.color, this.height = 5});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (_, constraints) {
      final pct = (value.clamp(0, 100) / 100);
      return Container(
        height: height,
        decoration: BoxDecoration(
          color: const Color(0xFF22222B),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Align(
          alignment: Alignment.centerLeft,
          child: FractionallySizedBox(
            widthFactor: pct,
            child: Container(
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(999),
              ),
            ),
          ),
        ),
      );
    });
  }
}
```

Create `mobile/lib/widgets/domain_tag.dart`:
```dart
import 'package:flutter/material.dart';
import '../data/content.dart';

class DomainTag extends StatelessWidget {
  final DomainModel domain;
  const DomainTag({super.key, required this.domain});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 28,
      height: 28,
      decoration: BoxDecoration(
        color: domain.color.withValues(alpha: 0.16),
        borderRadius: BorderRadius.circular(6),
      ),
      alignment: Alignment.center,
      child: Text(
        'D${domain.num}',
        style: TextStyle(
          color: domain.color,
          fontSize: 11,
          fontWeight: FontWeight.w700,
          fontFamily: 'monospace',
        ),
      ),
    );
  }
}
```

Create `mobile/lib/widgets/stat_tile.dart`:
```dart
import 'package:flutter/material.dart';

class StatTile extends StatelessWidget {
  final String label, value;
  final String? sub;
  const StatTile({super.key, required this.label, required this.value, this.sub});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF131318),
        border: Border.all(color: const Color(0x0FFFFFFF)),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: Color(0xFFEDEDF0), letterSpacing: -0.04 * 24, height: 1)),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(fontSize: 13, color: Color(0xFFB6B6C0))),
          if (sub != null) ...[
            const SizedBox(height: 2),
            Text(sub!, style: const TextStyle(fontSize: 12, color: Color(0xFF7D7D88))),
          ],
        ],
      ),
    );
  }
}
```

Create `mobile/lib/widgets/card_surface.dart`:
```dart
import 'package:flutter/material.dart';

class CardSurface extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  const CardSurface({super.key, required this.child, this.padding});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding ?? const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF131318),
        border: Border.all(color: const Color(0x0FFFFFFF)),
        borderRadius: BorderRadius.circular(14),
      ),
      child: child,
    );
  }
}
```

Create `mobile/lib/widgets/pill.dart`:
```dart
import 'package:flutter/material.dart';

class Pill extends StatelessWidget {
  final String label;
  final bool isAccent;
  const Pill({super.key, required this.label, this.isAccent = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: isAccent ? const Color(0x289E8FD4) : const Color(0xFF22222B),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: isAccent ? const Color(0xFF9E8FD4) : const Color(0xFFB6B6C0),
        ),
      ),
    );
  }
}
```

Create `mobile/lib/widgets/checkbox_row.dart`:
```dart
import 'package:flutter/material.dart';

class CheckboxRow extends StatelessWidget {
  final String label;
  final String? sub;
  final bool checked;
  final ValueChanged<bool?> onChanged;
  const CheckboxRow({super.key, required this.label, required this.checked, required this.onChanged, this.sub});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => onChanged(!checked),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Checkbox(
              value: checked,
              onChanged: onChanged,
              activeColor: const Color(0xFF9E8FD4),
              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
              visualDensity: VisualDensity.compact,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: const TextStyle(fontSize: 14, color: Color(0xFFEDEDF0))),
                  if (sub != null)
                    Text(sub!, style: const TextStyle(fontSize: 12, color: Color(0xFF7D7D88))),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
flutter test test/widgets/widgets_test.dart
```
Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add mobile/lib/widgets/ mobile/test/widgets/
git commit -m "feat: add shared Flutter widgets (ProgressBar, DomainTag, StatTile, CardSurface, Pill, CheckboxRow)"
```

---

### Task 7: App shell and main.dart

**Files:**
- Create: `mobile/lib/widgets/app_shell.dart`
- Modify: `mobile/lib/main.dart`

- [ ] **Step 1: Create AppShell widget**

Create `mobile/lib/widgets/app_shell.dart`:
```dart
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';

class AppShell extends HookWidget {
  final Widget child;
  const AppShell({super.key, required this.child});

  static int _indexForLocation(String location) {
    if (location.startsWith('/blueprint')) return 1;
    if (location.startsWith('/plan')) return 2;
    if (location.startsWith('/courses')) return 3;
    if (location.startsWith('/profile')) return 4;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.path;
    final currentIndex = _indexForLocation(location);

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0C),
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: currentIndex,
        backgroundColor: const Color(0xFF0F0F12),
        indicatorColor: const Color(0xFF22222B),
        onDestinationSelected: (i) {
          const routes = ['/', '/blueprint', '/plan', '/courses', '/profile'];
          context.go(routes[i]);
        },
        destinations: const [
          NavigationDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard), label: 'Dashboard'),
          NavigationDestination(icon: Icon(Icons.assignment_outlined), selectedIcon: Icon(Icons.assignment), label: 'Blueprint'),
          NavigationDestination(icon: Icon(Icons.map_outlined), selectedIcon: Icon(Icons.map), label: 'Plan'),
          NavigationDestination(icon: Icon(Icons.school_outlined), selectedIcon: Icon(Icons.school), label: 'Courses'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}
```

- [ ] **Step 2: Rewrite main.dart with GoRouter + MultiProvider**

Replace `mobile/lib/main.dart` with:
```dart
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'data/content.dart';
import 'hooks/progress_provider.dart';
import 'services/storage_service.dart';
import 'widgets/app_shell.dart';
import 'screens/dashboard_screen.dart';
import 'screens/exam_blueprint_screen.dart';
import 'screens/study_plan_screen.dart';
import 'screens/courses_screen.dart';
import 'screens/projects_screen.dart';
import 'screens/domain_deep_dive_screen.dart';
import 'screens/key_concepts_screen.dart';
import 'screens/exam_day_screen.dart';
import 'screens/flashcards_screen.dart';
import 'screens/profile_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final storage = StorageService();
  final progressProvider = ProgressProvider(storage);
  await progressProvider.load();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: progressProvider),
      ],
      child: const CtracerApp(),
    ),
  );
}

final _router = GoRouter(
  initialLocation: '/',
  routes: [
    ShellRoute(
      builder: (context, state, child) => AppShell(child: child),
      routes: [
        GoRoute(path: '/', builder: (_, __) => const DashboardScreen()),
        GoRoute(path: '/blueprint', builder: (_, __) => const ExamBlueprintScreen()),
        GoRoute(path: '/plan', builder: (_, __) => const StudyPlanScreen()),
        GoRoute(path: '/courses', builder: (_, __) => const CoursesScreen()),
        GoRoute(path: '/projects', builder: (_, __) => const ProjectsScreen()),
        GoRoute(
          path: '/domain/:id',
          builder: (_, state) => DomainDeepDiveScreen(
            domainId: state.pathParameters['id']!,
          ),
        ),
        GoRoute(path: '/concepts', builder: (_, __) => const KeyConceptsScreen()),
        GoRoute(path: '/exam-day', builder: (_, __) => const ExamDayScreen()),
        GoRoute(path: '/flashcards', builder: (_, __) => const FlashcardsScreen()),
        GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
      ],
    ),
  ],
);

class CtracerApp extends StatelessWidget {
  const CtracerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'ctracer',
      debugShowCheckedModeBanner: false,
      theme: _buildTheme(),
      routerConfig: _router,
    );
  }
}

ThemeData _buildTheme() {
  return ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: const Color(0xFF0A0A0C),
    colorScheme: const ColorScheme.dark(
      surface: Color(0xFF131318),
      onSurface: Color(0xFFEDEDF0),
      primary: Color(0xFF9E8FD4),
      secondary: Color(0xFF9E8FD4),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: const Color(0xFF0F0F12),
      indicatorColor: const Color(0xFF22222B),
      labelTextStyle: WidgetStateProperty.all(
        const TextStyle(fontSize: 12, color: Color(0xFFB6B6C0)),
      ),
      iconTheme: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return const IconThemeData(color: Color(0xFF9E8FD4));
        }
        return const IconThemeData(color: Color(0xFF7D7D88));
      }),
    ),
    useMaterial3: true,
  );
}
```

- [ ] **Step 3: Update DomainDeepDiveScreen stub to accept domainId**

`DomainDeepDiveScreen` needs to accept a `domainId` param. Update `mobile/lib/screens/domain_deep_dive_screen.dart`:
```dart
import 'package:flutter/material.dart';

class DomainDeepDiveScreen extends StatelessWidget {
  final String domainId;
  const DomainDeepDiveScreen({super.key, required this.domainId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(child: Text('Domain Deep Dive: $domainId')),
    );
  }
}
```

- [ ] **Step 4: Run tests to verify nothing is broken**

```bash
flutter test
```
Expected: all existing tests pass.

- [ ] **Step 5: Commit**

```bash
git add mobile/lib/widgets/app_shell.dart mobile/lib/main.dart mobile/lib/screens/domain_deep_dive_screen.dart
git commit -m "feat: add GoRouter shell with bottom nav and dark theme"
```

---

### Task 8: Dashboard screen

**Files:**
- Modify: `mobile/lib/screens/dashboard_screen.dart`
- Create: `mobile/test/screens/dashboard_screen_test.dart`

- [ ] **Step 1: Write the failing widget test**

Create `mobile/test/screens/dashboard_screen_test.dart`:
```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:go_router/go_router.dart';
import 'package:ctracer_mobile/screens/dashboard_screen.dart';
import 'package:ctracer_mobile/hooks/progress_provider.dart';
import 'package:ctracer_mobile/services/storage_service.dart';

Widget buildTestApp() {
  final provider = ProgressProvider(StorageService());
  final router = GoRouter(routes: [
    GoRoute(path: '/', builder: (_, __) => const DashboardScreen()),
  ]);
  return ChangeNotifierProvider.value(
    value: provider,
    child: MaterialApp.router(routerConfig: router),
  );
}

void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  testWidgets('shows certification name', (tester) async {
    await tester.pumpWidget(buildTestApp());
    await tester.pump();
    expect(find.textContaining('Claude Certified Architect'), findsOneWidget);
  });

  testWidgets('shows all 5 domain names', (tester) async {
    await tester.pumpWidget(buildTestApp());
    await tester.pump();
    expect(find.textContaining('Agentic Architecture'), findsOneWidget);
    expect(find.textContaining('Claude Code Configuration'), findsOneWidget);
    expect(find.textContaining('Prompt Engineering'), findsOneWidget);
    expect(find.textContaining('Tool Design'), findsOneWidget);
    expect(find.textContaining('Context Management'), findsOneWidget);
  });

  testWidgets('shows all 4 phase names', (tester) async {
    await tester.pumpWidget(buildTestApp());
    await tester.pump();
    expect(find.text('Foundation'), findsOneWidget);
    expect(find.text('Core Exam Domains'), findsOneWidget);
  });

  testWidgets('shows today panel', (tester) async {
    await tester.pumpWidget(buildTestApp());
    await tester.pump();
    expect(find.text('What to do today'), findsOneWidget);
    expect(find.textContaining('Claude Code 101'), findsOneWidget);
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
flutter test test/screens/dashboard_screen_test.dart
```
Expected: FAIL — Dashboard is a stub.

- [ ] **Step 3: Implement DashboardScreen**

Replace `mobile/lib/screens/dashboard_screen.dart`:
```dart
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../data/content.dart';
import '../hooks/progress_provider.dart';
import '../widgets/card_surface.dart';
import '../widgets/checkbox_row.dart';
import '../widgets/domain_tag.dart';
import '../widgets/pill.dart';
import '../widgets/progress_bar.dart';
import '../widgets/stat_tile.dart';

class DashboardScreen extends HookWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ProgressProvider>();
    final progress = provider.progress;

    final activePhase = kPhases.firstWhere(
      (p) => p.tasks.any((t) => !(progress.tasks[t.id] ?? false)),
      orElse: () => kPhases.last,
    );
    final todayTasks = activePhase.tasks
        .where((t) => !(progress.tasks[t.id] ?? false))
        .take(4)
        .toList();

    final allTasks = kPhases.expand((p) => p.tasks).toList();
    final tasksDone = allTasks.where((t) => progress.tasks[t.id] == true).length;
    final overall = allTasks.isEmpty ? 0 : (tasksDone / allTasks.length * 100).round();

    final coursesDone = kCourses.where((c) => progress.courses[c.id] == true).length;
    final partnerDone = kCourses.where((c) => c.partnerRequired && progress.courses[c.id] == true).length;
    final partnerTotal = kCourses.where((c) => c.partnerRequired).length;
    final projectsDone = kProjects.where((p) => progress.projects[p.id] == 'complete').length;
    final projectsWip = kProjects.where((p) => progress.projects[p.id] == 'in_progress').length;
    final hoursDone = allTasks
        .where((t) => progress.tasks[t.id] == true)
        .fold(0.0, (s, t) => s + t.hours);
    final hoursTotal = allTasks.fold(0.0, (s, t) => s + t.hours);

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0C),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Hero card
              CardSurface(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Active certification track', style: TextStyle(fontSize: 11, color: Color(0xFF7D7D88))),
                          const SizedBox(height: 4),
                          const Text('Claude Certified Architect – Foundations', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFFEDEDF0), letterSpacing: -0.02 * 16)),
                          const SizedBox(height: 10),
                          _MetaRow(label: 'Cost', value: kCert.cost),
                          _MetaRow(label: 'Format', value: kCert.format),
                          _MetaRow(label: 'Duration', value: kCert.duration),
                          _MetaRow(label: 'Pass', value: kCert.passing),
                          const SizedBox(height: 10),
                          Wrap(
                            spacing: 6,
                            runSpacing: 6,
                            children: [
                              Pill(label: 'Launched ${kCert.launched}', isAccent: true),
                              const Pill(label: 'Proctored · no docs allowed'),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    _RingProgress(pct: overall),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // Phase pipeline
              CardSurface(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Study phase pipeline', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Color(0xFFEDEDF0))),
                        TextButton(
                          onPressed: () => context.go('/plan'),
                          child: const Text('View plan →', style: TextStyle(fontSize: 13, color: Color(0xFF9E8FD4))),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    ...kPhases.map((p) {
                      final done = p.tasks.where((t) => progress.tasks[t.id] == true).length;
                      final pct = (done / p.tasks.length * 100).round().toDouble();
                      final isActive = activePhase.id == p.id;
                      final isDone = done == p.tasks.length;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 24,
                                  height: 24,
                                  decoration: BoxDecoration(
                                    color: isActive ? const Color(0xFF9E8FD4) : const Color(0xFF22222B),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  alignment: Alignment.center,
                                  child: Text(
                                    isDone ? '✓' : '0${p.num}',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: isActive ? Colors.white : const Color(0xFF7D7D88),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(p.name, style: TextStyle(fontSize: 13, fontWeight: isActive ? FontWeight.w600 : FontWeight.w400, color: isActive ? const Color(0xFFEDEDF0) : const Color(0xFFB6B6C0))),
                                const Spacer(),
                                Text('$done/${p.tasks.length}', style: const TextStyle(fontSize: 12, color: Color(0xFF7D7D88))),
                              ],
                            ),
                            const SizedBox(height: 6),
                            ProgressBar(
                              value: pct,
                              color: isActive ? const Color(0xFF9E8FD4) : const Color(0xFF3D3D47),
                              height: 3,
                            ),
                          ],
                        ),
                      );
                    }),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // Stats row
              Row(
                children: [
                  Expanded(child: StatTile(label: 'Hours', value: '${hoursTotal.round()}h', sub: '${hoursDone.round()}h done')),
                  const SizedBox(width: 8),
                  Expanded(child: StatTile(label: 'Courses', value: '$coursesDone/${kCourses.length}', sub: '$partnerDone/$partnerTotal req.')),
                  const SizedBox(width: 8),
                  Expanded(child: StatTile(label: 'Projects', value: '$projectsDone/${kProjects.length}', sub: '$projectsWip in progress')),
                ],
              ),
              const SizedBox(height: 12),

              // Domain progress
              CardSurface(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Progress by exam domain', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Color(0xFFEDEDF0))),
                        TextButton(
                          onPressed: () => context.go('/blueprint'),
                          child: const Text('Blueprint →', style: TextStyle(fontSize: 13, color: Color(0xFF9E8FD4))),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ...kDomains.map((d) {
                      final relCourses = coursesByDomain[d.id] ?? [];
                      final relProjects = projectsByDomain[d.id] ?? [];
                      final done =
                          relCourses.where((c) => progress.courses[c.id] == true).length +
                          relProjects.where((p) => progress.projects[p.id] == 'complete').length;
                      final total = relCourses.length + relProjects.length;
                      final pct = total > 0 ? (done / total * 100).round().toDouble() : 0.0;
                      return InkWell(
                        onTap: () => context.go('/domain/${d.id}'),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          child: Row(
                            children: [
                              DomainTag(domain: d),
                              const SizedBox(width: 10),
                              Expanded(child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(d.name, style: const TextStyle(fontSize: 13, color: Color(0xFFEDEDF0))),
                                  const SizedBox(height: 4),
                                  ProgressBar(value: pct, color: d.color, height: 4),
                                ],
                              )),
                              const SizedBox(width: 10),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text('${pct.round()}%', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFFEDEDF0))),
                                  Text('${d.questions}q', style: const TextStyle(fontSize: 11, color: Color(0xFF7D7D88))),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    }),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // Today panel
              CardSurface(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('What to do today', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Color(0xFFEDEDF0))),
                        Pill(label: 'Phase ${activePhase.num} · ${activePhase.name}', isAccent: true),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(activePhase.goal, style: const TextStyle(fontSize: 13, color: Color(0xFFB6B6C0))),
                    const SizedBox(height: 8),
                    if (todayTasks.isEmpty)
                      Text(
                        'Phase ${activePhase.num} complete — move to phase ${(activePhase.num + 1).clamp(1, 4)}.',
                        style: const TextStyle(fontSize: 13, color: Color(0xFF7D7D88)),
                      )
                    else
                      ...todayTasks.map((t) => CheckboxRow(
                        label: t.label,
                        sub: '${t.hours}h · ${t.kind}',
                        checked: progress.tasks[t.id] ?? false,
                        onChanged: (_) => provider.toggleTask(t.id),
                      )),
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: () => context.go('/plan'),
                      child: Text('Open phase ${activePhase.num} →', style: const TextStyle(color: Color(0xFF9E8FD4))),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MetaRow extends StatelessWidget {
  final String label, value;
  const _MetaRow({required this.label, required this.value});
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 2),
      child: RichText(
        text: TextSpan(
          children: [
            TextSpan(text: '$label  ', style: const TextStyle(fontSize: 12, color: Color(0xFF7D7D88))),
            TextSpan(text: value, style: const TextStyle(fontSize: 12, color: Color(0xFFB6B6C0))),
          ],
        ),
      ),
    );
  }
}

class _RingProgress extends StatelessWidget {
  final int pct;
  const _RingProgress({required this.pct});
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 80,
      height: 80,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CircularProgressIndicator(
            value: pct / 100,
            strokeWidth: 6,
            backgroundColor: const Color(0xFF22222B),
            valueColor: const AlwaysStoppedAnimation(Color(0xFF9E8FD4)),
          ),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('$pct%', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFFEDEDF0))),
              const Text('ready', style: TextStyle(fontSize: 9, color: Color(0xFF7D7D88))),
            ],
          ),
        ],
      ),
    );
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
flutter test test/screens/dashboard_screen_test.dart
```
Expected: 4 tests pass.

- [ ] **Step 5: Run full test suite**

```bash
flutter test
```
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add mobile/lib/screens/dashboard_screen.dart mobile/test/screens/dashboard_screen_test.dart
git commit -m "feat: implement DashboardScreen with progress tracking"
```

---

### Task 9: Integration check and push

- [ ] **Step 1: Run all tests**

```bash
flutter test
```
Expected: all tests pass, 0 failures.

- [ ] **Step 2: Run on a simulator and visually verify**

```bash
flutter run
```
Verify:
- Dark background, bottom nav with 5 tabs
- Dashboard shows cert hero card with cert name and ring progress
- 4 study phases with progress bars
- 3 stat tiles (hours, courses, projects)
- 5 domain rows with progress bars
- Today panel with Phase 1 tasks and checkboxes
- Tapping a checkbox marks it and persists across hot restart
- Bottom nav tabs navigate to stub screens

- [ ] **Step 3: Push the branch**

```bash
git push -u origin feature/mobile-foundation-dashboard
```

- [ ] **Step 4: Open a PR**

```bash
gh pr create \
  --title "feat: mobile foundation + DashboardScreen" \
  --body "$(cat <<'EOF'
## Summary
- Adds go_router v14 with ShellRoute and persistent bottom nav (5 tabs)
- Adds flutter_hooks; HookWidget used for DashboardScreen and AppShell
- Ports CCA-F static content as Dart const data layer
- Implements SharedPreferences-backed StorageService and ProgressProvider
- Fully implements DashboardScreen (hero card, phase pipeline, stats, domain progress, today panel)
- All other screens remain stubs

## Test plan
- [ ] `flutter test` passes with 0 failures
- [ ] Dashboard renders on simulator with correct CCA-F content
- [ ] Bottom nav tabs switch screens without errors
- [ ] Checking tasks persists across hot restart (SharedPreferences)
EOF
)"
```
