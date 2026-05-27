#!/usr/bin/env node
const readline = require('readline')

const PATTERNS = [
  { regex: /AIzaSy[A-Za-z0-9_-]{33}/, label: 'Firebase/Google API key' },
  { regex: /\d{1}:\d{12}:web:[a-f0-9]{16}/, label: 'Firebase App ID' },
  { regex: /AAAA[A-Za-z0-9_-]{7}:[A-Za-z0-9_-]{140}/, label: 'FCM server key' },
  { regex: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/, label: 'Private key' },
]

let raw = ''
const rl = readline.createInterface({ input: process.stdin })
rl.on('line', (line) => { raw += line })
rl.on('close', () => {
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
        console.error(`BLOCKED: ${label} detected in write to ${filePath}`)
        console.error('Use a placeholder in docs or an env var reference in code.')
        process.exit(1)
      }
    }
  } catch {
    // Don't block on script errors
  }
  process.exit(0)
})
