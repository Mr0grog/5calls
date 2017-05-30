/**
 * Karma configuration for running tests in Sauce Labs when on CI.
 * To use, ensure the following environment vars are set:
 * SAUCE_USERNAME: Your username on Sauce Labs
 * SAUCE_ACCESS_KEY: A generated access key for your Sauce Labs account
 *                   Go to the "My Account" panel in Sauce and scroll down
 *                   "Access Key". Click the "show" button to see your key.
 */

const sauceBrowsers = require('./sauce-browsers');

module.exports = function (configuration) {
  const jsName = name => name.replace(/[^0-9a-zA-Z]/g, '_');
  const browsers = Object.keys(sauceBrowsers).map(jsName);
  const browserConfiguration = Object.keys(sauceBrowsers)
    .reduce((config, name) => {
      config[jsName(name)] = Object.assign(
        {base: 'SauceLabs'},
        sauceBrowsers[name]);
      return config;
    }, {});

  // start with basic karma config
  require('./karma.conf.js')(configuration);

  // and override for CI/Sauce-specific settings
  configuration.set({
    sauceLabs: {
      testName: '5calls Tests'
    },
    customLaunchers: browserConfiguration,
    browsers,
    frameworks: ['mocha', 'browserify'],
    reporters: ['mocha', 'saucelabs'],
    singleRun: true,
    // don't apply code coverage transformation, it breaks things on sauce
    // for edge and safari browsers. See:
    // https://github.com/karma-runner/karma-sauce-launcher/issues/95#issuecomment-255020888
    // https://github.com/istanbuljs/babel-plugin-istanbul/issues/81
    browserify: {
      debug: true,
      transform: ['es2040']
    },
    
    concurrency: 2,

    // Since tests are remote, give a little extra time
    captureTimeout: 300000,
    browserNoActivityTimeout: 30000
  });
};
