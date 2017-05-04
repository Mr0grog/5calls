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
const chrome = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');
chrome.setDefaultService(new chrome.ServiceBuilder(chromedriver.path).build());

test.before(function() {
  const sauceUser = process.env.SAUCE_USERNAME;
  const sauceKey = process.env.SAUCE_ACCESS_KEY;
  this.driver = new webdriver.Builder()
    .usingServer(`https://${sauceUser}:${sauceKey}@ondemand.saucelabs.com:443/wd/hub`)
    .withCapabilities({
      browserName: 'chrome',
      platform: 'Windows 10',
      version: 'latest',
      timeout: 20000
    })
    .build();
  this.baseUrl = config.getBaseUrl();
});

test.after(function() {
  if (this.driver) {
    this.driver.quit();
  }
});
