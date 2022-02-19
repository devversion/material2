import * as sh from 'shelljs';

interface Deployment {
  projectId: string;
  siteId: string;
}

/** Interface describing a production deployment. */
export interface ProductionDeployment extends Deployment {
  description: string;
}

/** Interface describing a temporary preview deployment. */
export interface PreviewDeployment extends Deployment {
  channelId: string;
  expires: string;
}

/** Type describing a Firebase deployment. */
export type DeploymentInfo = ProductionDeployment | PreviewDeployment;

/**
 * Deploys the docs site at the specified directory to Firebase with respect
 * to the deployment information provided.
 *
 * The deployment info either describes the production deployment information,
 * or a preview temporary deployment that will expire automatically.
 */
export function deployToSite(projectPath: string, token: string, info: DeploymentInfo) {
  // Note: Running yarn in silent move to avoid printing of tokens.
  const firebase = (cmd: string) =>
    sh.exec(`yarn -s firebase --non-interactive --token "${token}" ${cmd}`, {
      fatal: true,
      cwd: projectPath,
    });

  firebase(`use ${info.projectId}`);
  firebase(`target:clear hosting mat-aio`);
  firebase(`target:apply hosting mat-aio "${info.siteId}"`);

  if (isPreviewDeployment(info)) {
    firebase(`hosting:channel:deploy ${info.channelId} --only mat-aio --expires "${info.expires}"`);
  } else {
    firebase(`deploy --only hosting:mat-aio --message "${info.description}"`);
  }
}

/** Whether the given deployment info corresponds to a preview deployment. */
export function isPreviewDeployment(info: DeploymentInfo): info is PreviewDeployment {
  return (info as Partial<PreviewDeployment>).channelId !== undefined;
}
