import 'package:flutter/material.dart';

class CardSurface extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  const CardSurface({super.key, required this.child, this.padding});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding ?? const EdgeInsets.all(20),
      decoration: BoxDecoration(color: const Color(0xFF131318), border: Border.all(color: const Color(0x0FFFFFFF)), borderRadius: BorderRadius.circular(14)),
      child: child,
    );
  }
}
