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
