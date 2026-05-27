const KEY = 'ctracer_progress'

const DEFAULT_PROGRESS = {
  courses: {},
  projects: {},
  tasks: {},
  exam_day: {},
  practiceScore: null,
}

export function getProgress() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT_PROGRESS }
    return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_PROGRESS }
  }
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress))
  } catch {
    // quota exceeded or private browsing — in-memory state is still updated
  }
}

export function clearProgress() {
  localStorage.removeItem(KEY)
}
