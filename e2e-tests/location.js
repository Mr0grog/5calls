/**
 * End-to-end tests for location-related content.
 */
const test = require('selenium-webdriver/testing');
const chai = require('chai');
const expect = chai.expect;
const LocationPage = require('./support/location-page');

test.describe('location lookup', function() {
  let page = undefined;
  test.beforeEach(function() {
    this.driver.get(this.baseUrl);
    page = new LocationPage(this.driver);
  });

  test.it('Should lookup location by zip code', function() {
    const location = '12222';

    // FIXME: should add a way to stub location data so we don't need to wait
    // give the IP lookup a chance to complete;
    //  otherwise it interferes with the location lookup
    this.driver.sleep(5000);

    // click on location to display location input box
    page.displayLocationInputBox();

    // enter location in address text box and submit
    page.enterAndSubmitNewLocation(location);

    // check for location text
    const newLocationText = page.getNewLocationElement(location);
    return expect(newLocationText.getText()).to.eventually.contain(location);
  });

  test.it('Should lookup location by location name', function() {
    const location = 'GARY, IN';

    // give the IP lookup a chance to complete;
    //  otherwise it interferes with the location lookup
    this.driver.sleep(5000);

    // click on location to display location input box
    page.displayLocationInputBox();

    // enter location in address text box and submit
    page.enterAndSubmitNewLocation(location);

    // check for location text
    const newLocationText = page.getNewLocationElement(location);
    return expect(newLocationText.getText()).to.eventually.contain(location);
  });

  test.it('Should show error message if lookup location is invalid', function() {
    const location = 'asdf'; // bogus location
    const expected = page.getLocationErrorMessage();

    // give the IP lookup a chance to complete;
    //  otherwise it interferes with the location lookup
    this.driver.sleep(5000);

    // click on location to display location input box
    page.displayLocationInputBox();

    // enter location in address text box and submit
    page.enterAndSubmitNewLocation(location);

    // check for expected error message
    const newLocationText = page.getNewLocationElement(expected);
    return expect(newLocationText.getText()).to.eventually.equal(expected);
  });

});
