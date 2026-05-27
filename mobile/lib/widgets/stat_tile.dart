import 'package:flutter/material.dart';

class StatTile extends StatelessWidget {
  final String label, value;
  final String? sub;
  const StatTile({super.key, required this.label, required this.value, this.sub});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFF131318), border: Border.all(color: const Color(0x0FFFFFFF)), borderRadius: BorderRadius.circular(10)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: Color(0xFFEDEDF0), height: 1)),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(fontSize: 13, color: Color(0xFFB6B6C0))),
        if (sub != null) ...[const SizedBox(height: 2), Text(sub!, style: const TextStyle(fontSize: 12, color: Color(0xFF7D7D88)))],
      ]),
    );
  }
}
