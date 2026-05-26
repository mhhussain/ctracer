import 'package:flutter/material.dart';

class DomainColors {
  static const amber   = Color(0xFFCDA96A);
  static const violet  = Color(0xFF9E8FD4);
  static const emerald = Color(0xFF6DB89A);
  static const sky     = Color(0xFF6BA8C8);
  static const pink    = Color(0xFFCC7FA8);
}

class CertInfo {
  final String name, short, launched, cost, format, duration, passing;
  const CertInfo({required this.name, required this.short, required this.launched, required this.cost, required this.format, required this.duration, required this.passing});
}

class DomainModel {
  final String id, short, name, difficulty, blurb;
  final int num, weight, questions;
  final Color color;
  const DomainModel({required this.id, required this.num, required this.short, required this.name, required this.weight, required this.questions, required this.color, required this.difficulty, required this.blurb});
}

class TaskModel {
  final String id, label, kind;
  final double hours;
  final String? domain;
  const TaskModel({required this.id, required this.label, required this.kind, required this.hours, this.domain});
}

class PhaseModel {
  final String id, week, name, goal;
  final int num;
  final double hours;
  final List<TaskModel> tasks;
  const PhaseModel({required this.id, required this.num, required this.week, required this.name, required this.goal, required this.hours, required this.tasks});
}

class CourseModel {
  final String id, name, level, blurb;
  final double hours;
  final List<String> domains;
  final bool partnerRequired;
  const CourseModel({required this.id, required this.name, required this.hours, required this.level, required this.domains, required this.partnerRequired, required this.blurb});
}

class ProjectModel {
  final String id, name, complexity, summary;
  final double hours;
  final List<String> domains;
  const ProjectModel({required this.id, required this.name, required this.domains, required this.complexity, required this.hours, required this.summary});
}

class ExamDayItem {
  final String id, label;
  final bool critical;
  const ExamDayItem({required this.id, required this.label, required this.critical});
}

const kCert = CertInfo(
  name: 'Claude Certified Architect – Foundations',
  short: 'CCA-F',
  launched: 'March 12, 2026',
  cost: '\$99',
  format: '60 questions • multiple choice + scenario',
  duration: '120 min',
  passing: '720 / 1000',
);

const kDomains = [
  DomainModel(id: 'd1', num: 1, short: 'Agentic', name: 'Agentic Architecture & Orchestration', weight: 27, questions: 16, color: DomainColors.amber, difficulty: 'Hardest', blurb: 'Design autonomous multi-step systems that reliably complete complex tasks without human intervention.'),
  DomainModel(id: 'd2', num: 2, short: 'Claude Code', name: 'Claude Code Configuration & Workflows', weight: 20, questions: 12, color: DomainColors.violet, difficulty: 'Production', blurb: 'Production-level use of Claude Code — configuring it at the architecture level for teams and CI/CD pipelines.'),
  DomainModel(id: 'd3', num: 3, short: 'Prompts', name: 'Prompt Engineering & Structured Output', weight: 20, questions: 12, color: DomainColors.emerald, difficulty: 'Production', blurb: 'Engineering-grade prompt systems with validation and fallback — not clever prompts, reliable ones.'),
  DomainModel(id: 'd4', num: 4, short: 'Tools & MCP', name: 'Tool Design & MCP Integration', weight: 18, questions: 11, color: DomainColors.sky, difficulty: 'Core', blurb: 'Build and connect tools Claude can call — including designing good schemas and shipping production MCP servers.'),
  DomainModel(id: 'd5', num: 5, short: 'Context', name: 'Context Management & Reliability', weight: 15, questions: 9, color: DomainColors.pink, difficulty: 'Core', blurb: 'Manage the context window so Claude stays focused, accurate, and consistent across long interactions.'),
];

