import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:ctracer_mobile/main.dart';
import 'package:ctracer_mobile/hooks/progress_provider.dart';
import 'package:ctracer_mobile/services/storage_service.dart';

void main() {
  testWidgets('CtracerApp renders without crashing', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});
    final provider = ProgressProvider(StorageService());
    await provider.load();
    await tester.pumpWidget(
      ChangeNotifierProvider.value(
        value: provider,
        child: const CtracerApp(),
      ),
    );
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
