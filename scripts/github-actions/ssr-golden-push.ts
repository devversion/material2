import {setFailed, info} from '@actions/core';
import {getOctokit, context} from '@actions/github';
import {spawnSync} from 'child_process';
import * as ZipFile from 'adm-zip';
import {basename} from 'path';
import {writeFileSync} from 'fs';

/** Type describing an Octokit instance. */
type Octokit = ReturnType<typeof getOctokit>;

const SCREENSHOT_GOLDEN_PATH = 'goldens/kitchen-sink-prerendered.png';

/** Entry point for the SSR golden push script. */
async function main(authToken: string) {
  const octokit = getOctokit(authToken);

  const {data} = await octokit.rest.actions.listWorkflowRunArtifacts({
    ...context.repo,
    run_id: context.payload.workflow_run.id,
  });

  let pullRequestArtifactId: number|null = null;
  let screenshotGoldenArtifactId: number|null = null;

  for (const artifact of data.artifacts) {
    if (artifact.name === 'pr_number') {
      pullRequestArtifactId = artifact.id;
    } else if (artifact.name === 'screenshot') {
      screenshotGoldenArtifactId = artifact.id;
    }
  }

  if (pullRequestArtifactId === null) {
    throw Error('Could not find pull request number artifact.');
  } else if (screenshotGoldenArtifactId === null) {
    throw Error('Could not find screenshot golden artifact.');
  }

  const pullRequestNumberZip = await downloadArtifact(octokit, pullRequestArtifactId);
  const screenshotGoldenZip = await downloadArtifact(octokit, screenshotGoldenArtifactId);

  const prNumber = Number(pullRequestNumberZip.readAsText('pr_number', 'utf8')!);
  const screenshotGoldenData = screenshotGoldenZip.readFile(basename(SCREENSHOT_GOLDEN_PATH))!;

  const {data: pullRequest} = await octokit.rest.pulls.get(
      {...context.repo, pull_number: prNumber});

  // If the pull request has not been authored by the author, and the actor does not
  // have write permissions, we skip the SSR golden push.
  if (pullRequest.user?.login !== context.actor && !await hasActorWritePermissions(octokit)) {
    setFailed('Unable to update SSR screenshot golden for pull request. No permission.');
    return;
  }

  // Note: We cannot use `https://` within Github actions as this is not supported.
  const prRepoSlug = `${pullRequest.head.repo.owner.login}/${pullRequest.head.repo.name}`;
  const prRemoteUrl = `http://ng-robot:${authToken}@github.com/${prRepoSlug}.git`;

  // Checkout the pull request.
  runGit(['fetch', prRemoteUrl, pullRequest.head.ref]);
  runGit(['checkout', 'FETCH_HEAD']);

  // Write the screenshot golden.
  writeFileSync(SCREENSHOT_GOLDEN_PATH, screenshotGoldenData);

  // Create a commit for the golden update and push it to the PR.
  runGit(['add', SCREENSHOT_GOLDEN_PATH]);
  runGit(['commit', '-m', 'test: update kitchen-sink prerender screenshot golden']);
  runGit(['push', prRemoteUrl, `HEAD:${pullRequest.head.ref}`]);

  info('Successfully updated pull request.');
}

function runGit(args: string[]): string {
  const {status, signal, stderr, stdout} = spawnSync('git', args, {shell: true, encoding: 'utf8'});
  if (status !== 0 || signal !== null) {
    throw Error(`Git command failed: ${args.join(' ')}: ${stderr}`);
  }
  return stdout;
}


async function downloadArtifact(octokit: Octokit, artifactId: number): Promise<ZipFile> {
  const {data} = await octokit.rest.actions.downloadArtifact(
    {...context.repo, artifact_id: artifactId, archive_format: 'zip'});

  return new ZipFile(Buffer.from(data as any));
}

async function hasActorWritePermissions(octokit: Octokit): Promise<boolean> {
  const {data: {permission}} = await octokit.rest.repos.getCollaboratorPermissionLevel(
    {...context.repo, username: context.actor})

  // Possible values are not typed but can be extracted from the API specification.
  // https://docs.github.com/en/rest/reference/repos#get-repository-permissions-for-a-user.
  return permission === 'admin' || permission === 'write';
}

if (require.main === module) {
  main(process.argv[0]!).catch(e => {
    console.error(e);
    process.exit(1);
  });
}
