// functions/submitExam.js
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { scoreSession } from './examBank.js'

export const submitExam = onCall({ invoker: 'public' }, async (req) => {
  const { sessionId, answers } = req.data || {}
  if (!sessionId || answers === null || typeof answers !== 'object' || Array.isArray(answers)) {
    throw new HttpsError('invalid-argument', 'sessionId and answers are required')
  }
  const db = getFirestore()
  const sref = db.collection('exam_sessions').doc(sessionId)

  let score, review, sessionMode
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(sref)
    if (!snap.exists) throw new HttpsError('not-found', 'session not found')
    const session = snap.data()
    if (session.uid !== (req.auth?.uid ?? null)) {
      throw new HttpsError('permission-denied', 'not your session')
    }
    if (session.submitted) throw new HttpsError('failed-precondition', 'already submitted')
    const result = scoreSession(session.instances, answers)
    score = result.score
    review = result.review
    sessionMode = session.mode
    tx.update(sref, { submitted: true, submittedAt: FieldValue.serverTimestamp() })
  })

  // persist completed attempt for signed-in users (timed mode is always signed-in)
  if (req.auth) {
    await db.collection('users').doc(req.auth.uid).collection('exam_attempts').add({
      mode: sessionMode,
      score: { pct: score.pct, pass: score.pass, perDomain: score.perDomain, correct: score.correct, total: score.total },
      submittedAt: FieldValue.serverTimestamp(),
    })
  }
  return { score, review } // review carries correct positions + explanations
})
