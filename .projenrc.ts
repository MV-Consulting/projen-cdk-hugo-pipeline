import { cdk } from 'projen';
const project = new cdk.JsiiProject({
  author: 'Manuel Vogel',
  authorAddress: 'mavogel@posteo.de',
  defaultReleaseBranch: 'main',
  jsiiVersion: '~5.0.0',
  name: 'projen-cdk-hugo-pipeline',
  projenrcTs: true,
  repositoryUrl: 'https://github.com/mavogel/projen-cdk-hugo-pipeline.git',

  deps: [ /* Runtime dependencies of this module. */
    'projen',
  ],
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
});
project.gitignore.exclude('test/hugo-pipe-test-*');
project.synth();