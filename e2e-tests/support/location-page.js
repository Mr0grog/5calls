const webdriver = require('selenium-webdriver');
const By = webdriver.By;
const until = webdriver.until;
const config = require('./e2e-tests.config');
const BasePage = require('./base-page');

/**
 * Page object for location-related content.
 *
 */
class LocationPage extends BasePage {
  isInitialized() {
    const locationMessage = By.css('#locationMessage');
    return this.waitForElement(locationMessage,
      'Location message cannot be located')
      .then(() => Promise.resolve(true));
  }

  /**
   * Displays the location text box after clicking
   * on the location button.
   *
   */
  displayLocationInputBox() {
    const selector = By.css('.issues__location button');
    const addressButton = this.waitForElement(selector,
      'Location button not found');
    addressButton.click();
  }

  /**
   * Enters a location into the input text box
   * and submits the location lookup form.
   *
   * @param {string} location the location to submit
   *
   */
  enterAndSubmitNewLocation(location) {
    const inputSelector = By.css('#address');
    const submitSelector = By.css('p > form > button');
    const input = this.waitForElement(inputSelector,
      'Location input text box not found', config.defaultTimeout * 2);
    const submit = this.waitForElement(submitSelector,
      'Location submit button not found');
    this.fillInput(input, location);
    submit.click();
  }

  /**
   * Obtains the element containing the new location
   * text after it has been entered and submitted.
   *
   * @param {string} location the entered location
   * @returns {WebElementPromise} resolves to the new
   * location element
   *
   */
  getNewLocationElement(location) {
    const selector = By.css('#locationMessage');
    // find location message
    const addressMessage = this.waitForElement(selector,
      'Location address not found',
      config.defaultTimeout);
    // make sure message contains the new location text
    this.driver.wait(until.elementTextContains(addressMessage, location),
      config.defaultTimeout, 'New location message not found');
    return addressMessage;
  }


  /**
   * Accessor for the error message used if an
   * unknown address was submitted.
   *
   * @returns {string} the location error message.
   *
   */
  getLocationErrorMessage() {
    const locationErrorMessage = 'That address is invalid, please try again';
    return locationErrorMessage;
  }


}

module.exports = LocationPage;
