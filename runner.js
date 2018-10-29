const axios = require('axios');
const createTestCafe = require('testcafe');
let testcafe = null;

const browsers = [
  //  ['browserstack:edge@17.0:Windows 10'],
  ['browserstack:chrome@69.0:Windows 10', 'browserstack:firefox@61.0:Windows 10'],
  ['browserstack:firefox@61.0:OS X High Sierra', 'browserstack:chrome@69.0:OS X High Sierra'],
  ['browserstack:safari@11.1:OS X High Sierra'],
];

const runTest = browser => {
  console.log('starting tests');
  return createTestCafe('localhost', 1337, 1338)
    .then(tc => {
      testcafe = tc;
      const runner = testcafe.createRunner();

      return runner
        .src(['web-tests/*.ts'])
        .browsers(browser)
        .run({
          speed: 0.5
        });
    })
    .then(async failedCount => {
      console.log('Tests failed: ' + failedCount);
      await testcafe.close();
      return {failedCount};
    });
}

const runAllBrowsers = async () => {
  let failedCount = 0;
  for (const browser of browsers) {
    const result = await runTest(browser);
    failedCount += result.failedCount;
  }
  return {failedCount};
}

const runE2ETests = () => {
  axios.get('http://localhost:3000')
    .then(resp => runAllBrowsers())
    .then(result => {
      console.log(`\nTotal Failures: ${result.failedCount}`);
      process.exit(result.failedCount === 0 ? 0 : 2);
    })
    .catch(err => {
      console.log('Please start the site locally before running tests by running "yarn start"');
      process.exit(1);
    });
}

runE2ETests();
