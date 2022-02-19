import {BuiltPackage} from '@angular/dev-infra-private/ng-dev/release/config';
import * as fs from 'fs';
import * as url from 'url';
import {getPackageJsonOfProject} from './utils';

export async function installBuiltPackagesInRepo(repoPath: string, builtPackages: BuiltPackage[]) {
  const {parsed: packageJson, path: packageJsonPath} = await getPackageJsonOfProject(repoPath);

  // We will use Yarn resolutions to install the built packages.
  if (packageJson.resolutions === undefined) {
    packageJson.resolutions = {};
  }

  for (const builtPackage of builtPackages) {
    const pkgName = builtPackage.name;
    const destinationUrl = url.pathToFileURL(builtPackage.outputPath);

    // Add resolutions for each package in the format "**/{PACKAGE}" so that all
    // nested versions of that specific package will have the same version.
    packageJson.resolutions[`**/${pkgName}`] = destinationUrl;

    // Since the resolutions only cover the version of all nested installs, we also need
    // to explicitly set the version for the package listed in the project "package.json".
    packageJson.dependencies[pkgName] = destinationUrl;

    // In case this dependency was previously a dev dependency, just remove it because we
    // re-added it as a normal dependency for simplicity.
    delete packageJson.devDependencies[pkgName];
  }

  await fs.promises.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
}
