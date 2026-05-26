import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

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
      providers: [ChangeNotifierProvider.value(value: progressProvider)],
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
        GoRoute(path: '/domain/:id', builder: (_, state) => DomainDeepDiveScreen(domainId: state.pathParameters['id']!)),
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
      labelTextStyle: WidgetStateProperty.all(const TextStyle(fontSize: 12, color: Color(0xFFB6B6C0))),
      iconTheme: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) return const IconThemeData(color: Color(0xFF9E8FD4));
        return const IconThemeData(color: Color(0xFF7D7D88));
      }),
    ),
    useMaterial3: true,
  );
}
