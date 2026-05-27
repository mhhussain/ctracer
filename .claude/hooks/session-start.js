/**
 * Hook: SessionStart
 * Fires when a Claude Code session begins.
 * Creates the .claude directory and log file if needed.
 * Writes a session-start marker.
 */

const fs = require('fs');
const path = require('path');

const logDir = '.claude';
const logFile = path.join(logDir, 'session.log');

// Ensure .claude directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const timestamp = new Date().toISOString();
const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

const entry = [
  '',
  '='.repeat(60),
  `SESSION STARTED`,
  `Time:    ${timestamp}`,
  `Project: ${projectDir}`,
  '='.repeat(60),
  '',
].join('\n');

fs.appendFileSync(logFile, entry);
