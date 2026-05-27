import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';

class AppShell extends HookWidget {
  final Widget child;
  const AppShell({super.key, required this.child});

  static int _indexForLocation(String location) {
    if (location.startsWith('/dashboard') || location == '/') return 0;
    if (location.startsWith('/blueprint')) return 1;
    if (location.startsWith('/plan')) return 2;
    if (location.startsWith('/courses')) return 3;
    if (location.startsWith('/profile')) return 4;
    return -1;
  }

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.path;
    final currentIndex = _indexForLocation(location);

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0C),
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: currentIndex < 0 ? 0 : currentIndex,
        backgroundColor: const Color(0xFF0F0F12),
        indicatorColor: const Color(0xFF22222B),
        onDestinationSelected: (i) {
          const routes = ['/', '/blueprint', '/plan', '/courses', '/profile'];
          context.go(routes[i]);
        },
        destinations: const [
          NavigationDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard), label: 'Dashboard'),
          NavigationDestination(icon: Icon(Icons.assignment_outlined), selectedIcon: Icon(Icons.assignment), label: 'Blueprint'),
          NavigationDestination(icon: Icon(Icons.map_outlined), selectedIcon: Icon(Icons.map), label: 'Plan'),
          NavigationDestination(icon: Icon(Icons.school_outlined), selectedIcon: Icon(Icons.school), label: 'Courses'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}
