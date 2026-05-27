# Secret Scanning Hook Setup

Preventing credentials from being committed to git. Two layers are recommended: a git pre-commit hook (catches it before commit) and a Claude Code hook (catches it during AI-assisted edits).

---

## Option A: Git Pre-Commit Hook (Recommended)

A shell script that runs automatically before every `git commit` and blocks the commit if it finds suspicious values in staged files.

### Setup

```bash
# Create the hook file
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Patterns that should never appear in committed files
PATTERNS=(
  'AIzaSy[A-Za-z0-9_-]{33}'         # Firebase/Google API keys
  '[0-9]{1}:[0-9]{12}:web:[a-f0-9]{16}'  # Firebase App IDs
  'AAAA[A-Za-z0-9_-]{7}:[A-Za-z0-9_-]{140}'  # FCM server keys
)

STAGED=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$STAGED" ]; then
  exit 0
fi

FOUND=0
for pattern in "${PATTERNS[@]}"; do
  MATCHES=$(echo "$STAGED" | xargs grep -lP "$pattern" 2>/dev/null)
  if [ -n "$MATCHES" ]; then
    echo ""
    echo "🚫 SECRET SCAN FAILED"
    echo "Pattern '$pattern' found in:"
    echo "$MATCHES" | sed 's/^/  /'
    FOUND=1
  fi
done

if [ "$FOUND" -eq 1 ]; then
  echo ""
  echo "Remove the secret before committing. Use placeholders in docs"
  echo "and environment variables in code."
  echo ""
  exit 1
fi

exit 0
EOF

# Make it executable
chmod +x .git/hooks/pre-commit
```

### Testing the hook

```bash
# Create a test file with a fake Firebase API key
echo 'VITE_FIREBASE_API_KEY=AIzaSyCFHA_Goxe_5f9KmsUDuL6UYAOybkgf04k' > /tmp/test-secret.txt
git add /tmp/test-secret.txt
git commit -m "test"
# Expected: commit blocked with "SECRET SCAN FAILED"

# Clean up
git reset HEAD /tmp/test-secret.txt
rm /tmp/test-secret.txt
```

### Limitations

- Only applies to your local machine. Other contributors need to set it up separately.
- Lives in `.git/hooks/` which is not committed — you need to re-apply after a fresh clone.
- To share it with the team, copy the script to `.githooks/pre-commit`, commit it, and add this to the repo setup instructions:
  ```bash
  git config core.hooksPath .githooks
  ```

---

## Option B: Gitleaks (Broader Coverage)

[Gitleaks](https://github.com/gitleaks/gitleaks) is a purpose-built secret scanner with a large built-in ruleset covering 150+ credential types. More thorough than a custom grep pattern.

### Setup

```bash
# Install via Homebrew
brew install gitleaks

# Run a scan of the full repo history
gitleaks detect --source=. --verbose

# Add as a pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
gitleaks protect --staged --verbose
EOF
chmod +x .git/hooks/pre-commit
```

### GitHub Actions integration (scans every push)

Create `.github/workflows/secret-scan.yml`:

```yaml
name: Secret Scan

on: [push, pull_request]

jobs:
  gitleaks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

This catches secrets pushed by anyone on the team, including in PR branches.

---

## Option C: Claude Code Pre-Tool-Use Hook

A Claude Code hook that runs before every file write or edit and blocks the operation if it detects secret patterns. This catches secrets during AI-assisted development, before they even reach a commit.

### How Claude Code hooks work

Claude Code hooks are shell commands defined in `.claude/settings.json` (project-level) or `~/.claude/settings.json` (global). They run at specific lifecycle events:
- `PreToolUse` — before a tool runs (can block it by exiting non-zero)
- `PostToolUse` — after a tool runs

### Setup

**Important:** To hard-block a PreToolUse tool call, the hook must output a JSON object with `permissionDecision: "deny"` to stdout and **exit 0**. Exiting non-zero is treated as a hook error and does not block the tool.

1. Create `.claude/hooks/check-secrets.js`:

```js
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
        // To hard-block a PreToolUse hook, output permissionDecision:"deny" JSON
        // and exit 0. Exiting non-zero does NOT block — it is treated as a hook error.
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
  } catch {
    // Don't block on script errors
  }
  process.exit(0)
})
```

2. Add this to `.claude/settings.json` (create if it doesn't exist):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/check-secrets.js"
          }
        ]
      }
    ]
  }
}
```

### Testing the hook

In a Claude Code session, ask Claude to write a file containing `AIzaSyCFHA_Goxe_5f9KmsUDuL6UYAOybkgf04k`. The Write tool call should be blocked with the error message before the file is written.

---

## Recommended Setup for This Project

1. **Option A (git hook)** — set up immediately, covers all commits regardless of how they're made
2. **Option C (Claude Code hook)** — add if most of your commits come through Claude Code sessions

Option B (Gitleaks GitHub Action) is a good safety net but requires more setup and only catches things after they've been pushed.

---

## Recovering from a Leaked Secret

If a secret is already in git history:

1. **Rotate the credential immediately** — assume it's compromised
2. Remove from history using `git filter-repo` (preferred over BFG):
   ```bash
   brew install git-filter-repo
   git filter-repo --string-replace 'AIzaSyCFHA_Goxe_5f9KmsUDuL6UYAOybkgf04k=<redacted>'
   git push --force-with-lease
   ```
3. Ask collaborators to re-clone — their local copies still have the old history

For the Firebase API key specifically: even after rotating, restrict the new key to your production domains in GCP Console → APIs & Services → Credentials to limit blast radius of any future leak.
