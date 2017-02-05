const chai = require('chai');
const expect = chai.expect;
const jsdom = require('mocha-jsdom');
const storage = require('./localstorage.js');

describe('localstorage module', () => {
    jsdom();

    const doNothing = () => {};

    describe('when quota is low', () => {
        let originalLocalStorage;

        beforeEach(() => {
            const mockStorage = {
                setItem () {
                    throw new Error('QuotaExceededError (DOM Exception 22): The quota has been exceeded.');
                },
                getItem () {},
                removeItem () {},
            };

            originalLocalStorage = window.localStorage;
            window.localStorage = new Proxy(mockStorage, {
                set () {
                    throw new Error('QuotaExceededError (DOM Exception 22): The quota has been exceeded.');
                }
            });
        });

        afterEach(() => {
            window.localStorage = originalLocalStorage;
        });

        it('should not throw when adding items', (done) => {
            storage.add('test', 'test', doNothing);

            // errors *are* returned in the callback, though
            storage.add('test', 'test2', error => {
                expect(error).to.be.ok;
                done();
            });
        });

        it('should not throw when replacing items', (done) => {
            storage.replace('test', 0, 'test', doNothing);

            // errors *are* returned in the callback, though
            storage.replace('test', 0, 'test2', error => {
                expect(error).to.be.ok;
                done();
            });
        });

        it('should not throw when removing items', (done) => {
            storage.add('test', 'test', doNothing);

            // remove callbacks should *not* contain quota errors
            storage.remove('test', error => {
                done(error);
            });
        });

    });

});
