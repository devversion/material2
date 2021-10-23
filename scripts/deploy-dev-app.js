#!/usr/bin/env node

/**
 * Script that builds the dev-app as a static web package that will be
 * deployed to the currently configured Firebase project.
 */

const {exec, cd, cp, rm, chmod} = require('shelljs');
const {join} = require('path');
const minimist = require('minimist');

main().catch(e => {
  console.error(e);
  process.exitCode = 1
});

async function main() {
  /** Parsed command line arguments. */
  const args = minimist(process.argv.slice(2),
    {string: ['channelId', 'project'], boolean: ['json']});

  /** Whether this script is expected to output the deployment info as JSON. */
  const outputJson = args.json;

  /**
   * Firebase hosting channel where the dev-app should be deployed to.
   * Deploys to the "live" channel by default.
   * https://firebase.google.com/docs/hosting/manage-hosting-resources.
   */
  const channelId = args.channelId ?? 'live';

  /**
   * Project into which the dev-app should be deployed. By default, the previously
   * selected project is used, or the `.firebaserc` file is consulted.
   */
  const projectId = args.project;

  /** Path to the project directory. */
  const projectDirPath = join(__dirname, '../');

  // Go to project directory.
  cd(projectDirPath);

  /** Path to the bazel-bin directory. */
  const bazelBinPath = (await silentExec(`bazel info bazel-bin`)).trim();

  /** Output path for the Bazel dev-app web package target. */
  const webPackagePath = join(bazelBinPath, 'src/dev-app/web_package');

  /** Destination path where the web package should be copied to. */
  const distPath = join(projectDirPath, 'dist/dev-app-web-pkg');

  // Build web package output.
  await silentExec('bazel build //src/dev-app:web_package');

  // Clear previous deployment artifacts.
  rm('-Rf', distPath);

  // Copy the web package from the bazel-bin directory to the project dist
  // path. This is necessary because the Firebase CLI does not support deployment
  // of a public folder outside of the "firebase.json" file.
  cp('-R', webPackagePath, distPath);

  // Bazel by default marks output files as `readonly` to ensure hermeticity. Since we moved
  // these files out of the `bazel-bin` directory, we should make them writable. This is necessary
  // so that subsequent runs of this script can delete old contents from the deployment dist folder.
  chmod('-R', 'u+w', distPath);

  // If an explicit project is specified, pass it to the deploy command.
  const projectIdArg = projectId ? `--project ${projectId}` : '';
  const jsonArg = outputJson ? `--json` : '';
  const deployCommandArg = channelId === 'live' ?
    'deploy --only hosting' : `hosting:channel:deploy ${channelId}`;

  // Run the Firebase CLI to deploy the hosting target.
  const deployResultStdout = await silentExec(
    `yarn -s firebase ${deployCommandArg} ${projectIdArg} ${jsonArg}`);

  if (outputJson) {
    process.stdout.write(deployResultStdout.trim());
  }
}

/**
 * Executes the given command silently without polluting the stdout of the current process.
 * This is necessary so that the JSON output is not colliding with other output.
 * @returns a promise resolving with the command stdout on success.
 */
function silentExec(command) {
  return new Promise((resolve, reject) => {
    const execProcess = exec(command, {silent: true, fatal: false, async: true});
    let stdout = '';

    execProcess.stdout.on('data', value => {
      stdout += value;
      process.stderr.write(value)
    });

    execProcess.stderr.on('data', value => process.stderr.write(value));
    execProcess.on('close', status => status === 0 ? resolve(stdout) : reject());
  });
}