const kPhases = [
  PhaseModel(id: 'p1', num: 1, week: 'Week 1', name: 'Foundation', goal: 'Refresh core concepts, fill any gaps', hours: 8, tasks: [
    TaskModel(id: 'p1t1', label: 'Claude Code 101', hours: 2, kind: 'course'),
    TaskModel(id: 'p1t2', label: 'Claude 101', hours: 3, kind: 'course'),
    TaskModel(id: 'p1t3', label: 'Building with the Claude API — Modules 1–3', hours: 2, kind: 'course'),
    TaskModel(id: 'p1t4', label: 'Review Messages API reference', hours: 1, kind: 'review'),
  ]),
  PhaseModel(id: 'p2', num: 2, week: 'Weeks 2–3', name: 'Core Exam Domains', goal: 'Cover all five domains with hands-on projects', hours: 22.5, tasks: [
    TaskModel(id: 'p2t1', label: 'Agents & Workflows module', hours: 1.5, kind: 'course', domain: 'd1'),
    TaskModel(id: 'p2t2', label: 'Introduction to Subagents', hours: 1, kind: 'course', domain: 'd1'),
    TaskModel(id: 'p2t3', label: 'Introduction to MCP', hours: 2, kind: 'course', domain: 'd4'),
    TaskModel(id: 'p2t4', label: 'MCP: Advanced Topics', hours: 2, kind: 'course', domain: 'd4'),
    TaskModel(id: 'p2t5', label: 'Project — MCP server w/ tools + resources + prompts', hours: 3, kind: 'project', domain: 'd4'),
    TaskModel(id: 'p2t6', label: 'Project — Multi-step agentic workflow w/ fallback', hours: 3, kind: 'project', domain: 'd1'),
    TaskModel(id: 'p2t7', label: 'Claude Code in Action (full)', hours: 6, kind: 'course', domain: 'd2'),
    TaskModel(id: 'p2t8', label: 'Introduction to Agent Skills', hours: 1, kind: 'course', domain: 'd2'),
    TaskModel(id: 'p2t9', label: 'Prompt Engineering module', hours: 1, kind: 'course', domain: 'd3'),
    TaskModel(id: 'p2t10', label: 'Prompt Evaluation module', hours: 1, kind: 'course', domain: 'd3'),
    TaskModel(id: 'p2t11', label: 'Project — CLAUDE.md hierarchy + custom Skill', hours: 2, kind: 'project', domain: 'd2'),
    TaskModel(id: 'p2t12', label: 'Project — Prompt eval pipeline w/ auto-grading', hours: 2, kind: 'project', domain: 'd3'),
  ]),
  PhaseModel(id: 'p3', num: 3, week: 'Week 4', name: 'Context & Integration', goal: 'Close out Domain 5; do full RAG build', hours: 9, tasks: [
    TaskModel(id: 'p3t1', label: 'RAG & Agentic Search module', hours: 1.5, kind: 'course', domain: 'd5'),
    TaskModel(id: 'p3t2', label: 'Features of Claude module', hours: 1.5, kind: 'course', domain: 'd5'),
    TaskModel(id: 'p3t3', label: 'Project — Full RAG pipeline', hours: 4, kind: 'project', domain: 'd5'),
    TaskModel(id: 'p3t4', label: 'Project — Prompt caching on high-volume prompt', hours: 1, kind: 'project', domain: 'd3'),
    TaskModel(id: 'p3t5', label: 'Review extended thinking, PDF/image, Citations, Files API', hours: 1, kind: 'review', domain: 'd5'),
  ]),
  PhaseModel(id: 'p4', num: 4, week: 'Week 5', name: 'Exam Prep', goal: 'Solidify, identify gaps, practice scenarios', hours: 8, tasks: [
    TaskModel(id: 'p4t1', label: 'claudecertifications.com — 33+ practice questions', hours: 2, kind: 'practice'),
    TaskModel(id: 'p4t2', label: 'Review all 5 domain anti-patterns', hours: 1, kind: 'review'),
    TaskModel(id: 'p4t3', label: 'Re-read tool use ref, MCP spec, Claude Code docs', hours: 2, kind: 'review'),
    TaskModel(id: 'p4t4', label: 'Review architecture tradeoffs (latency / cost / reliability)', hours: 1, kind: 'review'),
    TaskModel(id: 'p4t5', label: 'Mock exam simulation (timed, no reference)', hours: 2, kind: 'practice'),
  ]),
];

