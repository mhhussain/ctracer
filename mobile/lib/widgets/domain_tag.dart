import 'package:flutter/material.dart';
import '../data/content.dart';

class DomainTag extends StatelessWidget {
  final DomainModel domain;
  const DomainTag({super.key, required this.domain});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 28, height: 28,
      decoration: BoxDecoration(color: domain.color.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(6)),
      alignment: Alignment.center,
      child: Text('D${domain.num}', style: TextStyle(color: domain.color, fontSize: 11, fontWeight: FontWeight.w700, fontFamily: 'monospace')),
    );
  }
}
