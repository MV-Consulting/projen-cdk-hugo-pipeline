import { cdk } from 'projen';
import { NpmAccess } from 'projen/lib/javascript';

const dependencies = ['projen@~0'];

const project = new cdk.JsiiProject({
  author: 'Manuel Vogel',
  authorAddress: 'mavogel@posteo.de',
  defaultReleaseBranch: 'main',
  jsiiVersion: '~5.3.0',
  name: '@mavogel/projen-cdk-hugo-pipeline',
  projenrcTs: true,
  repositoryUrl: 'git@github.com:mavogel/projen-cdk-hugo-pipeline.git',
  releaseToNpm: true,
  npmAccess: NpmAccess.PUBLIC,
  majorVersion: 0,

  deps: dependencies,
  peerDeps: dependencies,
  description: 'A external projen component to create a Hugo pipeline with AWS CDK.',
  keywords: ['aws', 'cdk', 'hugo', 'projen'],
  autoApproveOptions: {
    allowedUsernames: ['mavogel'],
  },
  autoApproveUpgrades: true,
  depsUpgradeOptions: {
    workflowOptions: {
      labels: ['auto-approve'],
    },
  },
});
project.gitignore.exclude('test/hugo-pipe-test-*');
project.synth();