import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from './firebase'

const KEY = 'ctracer_progress'

export const DEFAULT_PROGRESS = {
  courses: {},
  projects: {},
  tasks: {},
  exam_day: {},
  practiceScore: null,
  examDate: null,
}

function getLocalProgress() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT_PROGRESS }
    return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_PROGRESS }
  }
}

export function subscribeToProgress(user, callback) {
  if (!user) {
    callback(getLocalProgress())
    return () => {}
  }
  const ref = doc(db, 'users', user.uid, 'progress', 'data')
  return onSnapshot(ref, (snap) => {
    callback(snap.exists() ? { ...DEFAULT_PROGRESS, ...snap.data() } : { ...DEFAULT_PROGRESS })
  })
}

export function saveProgress(user, progress) {
  if (!user) {
    try {
      localStorage.setItem(KEY, JSON.stringify(progress))
    } catch {
      // quota exceeded or private browsing — in-memory state is still updated
    }
    return
  }
  const ref = doc(db, 'users', user.uid, 'progress', 'data')
  setDoc(ref, progress, { merge: true }).catch(() => {
    // Firestore has built-in offline persistence; this catch is a safety net only
  })
}

export function clearProgress() {
  localStorage.removeItem(KEY)
}

export async function resetProgress(user) {
  clearProgress() // always wipe localStorage
  if (!user) return
  const ref = doc(db, 'users', user.uid, 'progress', 'data')
  await setDoc(ref, DEFAULT_PROGRESS) // overwrite Firestore with clean defaults
}
