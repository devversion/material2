import {SemVer} from 'semver';
import * as sh from 'shelljs';
import {cloneDocsRepositoryForMajor} from './clone-docs-repo';
import {DeploymentInfo, deployToSite} from './deploy-to-site';
import {installDepsAndBuildDocsSite} from './utils';

export async function buildAndDeployWithNpmArtifacts(
  firebaseToken: string,
  docsContentBranch: string,
  version: SemVer,
  target: DeploymentInfo[],
) {
  // Clone the docs repo for the given major.
  const docsRepoDir = cloneDocsRepositoryForMajor(version.major);

  // Update Angular version and the docs-content.

  // TODO
  // await installBuiltPackagesInRepo(docsRepoPackageJson, builtPackages);

  // Install yarn dependencies and build the production output.
  await installDepsAndBuildDocsSite(docsRepoDir);

  // Deploy all targets to Firebase.
  target.forEach(t => deployToSite(docsRepoDir, firebaseToken, t));
}
