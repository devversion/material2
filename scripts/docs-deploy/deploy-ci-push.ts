#!/usr/bin/env node

import {
  fetchActiveReleaseTrains,
  getBranchesForMajorVersions,
  getVersionForVersionBranch,
  isVersionBranch,
} from '@angular/dev-infra-private/ng-dev/release/versioning';
import * as semver from 'semver';
import {getReleaseRepoWithApi} from './github-versioning';
import {buildAndDeployWithSnapshots} from './snapshot-build';
import {firebaseConfig, getPackageJsonOfProject, projectDir, siteIds} from './utils';

async function main() {
  if (process.env.CIRCLE_PR_NUMBER !== undefined) {
    console.log('Skipping deployment for pull request build.');
    return;
  }

  const branchName = process.env.CIRCLE_BRANCH;
  if (branchName === undefined) {
    throw new Error('Deployment script is unable to determine CI branch.');
  }

  const repo = getReleaseRepoWithApi();
  const active = await fetchActiveReleaseTrains(repo);
  const description = `${branchName} - ${process.env.CIRCLE_SHA1!}`;
  const {projectId, token: authToken} = firebaseConfig;

  if (branchName === active.next.branchName) {
    const targets = [{projectId, description, siteId: siteIds.next}];

    // If the next release train is for a new major that is not published as part of the
    // other active release trains, we also publish to e.g. `v14.material.angular.io`.
    if (active.next.version.major > (active.releaseCandidate ?? active.latest).version.major) {
      targets.push({projectId, description, siteId: siteIds.forTrain(active.next)});
    }

    await buildAndDeployWithSnapshots(authToken, targets);
    return;
  }

  if (branchName === active.latest.branchName) {
    const targets = [
      {projectId, description, siteId: siteIds.stable},
      {projectId, description, siteId: siteIds.forTrain(active.latest)},
    ];

    // If there is no active RC train, we also push the current stable to the `rc` site.
    // TODO: This can be improved by using redirects from rc -> stable.
    if (active.releaseCandidate === undefined) {
      targets.push({projectId, description, siteId: siteIds.rc});
    }

    await buildAndDeployWithSnapshots(authToken, targets);
    return;
  }

  if (branchName === active.releaseCandidate?.branchName) {
    const targets = [{projectId, description, siteId: siteIds.rc}];

    // If the RC is for a new major that neither `latest`, nor `next` publish,
    // we will also push the dedicated major like `v13.material.angular.io`.
    if (
      active.releaseCandidate.version.major > active.latest.version.major &&
      active.releaseCandidate.version.major < active.next.version.major
    ) {
      targets.push({projectId, description, siteId: siteIds.forTrain(active.releaseCandidate)});
    }

    await buildAndDeployWithSnapshots(authToken, targets);
    return;
  }

  // In other cases, we are potentially deploying an archived major, regardless
  // of LTS being active or not.
  if (!isVersionBranch(branchName)) {
    console.log('Skipping deployment as the current branch is not a version branch.');
    return;
  }

  const branchVersion = getVersionForVersionBranch(branchName)!;
  const branchesForMajor = await getBranchesForMajorVersions(repo, [branchVersion.major]);

  // The `branchesForMajor` array will hold the most recent version branch for current major.
  // If the latest branch does not match the current one, we know that this is not the
  // most recent minor and should not be re-deployed to e.g. `<major>.material.angular.io`.
  if (branchesForMajor[0].name !== branchName) {
    console.log(
      `Skipping deployment as version branch is not the most recent ` +
        `one for v${branchVersion.major}. Expected: ${branchesForMajor[0].name}`,
    );
    return;
  }

  const {parsed} = await getPackageJsonOfProject(projectDir);
  const version = semver.parse(parsed.version)!;

  await buildAndDeployWithSnapshots(authToken, [
    {projectId, description, siteId: siteIds.forMajor(version.major)},
  ]);
}

main().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
