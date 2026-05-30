// data/examQuestionBank.mjs
// Canonical source for the ctracer Practice Exam question bank.
// SERVER-ONLY content: loaded into Firestore (collection: exam_questions) and
// delivered via Cloud Functions. NEVER imported by web/ (answer-key isolation).
// Design: docs/superpowers/specs/2026-05-30-exam-question-bank-design.md

export const BLUEPRINT = { d1: 16, d2: 12, d3: 12, d4: 11, d5: 9 }

export const TOPICS = {
  d1: ['Multi-agent patterns', 'Agentic loops', 'Session management', 'Tool orchestration', 'Parallelization workflows', 'Chaining workflows', 'Routing workflows', 'Fallback loop design', 'Cost optimization'],
  d2: ['CLAUDE.md hierarchies', 'Custom slash commands', 'Agent Skills', 'Hooks', 'MCP server integration', 'GitHub integration', 'Context management', 'Claude Code SDK', 'Subagents', 'Tool access restrictions', 'Configuration files'],
  d3: ['System prompts', 'XML tags', 'Few-shot examples', 'Chain-of-thought', 'JSON schema enforcement', 'Structured output', 'Validation retry loops', 'Hallucination prevention', 'Failure modes', 'Prompt evaluation', 'Temperature & sampling', 'Prompt caching'],
  d4: ['Tool use fundamentals', 'Multi-tool systems', 'MCP architecture', 'MCP server building', 'MCP primitives', 'MCP client implementation', 'Static vs templated resources', 'MCP Server Inspector', 'Web search tool', 'Tool-use error handling', 'Tool selection'],
  d5: ['Context window limits', 'Model selection', 'Prompt caching', 'RAG fundamentals', 'Context discipline', 'Streaming responses', 'Rate limits & errors', 'Extended thinking', 'Image and PDF support', 'Citations', 'Files API & Code Execution', 'Output evaluation'],
}

// Populated domain-by-domain. Shape: see spec §3.
export const QUESTIONS = [
]
