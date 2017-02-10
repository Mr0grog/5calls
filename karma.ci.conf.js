// Karma configuration for running tests in sauce labs when on CI.

module.exports = function (config) {
  config.set({
     // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'browserify'],

    // list of files / patterns to load in the browser
    files: [
      'static/js/**/*_test.js'
    ],

    // list of files to exclude
    exclude: [
      'app/**/*'
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      '!(node_modules)/**/*.js': ['browserify'],
    },

    browserify: {
      debug: true,
      transform: ['es2040'],
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['mocha', 'saucelabs'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    sauceLabs: {
      testName: '5calls Tests'
    },

    customLaunchers: {
      sauce_chrome: {
        base: 'SauceLabs',
        browserName: 'chrome',
        platform: 'Windows 10',
        version: 'latest'
      },
      sauce_firefox: {
        base: 'SauceLabs',
        browserName: 'firefox',
        version: 'latest'
      },
      sauce_ie: {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        platform: 'Windows 10',
        version: 'latest'
      },
      sauce_edge: {
        base: 'SauceLabs',
        browserName: 'MicrosoftEdge',
        platform: 'Windows 10',
        version: 'latest'
      },
      sauce_safari: {
        base: 'SauceLabs',
        browserName: 'Safari',
        version: 'latest'
      },
      sauce_ios_safari: {
        base: 'SauceLabs',
        deviceName: 'iPhone 7 Simulator',
        deviceOrientation: 'portrait',
        platformVersion: '10.0',
        platformName: 'iOS',
        browserName: 'Safari'
      },
      sauce_android: {
        base: 'SauceLabs',
        deviceName: 'Android Emulator',
        deviceOrientation: 'portrait',
        platformVersion: '5.1',
        platformName: 'Android',
        browserName: 'Browser'
      },
      sauce_android_4: {
        base: 'SauceLabs',
        deviceName: 'Android Emulator',
        deviceOrientation: 'portrait',
        platformVersion: '4.4',
        platformName: 'Android',
        browserName: 'Browser'
      }
    },

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: [
      'sauce_chrome',
      'sauce_firefox',
      'sauce_ie',
      'sauce_edge',
      'sauce_safari',
      // Sauce simulators are *very* slow and flaky
      // 'sauce_ios_safari',
      // 'sauce_android',
      // 'sauce_android_4',
    ],

    captureTimeout: 300000,

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,
  });
};
