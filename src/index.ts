import { AwsCdkTypeScriptApp, AwsCdkTypeScriptAppOptions } from 'projen/lib/awscdk/awscdk-app-ts';

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
}

export class HugoPipelineAwsCdkTypeScriptApp extends AwsCdkTypeScriptApp {
  constructor(options: HugoPipelineAwsCdkTypeScriptAppOptions) {
    super(options);

    const hugoThemeName = options.hugoThemeName ?? 'blist';

    // checkout git repo
    // set branch

    // copy example site
    // create config file structure

    // gitignore
    this.gitignore.exclude(`blog/themes/${hugoThemeName}/public*`);
    this.gitignore.exclude(`blog/themes/${hugoThemeName}/resources/_gen`);
    this.gitignore.exclude(`blog/themes/${hugoThemeName}/.DS_Store`);
    this.gitignore.exclude(`blog/themes/${hugoThemeName}/.hugo_build.lock`);

    // copy optional package.jsons

    // add conditional dev task to package.json

    // write sample code to main.ts

    // write sample code to main.test.ts
  }
}