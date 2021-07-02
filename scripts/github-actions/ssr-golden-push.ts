import {getOctokit, context} from '@actions/github';
import * as ZipFile from 'adm-zip';

const zip = require('zip')

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

  const {data: pullRequestNumberZipData} = await octokit.rest.actions.downloadArtifact(
      {...context.repo, artifact_id: pullRequestArtifactId, archive_format: 'zip'});
  const {data: screenshotGoldenZipData} = await octokit.rest.actions.downloadArtifact(
    {...context.repo, artifact_id: screenshotGoldenArtifactId, archive_format: 'zip'});


  const pullRequestNumberZip = new ZipFile(Buffer.from(pullRequestNumberZipData as any));
  const screenshotGoldenZip = new ZipFile(Buffer.from(screenshotGoldenZipData as any));

  const prNumber = Number(pullRequestNumberZip.readAsText('pr_number', 'utf8'));
  const screenshotGoldenData = pullRequestNumberZip.readFile('');
}

if (require.main === module) {
  main(process.argv[0]!).catch(e => {
    console.error(e);
    process.exit(1);
  });
}