const kCourses = [
  CourseModel(id: 'c1', name: 'Building with the Claude API', hours: 4, level: 'Intermediate', domains: ['d3', 'd4', 'd5'], partnerRequired: true, blurb: 'API auth, prompt engineering, tool use, RAG, MCP, agents & workflows — the spine of the prep.'),
  CourseModel(id: 'c2', name: 'Introduction to Agent Skills', hours: 1, level: 'Intermediate', domains: ['d2'], partnerRequired: true, blurb: 'Reusable Skills with frontmatter — how they differ from CLAUDE.md, hooks, and subagents.'),
  CourseModel(id: 'c3', name: 'Introduction to Model Context Protocol', hours: 2, level: 'Intermediate', domains: ['d4'], partnerRequired: true, blurb: 'MCP primitives — Tools, Resources, Prompts — and the Python SDK decorator pattern.'),
  CourseModel(id: 'c4', name: 'Claude Code in Action', hours: 6, level: 'Intermediate', domains: ['d2'], partnerRequired: true, blurb: 'Production Claude Code — context control, custom commands, MCP, hooks, SDK.'),
  CourseModel(id: 'c5', name: 'Claude Code 101', hours: 2, level: 'Beginner', domains: ['d2'], partnerRequired: false, blurb: 'Best first course for developers. Covers daily development workflow with Claude Code.'),
  CourseModel(id: 'c6', name: 'Claude 101', hours: 3, level: 'Beginner', domains: [], partnerRequired: false, blurb: 'Non-developer / business stakeholder primer. Projects, Artifacts, Skills, Connectors, desktop app.'),
  CourseModel(id: 'c7', name: 'MCP: Advanced Topics', hours: 2, level: 'Advanced', domains: ['d4'], partnerRequired: false, blurb: 'Advanced implementation patterns for production MCP server development.'),
  CourseModel(id: 'c8', name: 'Introduction to Subagents', hours: 1, level: 'Intermediate', domains: ['d1'], partnerRequired: false, blurb: 'Subagents to manage context and delegate specialized tasks — directly supports Domain 1.'),
  CourseModel(id: 'c9', name: 'AI Fluency: Framework & Foundations', hours: 4, level: 'Beginner', domains: [], partnerRequired: false, blurb: '4D Framework — Delegation, Description, Discernment, Diligence. Good for team distribution.'),
];

const kProjects = [
  ProjectModel(id: 'pr1', name: 'RAG Knowledge Assistant', domains: ['d5', 'd3'], complexity: 'Medium', hours: 5, summary: 'Document ingestion → vector database → Claude with structured prompts.'),
  ProjectModel(id: 'pr2', name: 'Tool-Enabled Support Chatbot', domains: ['d4', 'd1'], complexity: 'Medium', hours: 4, summary: 'Claude calling external APIs for real data retrieval in a multi-turn conversation.'),
  ProjectModel(id: 'pr3', name: 'Multi-Step Autonomous Agent', domains: ['d1'], complexity: 'High', hours: 8, summary: 'Orchestrated tool sequences completing complex tasks autonomously with fallback logic.'),
  ProjectModel(id: 'pr4', name: 'MCP Server', domains: ['d4'], complexity: 'Medium', hours: 4, summary: 'Python MCP server with tools, resources, and prompts; tested via Server Inspector.'),
  ProjectModel(id: 'pr5', name: 'Prompt Eval Pipeline', domains: ['d3'], complexity: 'Medium', hours: 4, summary: 'Automated eval system with test datasets, model-based grading, and retry on failure.'),
];

const kExamDayChecklist = [
  ExamDayItem(id: 'x1', label: 'All 4 Partner Network courses complete', critical: true),
  ExamDayItem(id: 'x2', label: 'All 5 projects built', critical: true),
  ExamDayItem(id: 'x3', label: 'Practice questions scoring 80%+', critical: true),
  ExamDayItem(id: 'x4', label: 'All 5 domain anti-patterns reviewed', critical: true),
  ExamDayItem(id: 'x5', label: 'Claude Partner Network membership active', critical: true),
  ExamDayItem(id: 'x6', label: 'Exam registered at anthropic.skilljar.com', critical: true),
  ExamDayItem(id: 'x7', label: 'Quiet, distraction-free environment lined up', critical: false),
  ExamDayItem(id: 'x8', label: 'Government ID ready for proctor check', critical: false),
  ExamDayItem(id: 'x9', label: 'Reliable internet + power; backup if remote', critical: false),
];

final Map<String, List<CourseModel>> coursesByDomain = () {
  final map = <String, List<CourseModel>>{};
  for (final c in kCourses) {
    for (final d in c.domains) {
      map.putIfAbsent(d, () => []).add(c);
    }
  }
  return map;
}();

final Map<String, List<ProjectModel>> projectsByDomain = () {
  final map = <String, List<ProjectModel>>{};
  for (final p in kProjects) {
    for (final d in p.domains) {
      map.putIfAbsent(d, () => []).add(p);
    }
  }
  return map;
}();
