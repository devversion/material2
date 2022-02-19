import {ReleaseTrain} from '@angular/dev-infra-private/ng-dev/release/versioning';
import * as fs from 'fs';
import * as path from 'path';
import * as sh from 'shelljs';

/** Absolute path to the `angular/components` project root. */
export const projectDir = path.join(__dirname, '../..');

/** Object capturing all site ids for the docs-app deployment. */
export const siteIds = {
  stable: 'ng-comp-test',
  next: 'next-ng-comp-test',
  rc: 'rc-ng-comp-test',

  forMajor: (major: number) => `v${major}-ng-comp-test`,
  forTrain: (train: ReleaseTrain) => siteIds.forMajor(train.version.major),
};

/** Finds and parsed the `package.json` of the specified project directory. */
export async function getPackageJsonOfProject(
  projectPath: string,
): Promise<{path: string; parsed: any}> {
  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageJsonContent = await fs.promises.readFile(packageJsonPath, 'utf8');

  return {
    path: packageJsonPath,
    parsed: JSON.parse(packageJsonContent),
  };
}

/**
 * Installs dependencies in the specified docs repository and builds the
 * production site output.
 */
export async function installDepsAndBuildDocsSite(repoPath: string) {
  sh.exec('yarn install --non-interactive --ignore-scripts', {cwd: repoPath});
  sh.exec('yarn prod-build', {cwd: repoPath});
}
