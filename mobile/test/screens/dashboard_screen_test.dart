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

  testWidgets('shows phase names', (tester) async {
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
