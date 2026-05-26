import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../data/content.dart';
import '../hooks/progress_provider.dart';
import '../widgets/card_surface.dart';
import '../widgets/checkbox_row.dart';
import '../widgets/domain_tag.dart';
import '../widgets/pill.dart';
import '../widgets/progress_bar.dart';
import '../widgets/stat_tile.dart';

class DashboardScreen extends HookWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ProgressProvider>();
    final progress = provider.progress;

    final activePhase = kPhases.firstWhere(
      (p) => p.tasks.any((t) => !(progress.tasks[t.id] ?? false)),
      orElse: () => kPhases.last,
    );
    final todayTasks = activePhase.tasks.where((t) => !(progress.tasks[t.id] ?? false)).take(4).toList();

    final allTasks = kPhases.expand((p) => p.tasks).toList();
    final tasksDone = allTasks.where((t) => progress.tasks[t.id] == true).length;
    final overall = allTasks.isEmpty ? 0 : (tasksDone / allTasks.length * 100).round();

    final coursesDone = kCourses.where((c) => progress.courses[c.id] == true).length;
    final partnerDone = kCourses.where((c) => c.partnerRequired && progress.courses[c.id] == true).length;
    final partnerTotal = kCourses.where((c) => c.partnerRequired).length;
    final projectsDone = kProjects.where((p) => progress.projects[p.id] == 'complete').length;
    final projectsWip = kProjects.where((p) => progress.projects[p.id] == 'in_progress').length;
    final hoursDone = allTasks.where((t) => progress.tasks[t.id] == true).fold(0.0, (s, t) => s + t.hours);
    final hoursTotal = allTasks.fold(0.0, (s, t) => s + t.hours);

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0C),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            // Hero card
            CardSurface(child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Active certification track', style: TextStyle(fontSize: 11, color: Color(0xFF7D7D88))),
                const SizedBox(height: 4),
                const Text('Claude Certified Architect – Foundations', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFFEDEDF0))),
                const SizedBox(height: 10),
                _MetaRow(label: 'Cost', value: kCert.cost),
                _MetaRow(label: 'Format', value: kCert.format),
                _MetaRow(label: 'Duration', value: kCert.duration),
                _MetaRow(label: 'Pass', value: kCert.passing),
                const SizedBox(height: 10),
                Wrap(spacing: 6, runSpacing: 6, children: [
                  Pill(label: 'Launched ${kCert.launched}', isAccent: true),
                  const Pill(label: 'Proctored · no docs allowed'),
                ]),
              ])),
              const SizedBox(width: 16),
              _RingProgress(pct: overall),
            ])),
            const SizedBox(height: 12),

            // Phase pipeline
            CardSurface(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                const Text('Study phase pipeline', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Color(0xFFEDEDF0))),
                TextButton(onPressed: () => context.go('/plan'), child: const Text('View plan →', style: TextStyle(fontSize: 13, color: Color(0xFF9E8FD4)))),
              ]),
              const SizedBox(height: 12),
              ...kPhases.map((p) {
                final done = p.tasks.where((t) => progress.tasks[t.id] == true).length;
                final pct = (done / p.tasks.length * 100).round().toDouble();
                final isActive = activePhase.id == p.id;
                final isDone = done == p.tasks.length;
                return Padding(padding: const EdgeInsets.only(bottom: 12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    Container(
                      width: 24, height: 24,
                      decoration: BoxDecoration(color: isActive ? const Color(0xFF9E8FD4) : const Color(0xFF22222B), borderRadius: BorderRadius.circular(6)),
                      alignment: Alignment.center,
                      child: Text(isDone ? '✓' : '0${p.num}', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: isActive ? Colors.white : const Color(0xFF7D7D88))),
                    ),
                    const SizedBox(width: 8),
                    Text(p.name, style: TextStyle(fontSize: 13, fontWeight: isActive ? FontWeight.w600 : FontWeight.w400, color: isActive ? const Color(0xFFEDEDF0) : const Color(0xFFB6B6C0))),
                    const Spacer(),
                    Text('$done/${p.tasks.length}', style: const TextStyle(fontSize: 12, color: Color(0xFF7D7D88))),
                  ]),
                  const SizedBox(height: 6),
                  ProgressBar(value: pct, color: isActive ? const Color(0xFF9E8FD4) : const Color(0xFF3D3D47), height: 3),
                ]));
              }),
            ])),
            const SizedBox(height: 12),

            // Stats row
            Row(children: [
              Expanded(child: StatTile(label: 'Hours', value: '${hoursTotal.round()}h', sub: '${hoursDone.round()}h done')),
              const SizedBox(width: 8),
              Expanded(child: StatTile(label: 'Courses', value: '$coursesDone/${kCourses.length}', sub: '$partnerDone/$partnerTotal req.')),
              const SizedBox(width: 8),
              Expanded(child: StatTile(label: 'Projects', value: '$projectsDone/${kProjects.length}', sub: '$projectsWip in progress')),
            ]),
            const SizedBox(height: 12),

            // Domain progress
            CardSurface(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                const Text('Progress by exam domain', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Color(0xFFEDEDF0))),
                TextButton(onPressed: () => context.go('/blueprint'), child: const Text('Blueprint →', style: TextStyle(fontSize: 13, color: Color(0xFF9E8FD4)))),
              ]),
              const SizedBox(height: 8),
              ...kDomains.map((d) {
                final relCourses = coursesByDomain[d.id] ?? [];
                final relProjects = projectsByDomain[d.id] ?? [];
                final done = relCourses.where((c) => progress.courses[c.id] == true).length
                    + relProjects.where((p) => progress.projects[p.id] == 'complete').length;
                final total = relCourses.length + relProjects.length;
                final pct = total > 0 ? (done / total * 100).round().toDouble() : 0.0;
                return InkWell(
                  onTap: () => context.go('/domain/${d.id}'),
                  child: Padding(padding: const EdgeInsets.symmetric(vertical: 8), child: Row(children: [
                    DomainTag(domain: d),
                    const SizedBox(width: 10),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(d.name, style: const TextStyle(fontSize: 13, color: Color(0xFFEDEDF0))),
                      const SizedBox(height: 4),
                      ProgressBar(value: pct, color: d.color, height: 4),
                    ])),
                    const SizedBox(width: 10),
                    Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                      Text('${pct.round()}%', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFFEDEDF0))),
                      Text('${d.questions}q', style: const TextStyle(fontSize: 11, color: Color(0xFF7D7D88))),
                    ]),
                  ])),
                );
              }),
            ])),
            const SizedBox(height: 12),

            // Today panel
            CardSurface(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                const Text('What to do today', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Color(0xFFEDEDF0))),
                Pill(label: 'Phase ${activePhase.num} · ${activePhase.name}', isAccent: true),
              ]),
              const SizedBox(height: 8),
              Text(activePhase.goal, style: const TextStyle(fontSize: 13, color: Color(0xFFB6B6C0))),
              const SizedBox(height: 8),
              if (todayTasks.isEmpty)
                Text('Phase ${activePhase.num} complete — move to phase ${(activePhase.num + 1).clamp(1, 4)}.', style: const TextStyle(fontSize: 13, color: Color(0xFF7D7D88)))
              else
                ...todayTasks.map((t) => CheckboxRow(
                  label: t.label,
                  sub: '${t.hours}h · ${t.kind}',
                  checked: progress.tasks[t.id] ?? false,
                  onChanged: (_) => provider.toggleTask(t.id),
                )),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () => context.go('/plan'),
                child: Text('Open phase ${activePhase.num} →', style: const TextStyle(color: Color(0xFF9E8FD4))),
              ),
            ])),
          ]),
        ),
      ),
    );
  }
}

class _MetaRow extends StatelessWidget {
  final String label, value;
  const _MetaRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(padding: const EdgeInsets.only(bottom: 2), child: RichText(text: TextSpan(children: [
      TextSpan(text: '$label  ', style: const TextStyle(fontSize: 12, color: Color(0xFF7D7D88))),
      TextSpan(text: value, style: const TextStyle(fontSize: 12, color: Color(0xFFB6B6C0))),
    ])));
  }
}

class _RingProgress extends StatelessWidget {
  final int pct;
  const _RingProgress({required this.pct});

  @override
  Widget build(BuildContext context) {
    return SizedBox(width: 80, height: 80, child: Stack(alignment: Alignment.center, children: [
      CircularProgressIndicator(
        value: pct / 100,
        strokeWidth: 6,
        backgroundColor: const Color(0xFF22222B),
        valueColor: const AlwaysStoppedAnimation(Color(0xFF9E8FD4)),
      ),
      Column(mainAxisSize: MainAxisSize.min, children: [
        Text('$pct%', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFFEDEDF0))),
        const Text('ready', style: TextStyle(fontSize: 9, color: Color(0xFF7D7D88))),
      ]),
    ]));
  }
}
