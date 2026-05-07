import {spawn} from 'node:child_process';

export type HiggsfieldSpawnResult = {
  code: number | null;
  stdout: string;
  stderr: string;
};

/**
 * Thin wrapper around the `higgsfield` CLI. Requires `higgsfield` on PATH and a valid session.
 */
export function runHiggsfield(
  args: string[],
  options?: {cwd?: string},
): Promise<HiggsfieldSpawnResult> {
  return new Promise((resolve, reject) => {
    const child = spawn('higgsfield', args, {
      cwd: options?.cwd,
      shell: process.platform === 'win32',
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
