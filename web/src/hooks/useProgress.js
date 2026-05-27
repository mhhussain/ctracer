import { useState, useCallback } from 'react'
import { getProgress, saveProgress } from '../lib/storage'
import { COURSES, PROJECTS, PHASES } from '../data/index'

const ALL_TASKS = PHASES.flatMap((p) => p.tasks)
const HOURS_TOTAL = Math.round(ALL_TASKS.reduce((s, t) => s + t.hours, 0) * 10) / 10

export function useProgress() {
  const [progress, setProgress] = useState(getProgress)

  const update = useCallback((fn) => {
    setProgress((prev) => {
      const next = fn(prev)
      saveProgress(next)
      return next
    })
  }, [])

  const toggleCourse = useCallback(
    (id) => update((p) => ({ ...p, courses: { ...p.courses, [id]: !p.courses[id] } })),
    [update]
  )

  const toggleTask = useCallback(
    (id) => update((p) => ({ ...p, tasks: { ...p.tasks, [id]: !p.tasks[id] } })),
    [update]
  )

  const setProject = useCallback(
    (id, status) => update((p) => ({ ...p, projects: { ...p.projects, [id]: status } })),
    [update]
  )

  const toggleExamDay = useCallback(
    (id) => update((p) => ({ ...p, exam_day: { ...p.exam_day, [id]: !p.exam_day[id] } })),
    [update]
  )

  const setPracticeScore = useCallback(
    (score) => update((p) => ({ ...p, practiceScore: score })),
    [update]
  )

  const coursesDone = COURSES.filter((c) => progress.courses[c.id]).length
  const partnerDone = COURSES.filter((c) => c.partnerRequired && progress.courses[c.id]).length
  const partnerTotal = COURSES.filter((c) => c.partnerRequired).length
  const projectsDone = PROJECTS.filter((p) => progress.projects[p.id] === 'complete').length
  const projectsWip = PROJECTS.filter((p) => progress.projects[p.id] === 'in_progress').length
  const tasksDone = ALL_TASKS.filter((t) => progress.tasks[t.id]).length
  const hoursDone = Math.round(
    ALL_TASKS.filter((t) => progress.tasks[t.id]).reduce((s, t) => s + t.hours, 0) * 10
  ) / 10
  const overall = ALL_TASKS.length > 0 ? Math.round((tasksDone / ALL_TASKS.length) * 100) : 0

  return {
    progress,
    toggleCourse,
    toggleTask,
    setProject,
    toggleExamDay,
    setPracticeScore,
    stats: {
      coursesDone,
      coursesTotal: COURSES.length,
      partnerDone,
      partnerTotal,
      projectsDone,
      projectsTotal: PROJECTS.length,
      projectsWip,
      hoursDone,
      hoursTotal: HOURS_TOTAL,
      overall,
    },
  }
}
