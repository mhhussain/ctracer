// web/src/lib/examFunctions.js
import { httpsCallable } from 'firebase/functions'
import { functions } from './firebase'

export const startExamFn = httpsCallable(functions, 'startExam')
export const submitExamFn = httpsCallable(functions, 'submitExam')
export const postToLeaderboardFn = httpsCallable(functions, 'postToLeaderboard')
export const getPracticeExamFn = httpsCallable(functions, 'getPracticeExam')
