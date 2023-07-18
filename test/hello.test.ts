import { synthSnapshot } from 'projen/lib/util/synth';
import { HugoPipelineAwsCdkTypeScriptApp } from '../src';

describe('hello', () => {
  test('minimal', () => {
    expect(new HugoPipelineAwsCdkTypeScriptApp({
      cdkVersion: '2.1.0',
      defaultReleaseBranch: 'main',
      name: 'projen-cdk-hugo-pipeline',
    }).sayHello()).toBe('hello, world!');
  });

  test('empty context', () => {
    const project = new HugoPipelineAwsCdkTypeScriptApp({
      cdkVersion: '2.0.0-rc.1',
      defaultReleaseBranch: 'main',
      name: 'test',
    });
    const snap = synthSnapshot(project);
    expect(snap['cdk.json'].context).toBeUndefined();
  });
});