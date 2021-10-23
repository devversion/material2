#!/usr/bin/env bash

/**
 * Fetches a specified artifact by name from the given workflow and writes
 * the downloaded zip file to the specified out location.
 *
 * Command line usage:
 *   ./fetch-workflow-artifact.js <gh-token> <workflow-id> <artifact-name> <out-path>
 */

const {Octokit} = require('@octokit/rest');
const {writeFile} = require('fs/promises');

const repo = {owner: 'devversion', repo: 'material2'};

async function main() {
  const [token, workflowId, artifactName] = process.argv.slice(2);
  const github = new Octokit({auth: token});
  const artifacts = await github.actions.listWorkflowRunArtifacts({
    ...repo,
    run_id: workflowId,
  });

  const matchArtifact = artifacts.data.artifacts.filter(
    artifact => artifact.name == artifactName,
  )[0];

  const download = await github.actions.downloadArtifact({
    ...repo,
    artifact_id: matchArtifact.id,
    archive_format: 'zip',
  });

  process.stdout.write(Buffer.from(download.data));
}

main().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
