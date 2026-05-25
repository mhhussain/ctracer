import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:ctracer_mobile/main.dart';

void main() {
  testWidgets('CtracerApp renders without crashing', (WidgetTester tester) async {
    await tester.pumpWidget(const CtracerApp());
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
