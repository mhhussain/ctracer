// functions/postToLeaderboard.js
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

export const postToLeaderboard = onCall(async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'sign-in required')
  const { displayName, anonymous } = req.data || {}
  const db = getFirestore()

  // server computes the user's best timed score — clients can't forge it
  const attemptsSnap = await db
    .collection('users').doc(req.auth.uid).collection('exam_attempts')
    .where('mode', '==', 'timed').get()
  let best = null
  attemptsSnap.forEach((d) => {
    const s = d.data().score
    if (best == null || s > best) best = s
  })
  if (best == null) throw new HttpsError('failed-precondition', 'no timed score to post')

  await db.collection('leaderboard').doc(req.auth.uid).set({
    displayName: anonymous ? null : (displayName || null),
    anonymous: !!anonymous,
    bestScore: best,
    updatedAt: FieldValue.serverTimestamp(),
  })
  return { bestScore: best }
})
