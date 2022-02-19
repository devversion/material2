import {ReleaseTrain} from '@angular/dev-infra-private/ng-dev/release/versioning';
import * as path from 'path';

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
