// import { mkdirSync, writeFileSync } from 'fs';
// import { join } from 'path';
import { synthSnapshot } from 'projen/lib/util/synth';
import { mkdtemp } from './util';
import { HugoPipelineAwsCdkTypeScriptApp } from '../src';

describe('cdkVersion is >= 2.0.0', () => {
  test('empty context', () => {
    const project = new HugoPipelineAwsCdkTypeScriptApp({
      cdkVersion: '2.0.0-rc.1',
      defaultReleaseBranch: 'main',
      name: 'test',
      domain: 'example.com',
    });
    const snap = synthSnapshot(project);
    expect(snap['cdk.json'].context).toBeUndefined();
  });
});

describe('default configuration', () => {
  test('gitignores set', () => {
    const project = new HugoPipelineAwsCdkTypeScriptApp({
      cdkVersion: '2.0.0-rc.1',
      defaultReleaseBranch: 'main',
      name: 'test',
      domain: 'example.com',
    });
    const snap = synthSnapshot(project);
    expect(
      snap['.gitignore'].indexOf('blog/themes/blist/public*'),
    ).not.toEqual(-1);
    expect(
      snap['.gitignore'].indexOf('blog/themes/blist/resources/_gen'),
    ).not.toEqual(-1);
    expect(
      snap['.gitignore'].indexOf('blog/themes/blist/.DS_Store'),
    ).not.toEqual(-1);
    expect(
      snap['.gitignore'].indexOf('blog/themes/blist/.hugo_build.lock'),
    ).not.toEqual(-1);
  });

  test('main and main.test.ts files written', () => {
    // const outdir = mkdtemp({ cleanup: false, dir: `${process.cwd()}/test` });
    // mkdirSync(join(outdir, 'src'));
    // writeFileSync(join(outdir, 'src', 'my.lambda.ts'), '// dummy');

    const project = new HugoPipelineAwsCdkTypeScriptApp({
      cdkVersion: '2.0.0-rc.1',
      defaultReleaseBranch: 'main',
      name: 'test',
      domain: 'example.com',
      // outdir: outdir,
    });
    const snap = synthSnapshot(project);
    expect(snap['src/main.ts']).not.toBeUndefined();
    expect(snap['test/main.test.ts']).not.toBeUndefined();
  });

  test.skip('debug: main and main.test.ts files written', () => {
    const outdir = mkdtemp({ cleanup: false, dir: `${process.cwd()}/test` });
    // mkdirSync(join(outdir, 'src'));
    // writeFileSync(join(outdir, 'src', 'my.lambda.ts'), '// dummy');

    const project = new HugoPipelineAwsCdkTypeScriptApp({
      cdkVersion: '2.0.0-rc.1',
      defaultReleaseBranch: 'main',
      name: 'test',
      domain: 'example.com',
      outdir: outdir,
    });
    const snap = synthSnapshot(project);
    expect(snap['src/main.ts']).not.toBeUndefined();
    expect(snap['test/main.test.ts']).not.toBeUndefined();
  });
});