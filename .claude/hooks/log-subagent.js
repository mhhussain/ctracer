/**
 * Hook: SubagentStart / SubagentStop
 * Called as: node log-subagent.js start  OR  node log-subagent.js stop
 * Logs subagent lifecycle events to session.log.
 * Useful for understanding how multi-agent sessions are structured.
 */

const fs = require('fs');
const path = require('path');

const logFile = path.join('.claude', 'session.log');
const event = process.argv[2] || 'unknown'; // 'start' or 'stop'

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { raw += chunk; });
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(raw);
    const agentId = input.agent_id || '?';
    const agentType = input.agent_type || '?';
    const timestamp = new Date().toISOString();

    const label = event === 'start' ? 'SUBAGENT STARTED' : 'SUBAGENT STOPPED';
    const entry = `[${timestamp}] ${label}: type=${agentType} id=${agentId}\n`;
    fs.appendFileSync(logFile, entry);

    // On start: remind about task scope
    if (event === 'start') {
      console.log(`\n📋 Subagent started (${agentType}). Check /docs/tasks/ for the active task spec.\n`);
    }
  } catch (e) {
    // Non-blocking
  }
  process.exit(0);
});
