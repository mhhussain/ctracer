// functions/seedExamQuestions.mjs
// Local-run upsert of data/exam-question-bank.firestore.json into Firestore `exam_questions`.
// Requires a service-account JSON via GOOGLE_APPLICATION_CREDENTIALS for project iammoo-ctracer.
//   PowerShell:  $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\sa.json"; node seedExamQuestions.mjs
//   bash:        GOOGLE_APPLICATION_CREDENTIALS=/path/sa.json node seedExamQuestions.mjs
import { readFileSync } from 'node:fs'
import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const data = JSON.parse(readFileSync(new URL('../data/exam-question-bank.firestore.json', import.meta.url)))
initializeApp({ credential: applicationDefault(), projectId: 'iammoo-ctracer' })
const db = getFirestore()

const ids = Object.keys(data)
const batch = db.batch()
for (const id of ids) batch.set(db.collection('exam_questions').doc(id), data[id])
await batch.commit()
console.log(`Seeded ${ids.length} questions into exam_questions`)
process.exit(0)
