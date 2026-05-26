import 'package:flutter/material.dart';

class ProgressBar extends StatelessWidget {
  final double value;
  final Color color;
  final double height;
  const ProgressBar({super.key, required this.value, required this.color, this.height = 5});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (_, constraints) {
      final pct = (value.clamp(0, 100) / 100);
      return Container(
        height: height,
        decoration: BoxDecoration(color: const Color(0xFF22222B), borderRadius: BorderRadius.circular(999)),
        child: Align(
          alignment: Alignment.centerLeft,
          child: FractionallySizedBox(
            widthFactor: pct,
            child: Container(decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(999))),
          ),
        ),
      );
    });
  }
}
