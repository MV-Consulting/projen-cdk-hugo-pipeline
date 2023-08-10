import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const MAX_BUFFER = 10 * 1024 * 1024;

/**
 * Executes `command` and returns its value or undefined if the command failed.
 */
export function execOrUndefined(
  command: string,
  options: { cwd: string; ignoreEmptyReturnCode?: boolean },
): string | undefined {
  console.log(`execOrUndefined for command\n"${command}"`);
  try {
    const value = child_process
      .execSync(command, {
        stdio: ['inherit', 'pipe', 'pipe'], // "pipe" for STDERR means it appears in exceptions
        maxBuffer: MAX_BUFFER,
        cwd: options.cwd,
        timeout: 1000 * 60 * 1, // 1 minute
        shell: '/bin/bash',
      })
      .toString('utf-8')
      .trim();

    if (!value) {
      if (options.ignoreEmptyReturnCode) {
        return 'ignored';
      }
      console.error(`Error empty executing "${command}"`);
      return undefined;
    } // an empty string is the same as undefined
    return value;
  } catch (e: any) {
    console.error(`Error catch executing "${command}": ${e.message}`);
    return undefined;
  }
}

/**
 * Check if the given directory is a git repository.
 *
 * @param dir the directory to check
 * @returns true if the directory is a git repository, false otherwise
 */
export function isGitRepository(dir: string): boolean {
  const gitDir = path.join(dir, '.git');
  return fs.existsSync(gitDir);
}