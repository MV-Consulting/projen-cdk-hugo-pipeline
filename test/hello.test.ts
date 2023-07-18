import { synthSnapshot } from 'projen/lib/util/synth';
import { HugoPipelineAwsCdkTypeScriptApp } from '../src';

describe('hello', () => {
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