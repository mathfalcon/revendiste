#!/usr/bin/env node
/**
 * PreToolUse guard: blocks edits to sensitive paths (same rules as protect-files.sh).
 * Node avoids spawning Git Bash on Windows, which was stealing focus from fullscreen apps.
 */
import { readFileSync } from 'node:fs';

const protectedPatterns = ['.env*', '*.pem', '*.key', 'secrets/*'];

function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function globToRegex(pattern) {
  const escaped = pattern.replaceAll('*', '.*');
  return new RegExp(`^${escaped}$`, 'i');
}

const raw = readStdin();
let data = {};
try {
  data = raw ? JSON.parse(raw) : {};
} catch {
  process.exit(0);
}

const file = String(
  data?.tool_input?.file_path ?? data?.tool_input?.path ?? '',
).replaceAll('\\', '/');

for (const pattern of protectedPatterns) {
  if (globToRegex(pattern).test(file)) {
    console.error(
      `Blocked: '${file}' is protected. Explain why this edit is necessary.`,
    );
    process.exit(2);
  }
}

process.exit(0);
