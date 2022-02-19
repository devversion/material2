import * as sh from 'shelljs';

export interface DeploymentTarget {
  projectId: string;
  siteId: string;
  description: string;
}

export function deployToSite(projectPath: string, token: string, target: DeploymentTarget) {
  const firebase = (cmd: string) =>
    sh.exec(`yarn firebase --token "${token} "${cmd}`, {cwd: projectPath});

  firebase(`use ${target.projectId}`);
  firebase(`target:clear hosting dest`);
  firebase(`target:apply hosting dest "${target.siteId}"`);
  firebase(`deploy --only hosting:dest --non-interactive --message "${target.description}"`);
}
