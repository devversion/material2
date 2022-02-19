import {
  fetchActiveReleaseTrains,
  getNextBranchName,
  ReleaseRepoWithApi,
} from '@angular/dev-infra-private/ng-dev/release/versioning';
import {assertValidGithubConfig, getConfig} from '@angular/dev-infra-private/ng-dev/utils/config';
import {
  AuthenticatedGithubClient,
  GithubClient,
} from '@angular/dev-infra-private/ng-dev/utils/git/github';

export function getReleaseRepoWithApi(): ReleaseRepoWithApi {
  const githubClient =
    process.env.GITHUB_TOKEN !== undefined
      ? new AuthenticatedGithubClient(process.env.GITHUB_TOKEN)
      : new GithubClient();
  const {github} = getConfig([assertValidGithubConfig]);

  return {
    api: githubClient,
    name: github.name,
    owner: github.owner,
    nextBranchName: getNextBranchName(github),
  };
}
