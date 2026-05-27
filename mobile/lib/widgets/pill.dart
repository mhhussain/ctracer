import 'package:flutter/material.dart';

class Pill extends StatelessWidget {
  final String label;
  final bool isAccent;
  const Pill({super.key, required this.label, this.isAccent = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: isAccent ? const Color(0x289E8FD4) : const Color(0xFF22222B), borderRadius: BorderRadius.circular(999)),
      child: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: isAccent ? const Color(0xFF9E8FD4) : const Color(0xFFB6B6C0))),
    );
  }
}
