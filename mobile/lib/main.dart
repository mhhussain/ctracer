import 'package:flutter/material.dart';
import 'screens/dashboard_screen.dart';

void main() {
  runApp(const CtracerApp());
}

class CtracerApp extends StatelessWidget {
  const CtracerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ctracer',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF6D28D9)),
        useMaterial3: true,
      ),
      home: const DashboardScreen(),
    );
  }
}
