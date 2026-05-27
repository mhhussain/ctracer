import 'package:flutter/material.dart';

class CheckboxRow extends StatelessWidget {
  final String label;
  final String? sub;
  final bool checked;
  final ValueChanged<bool?> onChanged;
  const CheckboxRow({super.key, required this.label, required this.checked, required this.onChanged, this.sub});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => onChanged(!checked),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Checkbox(value: checked, onChanged: onChanged, activeColor: const Color(0xFF9E8FD4), materialTapTargetSize: MaterialTapTargetSize.shrinkWrap, visualDensity: VisualDensity.compact),
          const SizedBox(width: 8),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(label, style: const TextStyle(fontSize: 14, color: Color(0xFFEDEDF0))),
            if (sub != null) Text(sub!, style: const TextStyle(fontSize: 12, color: Color(0xFF7D7D88))),
          ])),
        ]),
      ),
    );
  }
}
