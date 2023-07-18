import * as fs from 'fs';
import * as path from 'path';
import { AwsCdkTypeScriptApp, AwsCdkTypeScriptAppOptions } from 'projen/lib/awscdk/awscdk-app-ts';
import { Component } from 'projen/lib/component';
import { execOrUndefined } from './util';

export interface HugoPipelineAwsCdkTypeScriptAppOptions
  extends AwsCdkTypeScriptAppOptions {

  /**
   * The domain name of the website.
   */
  readonly domain: string;

  /**
   * The subdomain of the website to use for the development environment.
   *
   * @default dev
   */
  readonly subDomain?: string;

  /**
   * The name of the Hugo theme to use. Will also be the folder the theme is stored in under 'blog/themes/${hugoThemeName}
   *
   * @default blist
   */
  readonly hugoThemeName?: string;

  /**
   * The URL of the Hugo theme Git repository.
   *
   * @default https://github.com/apvarun/blist-hugo-theme.git
   */
  readonly hugoThemeGitRepo?: string;

  /**
   * The branch of the Hugo theme Git repository to use.
   *
   * @default main
   */
  readonly hugoThemeGitRepoBranch?: string;

  /**
   * The command to run to start the Hugo development server for the specified theme.
   *
   * @default npm --prefix blog run start
   */
  readonly hugoThemeDevCommand?: string;
}

export class HugoPipelineAwsCdkTypeScriptApp extends AwsCdkTypeScriptApp {
  constructor(options: HugoPipelineAwsCdkTypeScriptAppOptions) {
    super(options);

    const domain = options.domain;
    const subDomain = options.subDomain ?? 'dev';
    const hugoThemeName = options.hugoThemeName ?? 'blist';
    const hugoThemeGitRepo = options.hugoThemeGitRepo ?? 'https://github.com/apvarun/blist-hugo-theme.git';
    const hugoThemeGitRepoBranch = options.hugoThemeGitRepoBranch ?? 'main';
    const hugoThemeDevCommand = options.hugoThemeDevCommand ?? 'npm --prefix blog run start';

    // checkout git repo
    execOrUndefined(`git submodule add ${hugoThemeGitRepo} blog/themes/${hugoThemeName}`, { cwd: this.outdir });
    // set branch
    execOrUndefined(`git submodule set-branch --branch ${hugoThemeGitRepoBranch} ${this.outdir}/blog/themes/${hugoThemeName}`, { cwd: this.outdir });

    // copy example site
    execOrUndefined(`cp -r blog/themes/${hugoThemeName}/exampleSite/*  blog/`, { cwd: this.outdir });

    // create config file structure
    execOrUndefined('mkdir -p blog/config/_default blog/config/development blog/config/production', { cwd: this.outdir });
    execOrUndefined('mv blog/config.toml blog/config/_default/config.toml', { cwd: this.outdir });
    fs.writeFileSync(path.join(this.outdir, 'blog/config/development', 'config.toml'), `baseurl = "https://${subDomain}.${domain}"\npublishDir = "public-development"`);
    fs.writeFileSync(path.join(this.outdir, 'blog/config/production', 'config.toml'), `baseurl = "https://${domain}"\npublishDir = "public-production"`);

    // gitignore
    this.gitignore.exclude(`blog/themes/${hugoThemeName}/public*`);
    this.gitignore.exclude(`blog/themes/${hugoThemeName}/resources/_gen`);
    this.gitignore.exclude(`blog/themes/${hugoThemeName}/.DS_Store`);
    this.gitignore.exclude(`blog/themes/${hugoThemeName}/.hugo_build.lock`);

    // copy optional package.jsons
    if (fs.existsSync(path.join(this.outdir, `blog/themes/${hugoThemeName}`, 'package.json'))) {
      execOrUndefined(`cp blog/themes/${hugoThemeName}/package.json blog/package.json`, { cwd: this.outdir });
    }
    if (fs.existsSync(path.join(this.outdir, `blog/themes/${hugoThemeName}`, 'package-lock.json'))) {
      execOrUndefined(`cp blog/themes/${hugoThemeName}/package-lock.json blog/package-lock.json`, { cwd: this.outdir });
    }

    // add conditional dev task to package.json
    this.package.setScript('dev', hugoThemeDevCommand);

    // add dependencies
    this.addDeps('@mavogel/cdk-hugo-pipeline');

    // write sample code to main.ts & to main.test.ts
    if (options.sampleCode ?? true) {
      new SampleCode(this, {
        domain: domain,
        subDomain: subDomain,
      });
    }
  }
}

interface SampleCodeOptions {
  domain: string;
  subDomain: string;
}

class SampleCode extends Component {
  private readonly appProject: AwsCdkTypeScriptApp;
  private readonly options: SampleCodeOptions;
  private readonly normalizedHugoBlogName: string;;

  constructor(
    project: AwsCdkTypeScriptApp,
    options: SampleCodeOptions,
  ) {
    super(project);
    this.appProject = project;
    this.options = options;
    this.normalizedHugoBlogName = options.domain.replace(/\./g, '-');
  }

  public synthesize() {
    const outdir = this.project.outdir;
    const srcdir = path.join(outdir, this.appProject.srcdir);
    if (
      fs.existsSync(srcdir) &&
      fs.readdirSync(srcdir).filter((x) => x.endsWith('.ts'))
    ) {
      return;
    }

    const srcImports = new Array<string>();
    srcImports.push("import { HugoPipeline } from '@mavogel/cdk-hugo-pipeline';");
    srcImports.push("import { App, Stack, StackProps } from 'aws-cdk-lib';");
    srcImports.push("import { Construct } from 'constructs';");

    const srcCode = `${srcImports.join('\n')}
  
  interface MyStackProps extends StackProps {
    domainName: string;
  }
  
  export class MyStack extends Stack {
    constructor(scope: Construct, id: string, props: MyStackProps) {
      super(scope, id, props);
  
      // define resources here...
      new HugoPipeline(this, '${this.normalizedHugoBlogName}', {
        name: '${this.normalizedHugoBlogName}',
        domainName: props.domainName,
        siteSubDomain: '${this.options.subDomain}',
        hugoProjectPath: '../../../../blog',
        hugoBuildCommand: 'hugo --gc --cleanDestinationDir --minify',
      });
    }
  }
  
  // for development, use account/region from cdk cli
  const devEnv = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  };
  
  const app = new App();
  
  // we only need 1 stack as it creates dev and prod in the pipeline
  new MyStack(app, '${this.project.name}-dev', { env: devEnv, domainName: '${this.options.domain}' });
  // new MyStack(app, '${this.project.name}-prod', { env: prodEnv });
  
  app.synth();`;

    fs.mkdirSync(srcdir, { recursive: true });
    fs.writeFileSync(path.join(srcdir, this.appProject.appEntrypoint), srcCode);

    const testdir = path.join(outdir, this.appProject.testdir);
    if (
      fs.existsSync(testdir) &&
      fs.readdirSync(testdir).filter((x) => x.endsWith('.ts'))
    ) {
      return;
    }

    const appEntrypointName = path.basename(
      this.appProject.appEntrypoint,
      '.ts',
    );
    const testCode = `
    test('Snapshot', () => {
      expect(true).toBe(true);
    });`;

    fs.mkdirSync(testdir, { recursive: true });
    fs.writeFileSync(
      path.join(testdir, `${appEntrypointName}.test.ts`),
      testCode,
    );
  }
}