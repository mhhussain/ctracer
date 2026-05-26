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
    _progress.copyWith(courses: {..._progress.courses, id: !(_progress.courses[id] ?? false)}),
  );

  Future<void> toggleTask(String id) => _update(
    _progress.copyWith(tasks: {..._progress.tasks, id: !(_progress.tasks[id] ?? false)}),
  );

  Future<void> setProject(String id, String status) => _update(
    _progress.copyWith(projects: {..._progress.projects, id: status}),
  );

  Future<void> toggleExamDay(String id) => _update(
    _progress.copyWith(examDay: {..._progress.examDay, id: !(_progress.examDay[id] ?? false)}),
  );

  Future<void> setPracticeScore(String score) => _update(
    _progress.copyWith(practiceScore: score),
  );
}
