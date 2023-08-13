import * as fs from 'fs';
import * as path from 'path';
import { AwsCdkTypeScriptApp, AwsCdkTypeScriptAppOptions } from 'projen/lib/awscdk/awscdk-app-ts';
import { Component } from 'projen/lib/component';
import { TextFile } from 'projen/lib/textfile';
import { execOrUndefined, isGitRepository } from './util';

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
  private isAlreadyGitRepo: boolean;

  constructor(options: HugoPipelineAwsCdkTypeScriptAppOptions) {
    super(options);

    this.isAlreadyGitRepo = false;
    const domain = options.domain;
    const subDomain = options.subDomain || 'dev';
    const hugoThemeName = options.hugoThemeName || 'blist';
    const hugoThemeGitRepo = options.hugoThemeGitRepo || 'https://github.com/apvarun/blist-hugo-theme.git';
    const hugoThemeGitRepoBranch = options.hugoThemeGitRepoBranch || 'v2.1.0';
    const hugoThemeDevCommand = options.hugoThemeDevCommand || 'npm --prefix blog run start';


    let ret = undefined;
    this.isAlreadyGitRepo = isGitRepository(this.outdir);
    if (!this.isAlreadyGitRepo) {
      ret = execOrUndefined('git init', { cwd: this.outdir });
      if (ret === undefined) {
        throw new Error('Could not "git init"');
      }
      this.isAlreadyGitRepo = true;
    }

    // Note: as of now not possible with git lib such as 'https://github.com/isomorphic-git/isomorphic-git'
    // checkout theme git repo
    // TODO add check if already checked out
    ret = execOrUndefined(`git submodule add ${hugoThemeGitRepo} blog/themes/${hugoThemeName}`, { cwd: this.outdir, ignoreEmptyReturnCode: true });
    if (ret === undefined) {
      throw new Error(`Could not add git submodule ${hugoThemeGitRepo} to ${this.outdir}`);
    }
    // // set branch
    ret = execOrUndefined(`git submodule set-branch --branch ${hugoThemeGitRepoBranch} blog/themes/${hugoThemeName}`, { cwd: this.outdir, ignoreEmptyReturnCode: true });
    if (ret === undefined) {
      throw new Error(`Could not set branch ${hugoThemeGitRepoBranch} for git submodule ${hugoThemeGitRepo} in ${this.outdir}`);
    }

    // TODO: fix the file. in test we have the entry twice...
    // new TextFile(this, '.gitmodules', {
    //   lines: [
    //     `[submodule "blog/themes/${hugoThemeName}"]`,
    //     `  path = blog/themes/${hugoThemeName}`,
    //     `  url = ${hugoThemeGitRepo}`,
    //     `  branch = ${hugoThemeGitRepoBranch}`,
    //   ],
    // });

    // copy example site
    // TODO add check if already copied
    ret = execOrUndefined(`cp -r ${this.outdir}/blog/themes/${hugoThemeName}/exampleSite/*  ${this.outdir}/blog/`, { cwd: this.outdir, ignoreEmptyReturnCode: true });
    if (ret === undefined) {
      throw new Error(`Could not copy example site from ${this.outdir}/blog/themes/${hugoThemeName}/exampleSite to ${this.outdir}/blog`);
    }

    // create config file structure
    // TODO add check if already created
    ret = execOrUndefined('mkdir -p blog/config/_default blog/config/development blog/config/production', { cwd: this.outdir, ignoreEmptyReturnCode: true });
    if (ret === undefined) {
      throw new Error(`Could not create config file structure in ${this.outdir}/blog/config`);
    }

    // TODO add check if already moved
    ret = execOrUndefined(`mv ${this.outdir}/blog/config.toml ${this.outdir}/blog/config/_default/config.toml`, { cwd: this.outdir, ignoreEmptyReturnCode: true });
    if (ret === undefined) {
      throw new Error(`Could not move config.toml to ${this.outdir}/blog/config/_default/config.toml`);
    }

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
      // if target file exists yet
      if (fs.existsSync(path.join(this.outdir, 'blog', file))) {
        console.log(`Target file ${this.outdir}/blog/${file} already exists. Skipping copy from theme dir.`);
        continue;
      }

      // Source file does not exist
      if (!fs.existsSync(path.join(this.outdir, `blog/themes/${hugoThemeName}`, file))) {
        console.log(`Source file ${this.outdir}/blog/themes/${hugoThemeName}/${file} does not exist. Skipping copy from theme dir.`);
        continue;
      }

      ret = execOrUndefined(`cp blog/themes/${hugoThemeName}/${file} blog/${file}`, { cwd: this.outdir, ignoreEmptyReturnCode: true });
      if (ret === undefined) {
        throw new Error(`Could not copy ${this.outdir}/blog/themes/${hugoThemeName}/${file} to ${this.outdir}/blog/${file}`);
      }
      console.log(`Copied ${this.outdir}/blog/themes/${hugoThemeName}/${file} to ${this.outdir}/blog/${file}`);
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

    if (this.isAlreadyGitRepo) {
      ret = execOrUndefined('rm -rf .git', { cwd: this.outdir, ignoreEmptyReturnCode: true });
      if (ret === undefined) {
        throw new Error('Could not "rm -rf .git"');
      }
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
    console.log(execOrUndefined(`ls -lash ${outdir}`, { cwd: this.project.outdir }));
    console.log(execOrUndefined(`cat ${outdir}/.gitmodules`, { cwd: this.project.outdir }));
    console.log(execOrUndefined(`ls -lash ${outdir}/blog`, { cwd: this.project.outdir }));
    // console.log(`srcdir: ${srcdir}`);
    // console.log('src ls la', execOrUndefined(`ls -lash ${srcdir}`, { cwd: this.project.outdir }));
    // console.log('cat', execOrUndefined(`cat ${srcdir}/main.ts`, { cwd: this.project.outdir }));
    // Note: there is a main.ts, however with the default content
    if (
      fs.existsSync(srcdir) &&
      fs.readdirSync(srcdir).filter((x) => x.endsWith('.ts')) &&
      fs.readFileSync(path.join(srcdir, 'main.ts'), 'utf-8').includes('@mavogel/cdk-hugo-pipeline')
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
      fs.readdirSync(testdir).filter((x) => x.endsWith('.ts')) &&
      fs.readFileSync(path.join(testdir, 'main.test.ts'), 'utf-8').includes('expect(true).toBe(true);')
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

    console.log(execOrUndefined(`ls -lash ${testdir}`, { cwd: this.project.outdir }));
    console.log(execOrUndefined(`cat ${testdir}/main.test.ts`, { cwd: this.project.outdir }));
  }
}