import {Browser} from '../browser';
import {SaucelabsDaemon} from './saucelabs-daemon';

const parallelExecutions = 2;
const {platformMap, customLaunchers} = require('../../../test/browser-providers');

const username = process.env.SAUCE_USERNAME;
const accessKey = process.env.SAUCE_ACCESS_KEY;
const tunnelIdentifier = process.env.SAUCE_TUNNEL_IDENTIFIER;

if (!username || !accessKey) {
  throw Error('Please set the `SAUCE_USERNAME` and `SAUCE_ACCESS_KEY` variables.');
}

if (!tunnelIdentifier) {
  throw Error('No tunnel set up. Please set the `SAUCE_TUNNEL_IDENTIFIER` variable.');
}

const saucelabsBrowsers: Browser[] = platformMap.saucelabs
  .map((n: string) => customLaunchers[n]);
const browserInstances: Browser[] = [];

for (let i = 0; i < parallelExecutions; i++) {
  browserInstances.push(...saucelabsBrowsers);
}

// Start the daemon and launch the given browser.
new SaucelabsDaemon(username, accessKey, {tunnelIdentifier})
  .launchBrowsers(browserInstances);