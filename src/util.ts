import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const MAX_BUFFER = 10 * 1024 * 1024;

/**
 * Executes `command` and returns its value or undefined if the command failed.
 */
export function execOrUndefined(
  command: string,
  options: { cwd: string; ignoreEmptyReturnCode?: boolean; debug?: boolean },
): string | undefined {
  if (options.debug !== undefined && options.debug) {
    console.log(`execOrUndefined for command\n"${command}"`);
  }
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

/**
 * Checks if the given file exists.
 *
 * @param filePath path to the file
 * @returns true if the file exists, false otherwise
 */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * Checks if the given line exists in the given file.
 *
 * @param filePath path to the file
 * @param line line to check
 * @returns true if the line exists in the file, false otherwise
 */
export function lineExistsInFile(filePath: string, line: string): boolean {
  if (!fileExists(filePath)) {
    return false;
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  return fileContent.indexOf(line) >= 0;
}