import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_PROGRESS, saveProgress, subscribeToProgress } from '../lib/storage'
import { COURSES, PHASES, PROJECTS } from '../data/index'
import { useAuth } from './useAuth'

const ALL_TASKS = PHASES.flatMap((p) => p.tasks)
const HOURS_TOTAL = Math.round(ALL_TASKS.reduce((s, t) => s + t.hours, 0) * 10) / 10

const STATUS_CYCLE = {
  not_started: 'in_progress',
  in_progress: 'complete',
  complete: 'not_started',
}

export function useProgress() {
  const { user } = useAuth()
  const [progress, setProgress] = useState(DEFAULT_PROGRESS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const unsubscribe = subscribeToProgress(user, (p) => {
      setProgress(p)
      setLoading(false)
    })
    return unsubscribe
  }, [user])

  const update = useCallback(
    (fn) => {
      setProgress((prev) => {
        const next = fn(prev)
        saveProgress(user, next)
        return next
      })
    },
    [user],
  )

  const toggleCourse = useCallback(
    (id) => update((p) => ({ ...p, courses: { ...p.courses, [id]: !p.courses[id] } })),
    [update],
  )

  const toggleTask = useCallback(
    (id) => update((p) => ({ ...p, tasks: { ...p.tasks, [id]: !p.tasks[id] } })),
    [update],
  )

  const setProject = useCallback(
    (id, status) => update((p) => ({ ...p, projects: { ...p.projects, [id]: status } })),
    [update],
  )

  const cycleProject = useCallback(
    (id) => update((p) => ({
      ...p,
      projects: {
        ...p.projects,
        [id]: STATUS_CYCLE[p.projects[id]] ?? 'in_progress',
      },
    })),
    [update],
  )

  const toggleExamDay = useCallback(
    (id) => update((p) => ({ ...p, exam_day: { ...p.exam_day, [id]: !p.exam_day[id] } })),
    [update],
  )

  const setPracticeScore = useCallback(
    (score) => update((p) => ({ ...p, practiceScore: score })),
    [update],
  )

  const setExamDate = useCallback(
    (date) => update((p) => ({ ...p, examDate: date })),
    [update],
  )

  const coursesDone = COURSES.filter((c) => progress.courses[c.id]).length
  const partnerDone = COURSES.filter((c) => c.partnerRequired && progress.courses[c.id]).length
  const partnerTotal = COURSES.filter((c) => c.partnerRequired).length
  const projectsDone = PROJECTS.filter((p) => progress.projects[p.id] === 'complete').length
  const projectsWip = PROJECTS.filter((p) => progress.projects[p.id] === 'in_progress').length
  const tasksDone = ALL_TASKS.filter((t) => progress.tasks[t.id]).length
  const hoursDone =
    Math.round(ALL_TASKS.filter((t) => progress.tasks[t.id]).reduce((s, t) => s + t.hours, 0) * 10) / 10
  const overall = ALL_TASKS.length > 0 ? Math.round((tasksDone / ALL_TASKS.length) * 100) : 0

  return {
    progress,
    loading,
    toggleCourse,
    toggleTask,
    setProject,
    cycleProject,
    toggleExamDay,
    setPracticeScore,
    setExamDate,
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
