/**
 * Hook: PreCompact
 * Fires before Claude Code compacts the conversation context.
 * Prints a reminder to review the current task spec and any open decisions.
 * This is a critical moment — compaction means context is being summarized,
 * so anything not written down may be lost.
 */

const fs = require('fs');
const path = require('path');

const logFile = path.join('.claude', 'session.log');
const timestamp = new Date().toISOString();

// Log that compaction is happening
try {
  fs.appendFileSync(logFile, `[${timestamp}] CONTEXT COMPACTION TRIGGERED\n`);
} catch (e) {
  // Non-blocking
}

// Print visible reminder
console.log(`
╔══════════════════════════════════════════════════════════╗
║              ⚠️  CONTEXT COMPACTION OCCURRING             ║
╠══════════════════════════════════════════════════════════╣
║  Before continuing:                                      ║
║  1. Check /docs/tasks/ — is the current task spec clear? ║
║  2. Any uncommitted decisions should be written down now ║
║  3. Review /docs/adr/ — are all decisions recorded?      ║
║  4. Check .claude/session.log for recent activity        ║
╚══════════════════════════════════════════════════════════╝
`);

process.exit(0);
