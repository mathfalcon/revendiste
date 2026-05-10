import {execSync, spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {dirname, join} from 'node:path';

export type HiggsfieldSpawnResult = {
  code: number | null;
  stdout: string;
  stderr: string;
};

let resolvedExecutableCache: string | null = null;

/** `where` may list a no-extension shim that is not a real file — prefer `.cmd` / `.exe`. */
function pickWindowsHiggsfieldPath(whereOutput: string): string | null {
  const lines = whereOutput
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (/\.(cmd|exe|bat)$/i.test(line) && existsSync(line)) {
      return line;
    }
  }
  for (const line of lines) {
    if (existsSync(line)) {
      return line;
    }
    const withCmd = `${line}.cmd`;
    if (existsSync(withCmd)) {
      return withCmd;
    }
    const withExe = `${line}.exe`;
    if (existsSync(withExe)) {
      return withExe;
    }
  }
  return null;
}

/**
 * `spawn` cannot run `.cmd` without a shell (EINVAL). The npm shim delegates to
 * `node …/node_modules/@higgsfield/cli/bin/higgsfield.js` — mirror that.
 */
function windowsSpawnCommandAndArgs(
  resolvedPath: string,
  cliArgs: string[],
): {command: string; argv: string[]} {
  const lower = resolvedPath.toLowerCase();
  if (lower.endsWith('.js') && existsSync(resolvedPath)) {
    return {command: process.execPath, argv: [resolvedPath, ...cliArgs]};
  }
  if (
    process.platform === 'win32' &&
    (lower.endsWith('.cmd') || lower.endsWith('.bat'))
  ) {
    const js = join(
      dirname(resolvedPath),
      'node_modules',
      '@higgsfield',
      'cli',
      'bin',
      'higgsfield.js',
    );
    if (existsSync(js)) {
      return {command: process.execPath, argv: [js, ...cliArgs]};
    }
  }
  return {command: resolvedPath, argv: cliArgs};
}

/**
 * Executable for `spawn` without a shell — required on Windows so a long
 * `--prompt` stays a **single** argv (see shell-join bug → "Too many positional args").
 */
export function higgsfieldExecutable(): string {
  const fromEnv = process.env.HIGGSFIELD_CLI?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  if (resolvedExecutableCache) {
    return resolvedExecutableCache;
  }
  if (process.platform === 'win32') {
    try {
      const out = execSync('where higgsfield', {
        encoding: 'utf8',
        windowsHide: true,
      });
      const picked = pickWindowsHiggsfieldPath(out);
      if (picked) {
        resolvedExecutableCache = picked;
        return resolvedExecutableCache;
      }
    } catch {
      // fall through to bare name
    }
  }
  return 'higgsfield';
}

/** @deprecated Use `higgsfieldExecutable` — kept for any external imports. */
export function higgsfieldCommand(): string {
  return higgsfieldExecutable();
}

/**
 * Thin wrapper around the Higgsfield CLI (`higgsfield` on PATH by default, or
 * `HIGGSFIELD_CLI` to an absolute path). Requires a valid session.
 *
 * Never uses `shell: true` — long prompts must not be re-tokenized by cmd.exe.
 */
export function runHiggsfield(
  args: string[],
  options?: {cwd?: string},
): Promise<HiggsfieldSpawnResult> {
  return new Promise((resolve, reject) => {
    const resolved = higgsfieldExecutable();
    const {command, argv} = windowsSpawnCommandAndArgs(resolved, args);
    const child = spawn(command, argv, {
      cwd: options?.cwd,
      shell: false,
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', d => {
      stdout += String(d);
    });
    child.stderr?.on('data', d => {
      stderr += String(d);
    });
    child.on('error', reject);
    child.on('close', code => {
      resolve({code, stdout, stderr});
    });
  });
}

export async function higgsfieldGenerateCreate(
  model: string,
  prompt: string,
  extraArgs: string[] = [],
): Promise<HiggsfieldSpawnResult> {
  const args = ['generate', 'create', model, '--prompt', prompt, ...extraArgs];
  return runHiggsfield(args);
}
