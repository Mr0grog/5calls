const AssertionError = require('assertion-error');

// AssertionError is used by Chai. This is a little bit of a crazy hack
// that allows us to have nice stack traces in PhantomJS. The basic idea
// is that it prevents the stack trace on an error from being modified
// after it's been set the first time (Mocha alters stack traces, which
// causes them not to be usable with source maps).
//
// For the underying issue, see:
// https://github.com/mantoni/mocaccino.js/issues/18
Object.defineProperty(AssertionError.prototype, 'stack', {
  set: function (newStack) {
    Object.defineProperty(this, 'stack', {value: newStack, writable: false});
    return this.stack;
  },
  get: function () {
    return undefined;
  }
});
