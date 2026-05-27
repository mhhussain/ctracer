import 'package:flutter_test/flutter_test.dart';
import 'package:ctracer_mobile/data/content.dart';

void main() {
  group('content data', () {
    test('cert has required fields', () {
      expect(kCert.name, 'Claude Certified Architect – Foundations');
      expect(kCert.cost, '\$99');
      expect(kCert.passing, '720 / 1000');
    });

    test('has 5 domains', () => expect(kDomains, hasLength(5)));

    test('domains have all required fields', () {
      for (final d in kDomains) {
        expect(d.id, isNotEmpty);
        expect(d.weight, greaterThan(0));
        expect(d.questions, greaterThan(0));
      }
    });

    test('has 4 phases each with tasks', () {
      expect(kPhases, hasLength(4));
      for (final p in kPhases) {
        expect(p.tasks, isNotEmpty);
      }
    });

    test('has 9 courses', () => expect(kCourses, hasLength(9)));
    test('has 5 projects', () => expect(kProjects, hasLength(5)));
    test('domain weights sum to 100', () {
      final total = kDomains.fold(0, (s, d) => s + d.weight);
      expect(total, 100);
    });
  });
}
