// data/exportFirestore.mjs
// Emits a Firestore-import-ready map (docId -> fields) for collection exam_questions.
// Run: node data/exportFirestore.mjs
import { writeFileSync } from 'node:fs'
import { QUESTIONS } from './examQuestionBank.mjs'

const map = {}
for (const q of QUESTIONS) {
  const { id, ...fields } = q
  map[id] = fields
}
const out = new URL('./exam-question-bank.firestore.json', import.meta.url)
writeFileSync(out, JSON.stringify(map, null, 2) + '\n')
console.log(`Wrote ${Object.keys(map).length} docs to ${out.pathname}`)
