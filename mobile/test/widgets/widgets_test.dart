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
