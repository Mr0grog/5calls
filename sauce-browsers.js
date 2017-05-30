// Browser configurations for testing in Sauce Labs
// For values, use the Platform Configurator:
// https://wiki.saucelabs.com/display/DOCS/Platform+Configurator
module.exports = {
  // Just the latest versions for evergreen browsers
  Chrome: {
    browserName: 'chrome',
    platform: 'Windows 10',
    version: 'latest'
  },
  Firefox: {
    browserName: 'firefox',
    version: 'latest'
  },
  Edge: {
    browserName: 'MicrosoftEdge',
    platform: 'Windows 10',
    version: 'latest'
  },
  
  // Cover the latest two versions of IE on Windows 7 and 10
  IE: {
    browserName: 'internet explorer',
    platform: 'Windows 10',
    version: 'latest'
  },
  'IE 11 / Windows 7': {
    browserName: 'internet explorer',
    platform: 'Windows 7',
    version: '11.0'
  },
  'IE 10 / Windows 7': {
    browserName: 'internet explorer',
    platform: 'Windows 7',
    version: '10.0'
  },
  
  // Latest two Safaris
  Safari: {
    browserName: 'Safari',
    version: 'latest'
  },
  'Safari 9': {
    browserName: 'Safari',
    platform: 'OS X 10.11',
    version: '9.0'
  },

  // Disable device simulators for now as they are slow and flakey :\
  // sauce_ios_safari: {
  //   deviceName: 'iPhone 7 Simulator',
  //   deviceOrientation: 'portrait',
  //   platformVersion: '10.0',
  //   platformName: 'iOS',
  //   browserName: 'Safari'
  // },
  // sauce_android: {
  //   deviceName: 'Android Emulator',
  //   deviceOrientation: 'portrait',
  //   platformVersion: '5.1',
  //   platformName: 'Android',
  //   browserName: 'Browser'
  // },
  // sauce_android_4: {
  //   deviceName: 'Android Emulator',
  //   deviceOrientation: 'portrait',
  //   platformVersion: '4.4',
  //   platformName: 'Android',
  //   browserName: 'Browser'
  // }
};
