/**
 * Hook: PreToolUse — matcher: Bash
 * Fires before every Bash tool call.
 * Logs the command being run to the session log.
 * Exit 0 = allow the command to proceed.
 */

const fs = require('fs');
const path = require('path');

const logFile = path.join('.claude', 'session.log');

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { raw += chunk; });
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(raw);
    const command = input.tool_input?.command || '?';
    const timestamp = new Date().toISOString();

    // Truncate long commands for log readability
    const display = command.length > 120 ? command.slice(0, 120) + '...' : command;
    const entry = `[${timestamp}] BASH: ${display}\n`;
    fs.appendFileSync(logFile, entry);
  } catch (e) {
    // Non-blocking
  }
  process.exit(0);
});
