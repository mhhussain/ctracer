// web/src/lib/examStorage.js
// Practice Exam persistence. Mirrors the local-vs-Firestore strategy in storage.js.
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from './firebase'

const ATTEMPTS_KEY = 'ctracer_exam_attempts'
const ACTIVE_KEY = 'ctracer_exam_active'
const POSTED_KEY = 'ctracer_exam_posted'

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}
function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // quota / private browsing — in-memory state still holds for the session
  }
}

// ---- completed attempts ----
export function loadLocalAttempts() {
  return readJSON(ATTEMPTS_KEY, [])
}
export function addLocalAttempt(attempt) {
  const all = [attempt, ...loadLocalAttempts()]
  writeJSON(ATTEMPTS_KEY, all)
  return all
}

// Signed-in: live subscription to the user's exam_attempts subcollection.
export function subscribeToAttempts(user, callback) {
  if (!user) {
    callback(loadLocalAttempts())
    return () => {}
  }
  const ref = collection(db, 'users', user.uid, 'exam_attempts')
  const q = query(ref, orderBy('submittedAt', 'desc'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        ...data,
        // Server attempts store submittedAt as a Firestore Timestamp; locally we
        // use epoch millis. Normalize so date formatting and sorting work for both.
        submittedAt: data.submittedAt?.toMillis?.() ?? data.submittedAt ?? null,
      }
    }))
  })
}

// Signed-in: persist a completed attempt to Firestore.
// (In Part B, TIMED attempts are written server-side by submitExam instead.)
export async function addRemoteAttempt(user, attempt) {
  const ref = collection(db, 'users', user.uid, 'exam_attempts')
  await addDoc(ref, attempt)
}

// ---- active (in-progress) attempt: always local, transient ----
export function loadActive() {
  return readJSON(ACTIVE_KEY, null)
}
export function saveActive(attempt) {
  writeJSON(ACTIVE_KEY, attempt)
}
export function clearActive() {
  localStorage.removeItem(ACTIVE_KEY)
}

// ---- posted leaderboard entry: local in Part A (Firestore in Part B) ----
export function loadPosted() {
  return readJSON(POSTED_KEY, null)
}
export function savePosted(entry) {
  writeJSON(POSTED_KEY, entry)
}
export function clearPosted() {
  localStorage.removeItem(POSTED_KEY)
}

export function clearExamStorage() {
  localStorage.removeItem(ATTEMPTS_KEY)
  localStorage.removeItem(ACTIVE_KEY)
  localStorage.removeItem(POSTED_KEY)
}
