import * as child_process from 'child_process';

const MAX_BUFFER = 10 * 1024 * 1024;

/**
 * Executes `command` and returns its value or undefined if the command failed.
 */
export function execOrUndefined(
  command: string,
  options: { cwd: string },
): string | undefined {
  try {
    const value = child_process
      .execSync(command, {
        stdio: ['inherit', 'pipe', 'pipe'], // "pipe" for STDERR means it appears in exceptions
        maxBuffer: MAX_BUFFER,
        cwd: options.cwd,
      })
      .toString('utf-8')
      .trim();

    if (!value) {
      return undefined;
    } // an empty string is the same as undefined
    return value;
  } catch {
    return undefined;
  }
}