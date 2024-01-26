import { synthSnapshot } from 'projen/lib/util/synth';
import { HugoPipelineAwsCdkTypeScriptApp } from '../src';

describe('cdkVersion is >= 2.0.0', () => {
  test('empty context', () => {
    const project = new HugoPipelineAwsCdkTypeScriptApp({
      cdkVersion: '2.0.0-rc.1',
      defaultReleaseBranch: 'main',
      name: 'test',
      domain: 'example.com',
    });
    const snap = synthSnapshot(project, { parseJson: false });
    expect(snap['cdk.json'].context).toBeUndefined();
  });
});

describe('configurations', () => {
  test('default all files are written', () => {
    const domain = 'example.com';
    const subDomain = 'my-sub';
    const defaultHugoThemeDevCommand = 'npm --prefix blog run start';
    const project = new HugoPipelineAwsCdkTypeScriptApp({
      cdkVersion: '2.0.0-rc.1',
      defaultReleaseBranch: 'main',
      name: 'test',
      domain: domain,
      subDomain: subDomain,
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
    expect(snap['blog/config/_default/config.toml']).not.toBeUndefined();
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
    expect(
      snap['package.json'].indexOf(`"dev": "${defaultHugoThemeDevCommand}"`),
    ).not.toEqual(-1);
    expect(
      snap['package.json'].indexOf('"build-dev": "cd blog && hugo --gc --minify --cleanDestinationDir --environment development"'),
    ).not.toEqual(-1);
    expect(
      snap['package.json'].indexOf('"build": "cd blog && hugo --gc --minify --cleanDestinationDir --environment production"'),
    ).not.toEqual(-1);
  });

  test('awsug all files are written', () => {
    const domain = 'example.com';
    const subDomain = 'my-sub';
    const hugoThemeDevCommand = 'cd blog && hugo server --watch --buildFuture --cleanDestinationDir --disableFastRender';
    const project = new HugoPipelineAwsCdkTypeScriptApp({
      cdkVersion: '2.0.0-rc.1',
      defaultReleaseBranch: 'main',
      name: 'test',
      domain: domain,
      subDomain: subDomain,
      hugoThemeGitRepo: 'https://github.com/kkeles/awsug-hugo.git',
      hugoThemeGitRepoBranch: '45d0f4605802d311db4a9f1288ffa8ea9f1cf689',
      hugoThemeSubmoduleStructure: 'blog',
      hugoThemeConfigFile: 'hugo.toml',
      hugoThemeDevCommand: hugoThemeDevCommand,
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
      snap['.gitmodules'].indexOf('[submodule "blog"]'),
    ).not.toEqual(-1);
    expect(
      snap['.gitignore'].indexOf('blog/public*'),
    ).not.toEqual(-1);
    expect(
      snap['.gitignore'].indexOf('blog/resources/_gen'),
    ).not.toEqual(-1);
    expect(
      snap['.gitignore'].indexOf('blog/.DS_Store'),
    ).not.toEqual(-1);
    expect(
      snap['.gitignore'].indexOf('blog/.hugo_build.lock'),
    ).not.toEqual(-1);
    expect(snap['blog/config/_default/config.toml']).not.toBeUndefined();
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
    expect(
      snap['package.json'].indexOf(`"dev": "${hugoThemeDevCommand}"`),
    ).not.toEqual(-1);
    expect(
      snap['package.json'].indexOf('"build-dev": "cd blog && hugo --gc --minify --cleanDestinationDir --environment development"'),
    ).not.toEqual(-1);
    expect(
      snap['package.json'].indexOf('"build": "cd blog && hugo --gc --minify --cleanDestinationDir --environment production"'),
    ).not.toEqual(-1);
  });
});