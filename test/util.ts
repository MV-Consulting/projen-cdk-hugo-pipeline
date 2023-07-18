import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const autoRemove = new Set<string>();

// Hook to automatically remove temporary directories without needing each
// place to actually handle this specifically.
afterAll((done) => {
  // Array.from used to get a copy, so we can safely remove from the set
  for (const dir of Array.from(autoRemove)) {
    try {
      fs.rmSync(dir, { force: true, recursive: true });
    } catch (e: any) {
      done.fail(e);
    }
    autoRemove.delete(dir);
  }
  done();
});

export function mkdtemp(opts: { cleanup?: boolean; dir?: string } = {}) {
  const tmpdir = fs.mkdtempSync(
    path.join(opts.dir ?? os.tmpdir(), 'hugo-pipe-test-'),
  );
  if (opts.cleanup ?? true) {
    autoRemove.add(tmpdir);
  }
  return tmpdir;
}