// functions/getPracticeExam.js
// Returns the practice question set (practice wordings + answer key + explanations).
// Unauthenticated calls allowed — practice is the free/public study mode.
import { onCall } from 'firebase-functions/v2/https'
import { loadBank, buildPracticeQuestions } from './examBank.js'

export const getPracticeExam = onCall({ invoker: 'public' }, async () => {
  const bank = await loadBank()
  return { questions: buildPracticeQuestions(bank) }
})
