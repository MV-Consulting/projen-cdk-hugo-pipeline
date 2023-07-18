import { HugoPipelineAwsCdkTypeScriptApp } from '../src';

test('hello', () => {
  expect(new HugoPipelineAwsCdkTypeScriptApp({
    cdkVersion: '2.1.0',
    defaultReleaseBranch: 'main',
    name: 'projen-cdk-hugo-pipeline',
  }).sayHello()).toBe('hello, world!');
});