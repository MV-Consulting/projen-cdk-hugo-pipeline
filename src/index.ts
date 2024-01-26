import * as fs from 'fs';
import * as path from 'path';
import { AwsCdkTypeScriptApp, AwsCdkTypeScriptAppOptions } from 'projen/lib/awscdk/awscdk-app-ts';
import { Component } from 'projen/lib/component';
import { TextFile } from 'projen/lib/textfile';
import { execOrUndefined, isGitRepository, fileOrDirectoyExists, lineExistsInFile } from './util';

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
   * The structure of the Hugo theme submodule folder without trailing slash.
   *
   * @default blog/themes/blist
   *
   */
  readonly hugoThemeSubmoduleStructure?: string;

  /**
   * The name of the Hugo theme config file.
   *
   * @default config.toml
   */
  readonly hugoThemeConfigFile?: string;

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
  private gitInitExecuted: boolean;

  constructor(options: HugoPipelineAwsCdkTypeScriptAppOptions) {
    super(options);

    this.gitInitExecuted = false;
    const domain = options.domain;
    const subDomain = options.subDomain || 'dev';
    const hugoThemeSubmoduleStructure = options.hugoThemeSubmoduleStructure || 'blog/themes/blist';
    const hugoThemeConfigFile = options.hugoThemeConfigFile || 'config.toml';
    const hugoThemeGitRepo = options.hugoThemeGitRepo || 'https://github.com/apvarun/blist-hugo-theme.git';
    const hugoThemeGitRepoBranch = options.hugoThemeGitRepoBranch || 'v2.1.0';
    const hugoThemeDevCommand = options.hugoThemeDevCommand || 'npm --prefix blog run start';


    let ret = undefined;
    if (!isGitRepository(this.outdir)) {
      ret = execOrUndefined('git init', { cwd: this.outdir });
      if (ret === undefined) {
        throw new Error('Could not "git init"');
      }
      this.gitInitExecuted = true;
    }

    // Note: as of now not possible with git lib such as 'https://github.com/isomorphic-git/isomorphic-git'
    // checkout theme git repo
    if (!lineExistsInFile(path.join(this.outdir, '.gitmodules'), `[submodule "${hugoThemeSubmoduleStructure}"]`)) {
      ret = execOrUndefined(`git submodule add ${hugoThemeGitRepo} ${hugoThemeSubmoduleStructure}`, { cwd: this.outdir, ignoreEmptyReturnCode: true });
      if (ret === undefined) {
        throw new Error(`Could not add git submodule ${hugoThemeGitRepo} to ${this.outdir}`);
      }
    }

    // set branch
    ret = execOrUndefined(`git submodule set-branch --branch ${hugoThemeGitRepoBranch} ${hugoThemeSubmoduleStructure}`, { cwd: this.outdir, ignoreEmptyReturnCode: true });
    if (ret === undefined) {
      throw new Error(`Could not set branch ${hugoThemeGitRepoBranch} for git submodule ${hugoThemeGitRepo} via 'set-branch' in ${this.outdir}`);
    }

    ret = execOrUndefined(`git checkout ${hugoThemeGitRepoBranch}`, { cwd: `${this.outdir}/${hugoThemeSubmoduleStructure}`, ignoreEmptyReturnCode: true });
    if (ret === undefined) {
      throw new Error(`Could not set branch ${hugoThemeGitRepoBranch} for git submodule ${hugoThemeGitRepo} via 'checkout' in ${this.outdir}/${hugoThemeSubmoduleStructure}`);
    }

    // copy example site
    if (!lineExistsInFile(path.join(this.outdir, 'blog/config/_default/config.toml'), `theme = "${hugoThemeSubmoduleStructure.lastIndexOf('/') > 0 ? hugoThemeSubmoduleStructure.substring(hugoThemeSubmoduleStructure.lastIndexOf('/') + 1) : hugoThemeSubmoduleStructure}"`)) {
      if (fileOrDirectoyExists(path.join(this.outdir, `${hugoThemeSubmoduleStructure}/exampleSite`))) {
        ret = execOrUndefined(`cp -r ${this.outdir}/${hugoThemeSubmoduleStructure}/exampleSite/*  ${this.outdir}/blog/`, { cwd: this.outdir, ignoreEmptyReturnCode: true });
        if (ret === undefined) {
          throw new Error(`Could not copy example site from ${this.outdir}/${hugoThemeSubmoduleStructure}/exampleSite to ${this.outdir}/blog`);
        }
      } else {
        console.log(`Could not find example site in ${this.outdir}/${hugoThemeSubmoduleStructure}/exampleSite. No copying`);
      }
    }

    // create config file structure
    // Note: no check needed as 'mkdir -p' does not throw an error if the dir already exists
    ret = execOrUndefined('mkdir -p blog/config/_default blog/config/development blog/config/production', { cwd: this.outdir, ignoreEmptyReturnCode: true });
    if (ret === undefined) {
      throw new Error(`Could not create config file structure in ${this.outdir}/blog/config`);
    }

    if (!fileOrDirectoyExists(path.join(this.outdir, 'blog/config/_default/config.toml'))) {
      ret = execOrUndefined(`mv ${this.outdir}/blog/${hugoThemeConfigFile} ${this.outdir}/blog/config/_default/config.toml`, { cwd: this.outdir, ignoreEmptyReturnCode: true });
      if (ret === undefined) {
        throw new Error(`Could not move '${this.outdir}/blog/${hugoThemeConfigFile}' to '${this.outdir}/blog/config/_default/config.toml'`);
      }
    }

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
      `${hugoThemeSubmoduleStructure}/public*`,
      `${hugoThemeSubmoduleStructure}/resources/_gen`,
      `${hugoThemeSubmoduleStructure}/.DS_Store`,
      `${hugoThemeSubmoduleStructure}/.hugo_build.lock`,
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
      if (fileOrDirectoyExists(path.join(this.outdir, 'blog', file))) {
        console.log(`Target file ${this.outdir}/blog/${file} already exists. Skipping copy from theme dir.`);
        continue;
      }

      // Source file does not exist
      if (!fileOrDirectoyExists(path.join(this.outdir, `${hugoThemeSubmoduleStructure}`, file))) {
        console.log(`Source file ${this.outdir}/${hugoThemeSubmoduleStructure}/${file} does not exist. Skipping copy from theme dir.`);
        continue;
      }

      ret = execOrUndefined(`cp ${hugoThemeSubmoduleStructure}/${file} blog/${file}`, { cwd: this.outdir, ignoreEmptyReturnCode: true });
      if (ret === undefined) {
        throw new Error(`Could not copy ${this.outdir}/${hugoThemeSubmoduleStructure}/${file} to ${this.outdir}/blog/${file}`);
      }
      console.log(`Copied ${this.outdir}/${hugoThemeSubmoduleStructure}/${file} to ${this.outdir}/blog/${file}`);
    }

    // add conditional dev task to package.json
    const hugoThemeTopFolder = hugoThemeSubmoduleStructure.indexOf('/') > 0 ? hugoThemeSubmoduleStructure.substring(0, hugoThemeSubmoduleStructure.indexOf('/')) : hugoThemeSubmoduleStructure;
    this.package.setScript('dev', hugoThemeDevCommand);
    this.package.setScript('build-dev', `cd ${hugoThemeTopFolder} && hugo --gc --minify --cleanDestinationDir --environment development`);
    this.package.setScript('build', `cd ${hugoThemeTopFolder} && hugo --gc --minify --cleanDestinationDir --environment production`);

    // add dependencies
    this.addDeps('@mavogel/cdk-hugo-pipeline');

    // write sample code to main.ts & to main.test.ts
    if (options.sampleCode ?? true) {
      new SampleCode(this, {
        domain: domain,
        subDomain: subDomain,
      });
    }

    // remove .git folder as projen with do it at the end as well
    // we need to do it here as we need to add the submodule before
    if (this.gitInitExecuted) {
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
    // Note: there is a main.ts, however with the default content
    if (
      fileOrDirectoyExists(srcdir) &&
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
      fileOrDirectoyExists(testdir) &&
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
  }
}