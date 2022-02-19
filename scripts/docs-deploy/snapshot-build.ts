import {cloneDocsRepositoryForMajor} from './clone-docs-repo';
import {performDefaultSnapshotBuild} from '../build-packages-dist';
import {buildDocsContentPackage} from '../build-docs-content';
import {installBuiltPackagesInRepo} from './install-built-packages';
import {DeploymentInfo, deployToSite} from './deploy-to-site';
import {installDepsAndBuildDocsSite} from './utils';

export async function buildAndDeployWithSnapshots(firebaseToken: string, target: DeploymentInfo[]) {
  // Clone the docs repo.
  const docsRepoDir = cloneDocsRepositoryForMajor(14);

  // Build the release output.
  const builtPackages = performDefaultSnapshotBuild();

  // Build the docs-content NPM package (not included in the default snapshot build)
  builtPackages.push(buildDocsContentPackage());

  // Install the release output, together with the examples into the
  // the docs repository.
  await installBuiltPackagesInRepo(docsRepoDir, builtPackages);

  // Install yarn dependencies and build the production output.
  await installDepsAndBuildDocsSite(docsRepoDir);

  // Deploy all targets to Firebase.
  target.forEach(t => deployToSite(docsRepoDir, firebaseToken, t));
}
