#!/usr/bin/env node

import {cloneDocsRepositoryForMajor} from './clone-docs-repo';
import {performDefaultSnapshotBuild} from '../build-packages-dist';
import {buildDocsContentPackage} from '../build-docs-content';
import {installBuiltPackagesInRepo} from './install-built-packages';
import * as path from 'path';
import * as sh from 'shelljs';
import {DeploymentInfo, deployToSite} from './deploy-to-site';
import {SemVer} from 'semver';

export async function buildAndDeployWithNpm(
  firebaseToken: string,
  version: SemVer,
  target: DeploymentInfo[],
) {
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

  // TODO
  // await installBuiltPackagesInRepo(docsRepoPackageJson, builtPackages);

  // Install yarn dependencies and build the production output.
  sh.cd(docsRepoDir);
  sh.exec('yarn install --non-interactive --ignore-scripts');
  sh.exec('yarn prod-build');

  // Deploy all targets to Firebase.
  target.forEach(t => deployToSite(docsRepoDir, firebaseToken, t));
}
