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
