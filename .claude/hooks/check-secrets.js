#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const PATTERNS = [
  { regex: /AIzaSy[A-Za-z0-9_-]{33}/, label: 'Firebase/Google API key' },
  { regex: /\d{1}:\d{12}:web:[a-f0-9]{16}/, label: 'Firebase App ID' },
  { regex: /AAAA[A-Za-z0-9_-]{7}:[A-Za-z0-9_-]{140}/, label: 'FCM server key' },
  { regex: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/, label: 'Private key' },
]

const logFile = path.join('.claude', 'session.log')

let raw = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', (chunk) => { raw += chunk })
process.stdin.on('end', () => {
  const timestamp = new Date().toISOString()

  try {
    const data = JSON.parse(raw)
    const input = data.tool_input || {}
    const content = input.new_string || input.content || ''
    const filePath = input.file_path || ''

    // Skip .env.local — it's gitignored and is supposed to hold these values
    if (filePath.endsWith('.env.local') || filePath.endsWith('.env')) {
      process.exit(0)
    }

    for (const { regex, label } of PATTERNS) {
      if (regex.test(content)) {
        fs.appendFileSync(logFile, `[${timestamp}] CHECK-SECRETS: BLOCKED ${label} in ${filePath}\n`)
        // Must output JSON with permissionDecision:"deny" and exit 0 to hard-block
        console.log(JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: 'deny',
            permissionDecisionReason: `${label} detected in ${path.basename(filePath)}. Use a placeholder in docs or an env var reference in code.`,
          },
        }))
        process.exit(0)
      }
    }

    fs.appendFileSync(logFile, `[${timestamp}] CHECK-SECRETS: clean — ${filePath}\n`)
  } catch (e) {
    fs.appendFileSync(logFile, `[${timestamp}] CHECK-SECRETS: error — ${e.message}\n`)
  }
  process.exit(0)
})
