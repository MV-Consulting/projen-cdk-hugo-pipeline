import * as fs from 'fs';
import * as path from 'path';
import { AwsCdkTypeScriptApp, AwsCdkTypeScriptAppOptions } from 'projen/lib/awscdk/awscdk-app-ts';
import { Component } from 'projen/lib/component';
import { TextFile } from 'projen/lib/textfile';
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

/**
 * External projen module to create a Hugo pipeline with AWS CDK
 * from '@mavogel/cdk-hugo-pipeline'.
 *
 * @pjid cdk-hugo-pipeline
 */
export class HugoPipelineAwsCdkTypeScriptApp extends AwsCdkTypeScriptApp {
  constructor(options: HugoPipelineAwsCdkTypeScriptAppOptions) {
    super(options);

    const domain = options.domain;
    const subDomain = options.subDomain || 'dev';
    const hugoThemeName = options.hugoThemeName || 'blist';
    // const hugoThemeGitRepo = options.hugoThemeGitRepo || 'https://github.com/apvarun/blist-hugo-theme.git';
    // const hugoThemeGitRepoBranch = options.hugoThemeGitRepoBranch || 'main';
    const hugoThemeDevCommand = options.hugoThemeDevCommand || 'npm --prefix blog run start';


    // let ret = execOrUndefined(`echo "${hugoThemeGitRepo}"`, { cwd: this.outdir });
    // if (ret === undefined) {
    //   throw new Error('Could not echooo');
    // }

    // if (!isGitRepository(this.outdir)) {
    //   ret = execOrUndefined('git init', { cwd: this.outdir });
    //   if (ret === undefined) {
    //     throw new Error('Could not "git init"');
    //   }
    // }

    // // Note: as of now not possible with git lib such as 'https://github.com/isomorphic-git/isomorphic-git'
    // // checkout git repo
    // ret = execOrUndefined(`git submodule add ${hugoThemeGitRepo} blog/themes/${hugoThemeName}`, { cwd: this.outdir });
    // if (ret === undefined) {
    //   throw new Error(`Could not add git submodule ${hugoThemeGitRepo} to ${this.outdir}`);
    // }
    // // set branch
    // ret = execOrUndefined(`git submodule set-branch --branch ${hugoThemeGitRepoBranch} ${this.outdir}/blog/themes/${hugoThemeName}`, { cwd: this.outdir });
    // if (ret === undefined) {
    //   throw new Error(`Could not set branch ${hugoThemeGitRepoBranch} for git submodule ${hugoThemeGitRepo} in ${this.outdir}`);
    // }

    // // copy example site
    // ret = execOrUndefined(`cp -r blog/themes/${hugoThemeName}/exampleSite/*  blog/`, { cwd: this.outdir });
    // if (ret === undefined) {
    //   throw new Error(`Could not copy example site from ${this.outdir}/blog/themes/${hugoThemeName}/exampleSite to ${this.outdir}/blog`);
    // }

    // create config file structure
    execOrUndefined('mkdir -p blog/config/_default blog/config/development blog/config/production', { cwd: this.outdir });

    // ret = execOrUndefined('mv blog/config.toml blog/config/_default/config.toml', { cwd: this.outdir });
    // if (ret === undefined) {
    //   throw new Error(`Could not move config.toml to ${this.outdir}/blog/config/_default/config.toml`);
    // }

    // fs.writeFileSync(path.join(this.outdir, 'blog/config/development', 'config.toml'), `baseurl = "https://${subDomain}.${domain}"\npublishDir = "public-development"`);
    // fs.writeFileSync(path.join(this.outdir, 'blog/config/production', 'config.toml'), `baseurl = "https://${domain}"\npublishDir = "public-production"`);
    new TextFile(this, 'blog/config/development/config.toml', {
      lines: [
        `baseurl = "https://${subDomain}.${domain}"`,
        'publishDir = "public-development"',
      ],
    });

    new TextFile(this, 'blog/config/production/config.toml', {
      lines: [
        `baseurl = "https://${domain}"`,
        'publishDir = "public-production"',
      ],
    });

    // gitignore
    const filesPatternToGitignore = [
      `blog/themes/${hugoThemeName}/public*`,
      `blog/themes/${hugoThemeName}/resources/_gen`,
      `blog/themes/${hugoThemeName}/.DS_Store`,
      `blog/themes/${hugoThemeName}/.hugo_build.lock`,
    ];
    for (const file of filesPatternToGitignore) {
      this.gitignore.exclude(file);
    }

    const filesToCopyFromThemeDir = [
      'package.json',
      'package-lock.json',
    ];
    for (const file of filesToCopyFromThemeDir) {
      // if target file does not exist yet
      if (!fs.existsSync(path.join(this.outdir, file))) {
        // and source file exists, then copy it
        if (fs.existsSync(path.join(this.outdir, `blog/themes/${hugoThemeName}`, 'package.json'))) {
          execOrUndefined(`cp blog/themes/${hugoThemeName}/package.json blog/${file}`, { cwd: this.outdir });
        }
      }
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
    // TODO
    // if (
    //   fs.existsSync(srcdir) &&
    //   fs.readdirSync(srcdir).filter((x) => x.endsWith('main.ts'))
    // ) {
    //   return;
    // }

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
        hugoBuildCommand: 'npm --prefix blog run start',
        // or use the following if you want to use the Hugo CLI directly
        // hugoBuildCommand: 'hugo --gc --cleanDestinationDir --minify',
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