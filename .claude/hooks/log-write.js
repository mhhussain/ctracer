/**
 * Hook: PreToolUse — matcher: Write|Edit
 * Fires before every Write or Edit tool call.
 * Logs the file path being written to the session log.
 * Exit 0 = allow the write to proceed.
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
    const toolName = input.tool_name || '?';
    const filePath = input.tool_input?.file_path || '?';
    const timestamp = new Date().toISOString();

    const entry = `[${timestamp}] ${toolName.toUpperCase()}: ${filePath}\n`;
    fs.appendFileSync(logFile, entry);
  } catch (e) {
    // Non-blocking — don't fail the write
  }
  process.exit(0);
});
