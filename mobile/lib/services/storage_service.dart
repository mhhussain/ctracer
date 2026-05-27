import 'dart:convert';
import 'package:flutter/foundation.dart';
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
    } catch (e, st) {
      debugPrint('StorageService.getProgress failed: $e\n$st');
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

  Future<ProgressModel?> getProgressFromFirestore(String uid) async => null;
  Future<void> saveProgressToFirestore(String uid, ProgressModel progress) async {}
}
