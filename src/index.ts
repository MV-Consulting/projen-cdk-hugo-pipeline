import { AwsCdkTypeScriptApp, AwsCdkTypeScriptAppOptions } from 'projen/lib/awscdk/awscdk-app-ts';

export interface HugoPipelineAwsCdkTypeScriptAppOptions
  extends AwsCdkTypeScriptAppOptions {
  // Add your own options here
}

export class HugoPipelineAwsCdkTypeScriptApp extends AwsCdkTypeScriptApp {
  constructor(options: HugoPipelineAwsCdkTypeScriptAppOptions) {
    super(options);
  }

  public sayHello() {
    return 'hello, world!';
  }
}