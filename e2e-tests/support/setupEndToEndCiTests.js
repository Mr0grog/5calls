/**
 * Included into each e2e test via the mocha require
 * option (see test:e2e task in gulpfile.js).
 *
 */
const webdriver = require('selenium-webdriver');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const config = require('./e2e-tests.config');
const test = require('selenium-webdriver/testing');
const sauceBrowsers = require('../../sauce-browsers');

// The first connection can be slow; Sauce's VM may still be starting :(
config.defaultTimeout = 60000;

test.before(function() {
  this.driver = buildBrowser(process.env.CI_BROWSER);
  this.baseUrl = config.getBaseUrl();
});

test.after(function() {
  if (this.driver) {
    this.driver.quit();
  }
});

function buildBrowser (name) {
  const capabilities = sauceBrowsers[name];
  
  if (!capabilities) {
    throw new Error(`Unknown browser: "${name}"`);
  }
  
  const user = process.env.SAUCE_USERNAME;
  const key = process.env.SAUCE_ACCESS_KEY;
  if (!user || !key) {
    throw new Error(`SAUCE_USERNAME and SAUCE_ACCESS_KEY env vars are not set`);
  }
  
  const hubUrl = `https://${user}:${key}@ondemand.saucelabs.com:443/wd/hub`;
  return new webdriver.Builder()
    .usingServer(hubUrl)
    .withCapabilities(capabilities)
    .build();
}
