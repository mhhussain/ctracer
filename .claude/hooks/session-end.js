/**
 * Hook: Stop
 * Fires when the Claude Code session ends (user types /stop or session closes).
 * Writes a session summary to session.log.
 * Counts writes, bash commands, subagents, and check failures in this session.
 */

const fs = require('fs');
const path = require('path');

const logFile = path.join('.claude', 'session.log');
const timestamp = new Date().toISOString();

// Count activity in this session by parsing the log
// (Very simple — counts lines since last SESSION STARTED)
function getSessionStats() {
  try {
    const content = fs.readFileSync(logFile, 'utf8');
    const lines = content.split('\n');

    // Find last session start
    let sessionStartIdx = 0;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].includes('SESSION STARTED')) {
        sessionStartIdx = i;
        break;
      }
    }

    const sessionLines = lines.slice(sessionStartIdx);
    const writes = sessionLines.filter(l => l.includes('] WRITE:') || l.includes('] EDIT:')).length;
    const bashes = sessionLines.filter(l => l.includes('] BASH:')).length;
    const failures = sessionLines.filter(l => l.includes('FAILED')).length;
    const subagents = sessionLines.filter(l => l.includes('SUBAGENT STARTED')).length;
    const compactions = sessionLines.filter(l => l.includes('CONTEXT COMPACTION')).length;

    return { writes, bashes, failures, subagents, compactions };
  } catch {
    return null;
  }
}

const stats = getSessionStats();

const summary = [
  '',
  '-'.repeat(60),
  `SESSION ENDED: ${timestamp}`,
  stats ? [
    `  Files written/edited:  ${stats.writes}`,
    `  Bash commands run:     ${stats.bashes}`,
    `  Check failures:        ${stats.failures}`,
    `  Subagents spawned:     ${stats.subagents}`,
    `  Context compactions:   ${stats.compactions}`,
  ].join('\n') : '',
  '-'.repeat(60),
  '',
].join('\n');

try {
  fs.appendFileSync(logFile, summary);
} catch (e) {
  // Non-blocking
}

// Print to terminal for visibility
if (stats) {
  console.log(`\n📝 Session summary logged to .claude/session.log`);
  console.log(`   ${stats.writes} file writes | ${stats.bashes} bash commands | ${stats.failures} check failures`);
  if (stats.failures > 0) {
    console.log(`   ⚠️  ${stats.failures} check failure(s) this session — review before next session`);
  }
}

process.exit(0);
