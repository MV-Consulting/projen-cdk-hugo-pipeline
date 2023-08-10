// import { mkdirSync, writeFileSync } from 'fs';
// import { join } from 'path';
import { synthSnapshot } from 'projen/lib/util/synth';
import { mkdtemp } from './util';
import { HugoPipelineAwsCdkTypeScriptApp } from '../src';
import { execOrUndefined } from '../src/util';

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
  test.only('main and main.test.ts files written', () => {
    // const outdir = mkdtemp({ cleanup: false, dir: `${process.cwd()}/test` });
    // mkdirSync(join(outdir, 'src'));
    // writeFileSync(join(outdir, 'src', 'my.lambda.ts'), '// dummy');

    const domain = 'example.com';
    const subDomain = 'my-sub';
    const project = new HugoPipelineAwsCdkTypeScriptApp({
      cdkVersion: '2.0.0-rc.1',
      defaultReleaseBranch: 'main',
      name: 'test',
      domain: domain,
      subDomain: subDomain,
      // outdir: outdir,
    });
    const snap = synthSnapshot(project, { parseJson: false });
    expect(snap['src/main.ts']).not.toBeUndefined();
    expect(
      snap['src/main.ts'].indexOf('@mavogel/cdk-hugo-pipeline'),
    ).not.toEqual(-1);
    expect(snap['test/main.test.ts']).not.toBeUndefined();
    expect(
      snap['test/main.test.ts'].indexOf('expect(true).toBe(true);'),
    ).not.toEqual(-1);
    expect(snap['.gitmodules']).not.toBeUndefined();
    expect(
      snap['.gitmodules'].indexOf('[submodule "blog/themes/blist"]'),
    ).not.toEqual(-1);
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
    // expect(snap['blog/config/_default/config.toml']).not.toBeUndefined();
    expect(snap['blog/config/development/config.toml']).not.toBeUndefined();
    expect(
      snap['blog/config/development/config.toml'].indexOf(`baseurl = "https://${subDomain}.${domain}"`),
    ).not.toEqual(-1);
    expect(
      snap['blog/config/development/config.toml'].indexOf('publishDir = "public-development"'),
    ).not.toEqual(-1);
    expect(snap['blog/config/production/config.toml']).not.toBeUndefined();
    expect(
      snap['blog/config/production/config.toml'].indexOf(`baseurl = "https://${domain}"`),
    ).not.toEqual(-1);
    expect(
      snap['blog/config/production/config.toml'].indexOf('publishDir = "public-production"'),
    ).not.toEqual(-1);
  });

  test.skip('debug: main and main.test.ts files written', () => {
    const outdir = mkdtemp({ cleanup: false, dir: '/tmp/hugo-test' });
    // mkdirSync(join(outdir, 'src'));
    // writeFileSync(join(outdir, 'src', 'my.lambda.ts'), '// dummy');
    console.log(`outdir: ${outdir}`);
    let ret = execOrUndefined('git init', { cwd: outdir });
    console.log(`git init: ${ret}`);

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