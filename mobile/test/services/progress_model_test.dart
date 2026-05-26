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
