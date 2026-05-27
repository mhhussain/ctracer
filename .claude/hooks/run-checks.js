/**
 * Hook: PostToolUse — matcher: Write|Edit
 * Fires after every file write or edit.
 * If the file is TypeScript/JavaScript, runs typecheck and lint.
 * Prints errors to stdout so Claude Code sees them and self-corrects.
 *
 * Requirements: package.json must define scripts:
 *   "typecheck": "tsc --noEmit"
 *   "lint": "eslint src --ext .ts,.tsx --max-warnings 0"
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const logFile = path.join('.claude', 'session.log');

const CODE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

function hasScript(scriptName) {
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return !!pkg.scripts?.[scriptName];
  } catch {
    return false;
  }
}

function runScript(scriptName) {
  const result = spawnSync('npm', ['run', scriptName, '--silent'], {
    encoding: 'utf8',
    shell: true,
    timeout: 30000,
  });
  return {
    success: result.status === 0,
    output: (result.stdout || '') + (result.stderr || ''),
  };
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { raw += chunk; });
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(raw);
    const filePath = input.tool_input?.file_path || '';
    const ext = path.extname(filePath).toLowerCase();
    const timestamp = new Date().toISOString();

    // Only run checks on code files
    if (!CODE_EXTENSIONS.includes(ext)) {
      process.exit(0);
      return;
    }

    let issues = [];

    // Run typecheck if script exists
    if (hasScript('typecheck')) {
      const tc = runScript('typecheck');
      if (!tc.success) {
        issues.push('--- TYPECHECK ERRORS ---');
        // Show only first 20 lines to keep output manageable
        const lines = tc.output.trim().split('\n').slice(0, 20);
        issues.push(...lines);
        if (tc.output.trim().split('\n').length > 20) {
          issues.push('... (truncated — run npm run typecheck for full output)');
        }
        fs.appendFileSync(logFile, `[${timestamp}] TYPECHECK FAILED: ${filePath}\n`);
      }
    }

    // Run lint if script exists and typecheck passed (no point linting broken types)
    if (issues.length === 0 && hasScript('lint')) {
      const lint = runScript('lint');
      if (!lint.success) {
        issues.push('--- LINT ERRORS ---');
        const lines = lint.output.trim().split('\n').slice(0, 20);
        issues.push(...lines);
        fs.appendFileSync(logFile, `[${timestamp}] LINT FAILED: ${filePath}\n`);
      }
    }

    if (issues.length > 0) {
      // Print to stdout — Claude Code will see this and self-correct
      console.log('\n⚠️  Checks failed after writing ' + path.basename(filePath) + ':');
      console.log(issues.join('\n'));
      console.log('\nPlease fix these issues before moving on.\n');
    } else {
      fs.appendFileSync(logFile, `[${timestamp}] CHECKS PASSED: ${filePath}\n`);
    }

  } catch (e) {
    // Non-blocking — don't fail the session over a hook error
  }
  process.exit(0);
});
