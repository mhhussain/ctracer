// functions/index.js — Practice Exam callable functions.
import { initializeApp } from 'firebase-admin/app'
initializeApp()

export { startExam } from './startExam.js'
export { submitExam } from './submitExam.js'
export { getPracticeExam } from './getPracticeExam.js'
export { postToLeaderboard } from './postToLeaderboard.js'
