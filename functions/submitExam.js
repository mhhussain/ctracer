// functions/submitExam.js
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { scoreSession } from './practiceBank.js'

export const submitExam = onCall(async (req) => {
  const { sessionId, answers } = req.data || {}
  if (!sessionId || typeof answers !== 'object') {
    throw new HttpsError('invalid-argument', 'sessionId and answers are required')
  }
  const db = getFirestore()
  const sref = db.collection('exam_sessions').doc(sessionId)
  const snap = await sref.get()
  if (!snap.exists) throw new HttpsError('not-found', 'session not found')
  const session = snap.data()
  if (session.uid && session.uid !== (req.auth?.uid || null)) {
    throw new HttpsError('permission-denied', 'not your session')
  }
  if (session.submitted) throw new HttpsError('failed-precondition', 'already submitted')

  const { score, review } = scoreSession(session.instances, answers)
  await sref.update({ submitted: true, submittedAt: FieldValue.serverTimestamp() })

  // persist completed attempt for signed-in users (timed mode is always signed-in)
  if (req.auth) {
    await db.collection('users').doc(req.auth.uid).collection('exam_attempts').add({
      mode: session.mode,
      score: score.pct,
      passed: score.pass,
      perDomain: score.perDomain,
      submittedAt: FieldValue.serverTimestamp(),
    })
  }
  return { score, review } // review carries correct positions + explanations
})
