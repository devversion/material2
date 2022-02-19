import * as path from 'path';
import * as sh from 'shelljs';
import {projectDir} from './utils';

/** Git repository HTTP url pointing to the docs repository. */
export const docsRepoUrl = 'https://github.com/angular/material.angular.io.git';

/**
 * Clones the docs repository for the given major into a
 * temporary directory.
 *
 * @returns An absolute path to the temporary directory.
 */
export function cloneDocsRepositoryForMajor(major: number): string {
  const repoTmpDir = path.join(projectDir, 'tmp/docs-repo');
  const baseCloneArgs = `${docsRepoUrl} ${repoTmpDir} --single-branch --depth=1`;
  const majorDocsBranchName = getDocsBranchNameForMajor(major);

  // Ensure the repository directory does not exist yet.
  sh.rm('-Rf', repoTmpDir);

  // Clone the docs app (either the main branch, or a dedicated major branch if available).
  if (hasUpstreamDocsBranch(majorDocsBranchName)) {
    console.log(`Cloning docs app with dedicated branch: ${majorDocsBranchName}`);
    sh.exec(`git clone ${baseCloneArgs} --branch=${majorDocsBranchName}`, {fatal: true});
  } else {
    console.log(`Cloning docs app with default branch (no dedicated branch for major).`);
    sh.exec(`git clone ${baseCloneArgs}`, {fatal: true});
  }

  return repoTmpDir;
}

/**
 * Gets whether the specified branch exists in the specified remote URL.
 */
function hasUpstreamDocsBranch(branchName: string): boolean {
  const proc = sh.exec(`git ls-remote ${docsRepoUrl} refs/heads/${branchName}`, {
    silent: true,
    fatal: true,
  });

  return proc.stdout.trim() !== '';
}

/**
 * Gets the name of a potential dedicated branch for this major in the
 * docs repository.
 *
 * e.g. if a branch like `13.x` exists and we intend to deploy v13, then
 * this branch can be used as revision for the docs-app.
 *
 * More details on why this is preferred:
 * https://docs.google.com/document/d/1xkrSOFa6WeFqyg1cTwMhl_wB8ygbVwdSxr3K2-cps14/edit#heading=h.nsf3ag63jpwu.
 */
function getDocsBranchNameForMajor(major: number): string {
  return `firebase-target`;
  // TODO return `${major}.x`;
}
