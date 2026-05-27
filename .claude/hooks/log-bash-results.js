/**
 * Hook: PostToolUse — matcher: Bash
 * Fires after every Bash tool call completes.
 * Logs whether the command succeeded or failed.
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
    const exitCode = input.tool_response?.exit_code;
    const timestamp = new Date().toISOString();
    const status = exitCode === 0 ? 'OK' : `FAILED (exit ${exitCode})`;

    // Only log failures — keep the log clean
    if (exitCode !== 0) {
      const display = command.length > 80 ? command.slice(0, 80) + '...' : command;
      const entry = `[${timestamp}] BASH ${status}: ${display}\n`;
      fs.appendFileSync(logFile, entry);
    }
  } catch (e) {
    // Non-blocking
  }
  process.exit(0);
});
