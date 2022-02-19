#!/usr/bin/env node

import {cloneDocsRepositoryForMajor} from './clone-docs-repo';
import {performDefaultSnapshotBuild} from '../build-packages-dist';
import {buildDocsContentPackage} from '../build-docs-content';
import {installBuiltPackagesInRepo} from './install-built-packages';
import * as path from 'path';
import * as sh from 'shelljs';
import {deployToSite} from './deploy-to-site';

async function main() {
  sh.set('-e');

  // Clone the docs repo.
  const docsRepoDir = cloneDocsRepositoryForMajor(14);
  const docsRepoPackageJson = path.join(docsRepoDir, 'package.json');

  // Build the release output.
  const builtPackages = performDefaultSnapshotBuild();

  // Build the docs-content NPM package (not included in the default snapshot build)
  builtPackages.push(buildDocsContentPackage());

  // Install the release output, together with the examples into the
  // the docs repository.
  await installBuiltPackagesInRepo(docsRepoPackageJson, builtPackages);

  // TODO: Update StackBlitz boilerplate to snapshot builds for `next` publishes.

  sh.cd(docsRepoDir);
  sh.exec('yarn install --non-interactive --ignore-scripts');
  sh.exec('yarn prod-build');

  // Deploy to Firebase.
  deployToSite(docsRepoDir, process.env.TEST_FIREBASE_TOKEN!, {
    description: 'SHA: TODO',
    projectId: process.env.TEST_FIREBASE_PROJECT!,
    siteId: 'next-ng-comp-test', // TODO,
    /*channelId: 'test-pr',
    expires: '7d',*/
  });
}

main().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
