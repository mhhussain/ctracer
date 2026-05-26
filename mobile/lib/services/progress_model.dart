class ProgressModel {
  final Map<String, bool> courses;
  final Map<String, String> projects;
  final Map<String, bool> tasks;
  final Map<String, bool> examDay;
  final String? practiceScore;

  const ProgressModel({
    this.courses = const {},
    this.projects = const {},
    this.tasks = const {},
    this.examDay = const {},
    this.practiceScore,
  });

  ProgressModel copyWith({
    Map<String, bool>? courses,
    Map<String, String>? projects,
    Map<String, bool>? tasks,
    Map<String, bool>? examDay,
    String? practiceScore,
  }) {
    return ProgressModel(
      courses: courses ?? this.courses,
      projects: projects ?? this.projects,
      tasks: tasks ?? this.tasks,
      examDay: examDay ?? this.examDay,
      practiceScore: practiceScore ?? this.practiceScore,
    );
  }

  Map<String, dynamic> toJson() => {
    'courses': courses,
    'projects': projects,
    'tasks': tasks,
    'exam_day': examDay,
    if (practiceScore != null) 'practiceScore': practiceScore,
  };

  factory ProgressModel.fromJson(Map<String, dynamic> json) {
    return ProgressModel(
      courses: Map<String, bool>.from(json['courses'] as Map? ?? {}),
      projects: Map<String, String>.from(json['projects'] as Map? ?? {}),
      tasks: Map<String, bool>.from(json['tasks'] as Map? ?? {}),
      examDay: Map<String, bool>.from(json['exam_day'] as Map? ?? {}),
      practiceScore: json['practiceScore'] as String?,
    );
  }
}
