// functions/startExam.js
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { loadBank, buildTimedSession } from './examBank.js'

export const startExam = onCall({ invoker: 'public' }, async (req) => {
  const mode = req.data?.mode
  if (mode !== 'timed') {
    throw new HttpsError('invalid-argument', 'startExam only supports timed mode; practice runs client-side')
  }
  if (!req.auth) {
    throw new HttpsError('unauthenticated', 'Timed exams require sign-in')
  }

  const bank = await loadBank()
  const { instances, sanitized } = buildTimedSession(bank)
  const db = getFirestore()
  const ref = await db.collection('exam_sessions').add({
    uid: req.auth?.uid || null,
    mode,
    instances,            // full instances incl. answer key — server only
    createdAt: FieldValue.serverTimestamp(),
    durationMs: mode === 'timed' ? 120 * 60 * 1000 : null,
    submitted: false,
  })

  return { sessionId: ref.id, mode, questions: sanitized } // no isCorrect leaves the server
})
