/* eslint no-console: "off" */
'use strict';

var gulp = require('gulp')
  , sass = require('gulp-sass')
  , autoprefixer = require('gulp-autoprefixer')
  , imagemin = require('gulp-imagemin')
  , util = require('gulp-util')
  , browserify = require('browserify')
  , es2040 = require('es2040')
  , buffer = require('vinyl-buffer')
  , source = require('vinyl-source-stream')
  , uglify = require('gulp-uglify')
  , http_server = require('http-server')
  , connect_logger = require('connect-logger')
  , spawn = require('child_process').spawn
  , mocha = require('gulp-mocha')
  , path = require('path')
  , sauceConnectLauncher = require('sauce-connect-launcher')
  , stream = require('stream')
  , streamArray = require('stream-array')
  ;

var SRC = {
  html:    './static/html',
  scss:    './static/scss',
  img:     './static/img',
  js:      './static/js',
  extra:   './static/rootExtra',
  locales: './static/locales'
};

var DEST = {
  html:'./app/static',
  css: './app/static/css',
  img: './app/static/img',
  js:  './app/static/js',
  locales: './app/static/locales'
};

gulp.task('html', function() {
  gulp.src(SRC.html + '/*.html')
    .pipe(gulp.dest(DEST.html));
});

gulp.task('html:watch', function() {
  gulp.watch(`${SRC.html}/*.html`, ['html']);
});

gulp.task('html:serve', function (cb) {

  function alwaysServeIndex(req, res, next) {

    // Allow the development server to respond to URLs defined in the front end application.
    // Assume that any URL without a file extension can be handled by the client side code
    // and serve index.html (instead of 404).

    if(!(path.extname(req.url))) {
      req.url = "/";
    }
    next();
  }

  var server = new http_server.HttpServer({
    root: 'app/static',
    before: [connect_logger(), alwaysServeIndex]
  });
  server.listen(8000, function () {
    util.log('HTTP server started on port 8000');
    cb();
  });
});

// Compile Sass into CSS
gulp.task('sass', function() {
  gulp.src(`${SRC.scss}/*.scss`)
    .pipe(sass({
      outputStyle: 'compressed'
    }).on('error', sass.logError))
    .pipe(autoprefixer('last 2 version'))
    .pipe(gulp.dest(DEST.css));
});

gulp.task('sass:watch', function() {
  gulp.watch(`${SRC.scss}/**/*.scss`, ['sass']);
});

// Copy/minify image assets
gulp.task('copy-images', function() {
  gulp.src(SRC.img + '/**/*.+(png|jpg|jpeg|gif|svg)')
    .pipe(imagemin())
    .pipe(gulp.dest(DEST.img));
});

gulp.task('copy-images:watch', function() {
  gulp.watch(SRC.img + '/**/*.+(png|jpg|jpeg|gif|svg)');
});

// Bundle and transpile javascript
gulp.task('scripts', function() {
  var b = browserify({
    entries: `${SRC.js}/main.js`,
    debug: true,
    transform: [[es2040, {global: true}]]
  });

  return b.bundle()
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(gulp.dest(DEST.js));
});

gulp.task('build-scripts', function() {
  var b = browserify({
    entries: `${SRC.js}/main.js`,
    debug: false,
    transform: [[es2040, {global: true}]]
  });

  return b.bundle()
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest(DEST.js));
});

gulp.task('scripts:watch', function() {
  gulp.watch(`${SRC.js}/**/*.js`, ['scripts']);
});

gulp.task('extra', function() {
  gulp.src(SRC.extra + '/*.+(ico|xml|json)')
    .pipe(gulp.dest(DEST.html));
});

gulp.task('locales', function() {
  gulp.src(SRC.locales + '/*.json')
    .pipe(gulp.dest(DEST.locales));
});

function runKarmaTests ({singleRun, configFile} = {}) {
  return new Promise((resolve, reject) => {
    const karmaArguments = ['start'];

    if (configFile) {
      karmaArguments.push(configFile);
    }

    if (singleRun) {
      karmaArguments.push('--single-run');
    }

    // Karma has a nice public API, but has issues where it can hang when
    // trying to shut down after completing tests, so run it as a separate
    // process instead. See:
    // https://github.com/karma-runner/karma/issues/1693
    // https://github.com/karma-runner/karma/issues/1035
    
    const karma = spawn(path.join(__dirname, 'node_modules', '.bin', 'karma'), karmaArguments, {
      shell: true,
      cwd: __dirname,
      stdio: 'inherit'
    });

    karma.on('close', code => {
      if (code) {
        reject(new util.PluginError('Karma', `JS unit tests failed (code ${code})`));
        return;
      }
      resolve();
    });
  });
}

function runE2ETests (options = {}) {
  const mochaOptions = Object.assign({
    reporter: 'spec',
    timeout: 20000
  }, options.mocha);

  if (process.argv.includes('--grep')) {
    const grepValue = process.argv[process.argv.indexOf('--grep') + 1];
    mochaOptions.grep = new RegExp(grepValue);
  }

  return gulp.src([
    options.setup || './e2e-tests/support/setupEndToEndTests.js',
    './e2e-tests/{*,!(support)/*}.js'
  ])
    .pipe(mocha(mochaOptions));
}

gulp.task('test:js-unit', function() {
  return runKarmaTests({singleRun: true});
});

gulp.task('test:watch', function() {
  return runKarmaTests({singleRun: false});
});

/**
 * Task that runs selenium webdriverjs end-to-end tests.
 *
 * Individual e2e tests can be run using the --grep argument
 * with a substring of the name of the test's describe block.
 * Example:
 * gulp test:e2e --grep 'from issue page'
 */
gulp.task('test:e2e', function() {
  return runE2ETests();
});

gulp.task('test:e2e:ci', function() {
  return inSauceTunnel({port: process.env.SAUCE_PORT}, () => {
    util.log('Sauce Connect Tunnel Running');
    
    const errors = [];
    return streamArray(['Chrome', 'Firefox'])
      // TODO: it would be nice to find a way to run these tests in parallel,
      // but unfortunately gulp-mocha outputs directly to stdout (in which case
      // we get confusing, interleaved output from simultaneous tests) or does
      // not stream at all and returns separate stdout and stderr strings (in
      // which case we get confusing, *non*-interleaved stdout and stderr).
      .pipe(new stream.Transform({
        objectMode: true,
        transform (browser, encoding, callback) {
          console.log(`Testing in ${browser} -----------------------------`);
          
          let completed = false;
          process.env.CI_BROWSER = browser;
          runE2ETests({
            setup: './e2e-tests/support/setupEndToEndCiTests.js',
            mocha: {
              // setting up the initial connection to Sauce Labs can be slow
              timeout: 30000
            }
          })
            .on('error', () => {
              errors.push(browser);
              completed = true;
              callback();
            })
            .on('end', () => {
              if (!completed) {
                completed = true;
                callback();
              }
            })
            .resume();
        },
        flush (callback) {
          if (errors.length) {
            const count = errors.length;
            const pluralized = `${count} browser${count > 1 ? 's' : ''}`;
            const message = `Errors in ${pluralized}: ${errors.join(', ')}.`;
            this.emit('error', new util.PluginError('E2E Tests', message));
          }
          callback();
        }
      }));
  });
});

// Designed for running tests in continuous integration. The main difference
// here is that browser tests are run across a gamut of browsers/platforms via
// Sauce Labs instead of just a few locally.
gulp.task('test:ci', ['eslint'], function() {
  return runKarmaTests({configFile: 'karma.ci.conf.js'});
});

gulp.task('eslint', function() {
  const eslint = require('eslint');
  const linter = new eslint.CLIEngine();
  const report = linter.executeOnFiles(['./']);

  // customize messages to be a little more helpful/friendly
  report.results.forEach(result => {
    result.messages.forEach(message => {
      if (message.ruleId === 'no-console') {
        message.message = 'Please use the `loglevel` module for logging instead of the browser `console` object';
      }
    });
  });

  process.stdout.write(linter.getFormatter()(report.results));
  if (report.errorCount) {
    throw new util.PluginError('ESLint', 'Found problems with JS coding style.');
  }
});

gulp.task('test', ['eslint', 'test:js-unit']);

gulp.task('default', ['html', 'html:watch', 'html:serve', 'sass', 'sass:watch', 'copy-images', 'copy-images:watch', 'scripts', 'scripts:watch', 'extra', 'locales']);
gulp.task('deploy', ['html', 'sass', 'build-scripts', 'extra', 'copy-images', 'locales']);


// Utilities ----------------------------------------------

/**
 * Open a Sauce Connect tunnel, run an (async) operation, and close the tunnel
 * when complete.
 * 
 * @param {any} [options] Options for configuring the Sauce Connect tunnel
 * @param {Function} tunneledOperation The operation to perform with the tunnel
 *        open. Should return a promise or stream.
 * @returns {ReadableStream}
 */
function inSauceTunnel (options, tunneledOperation) {
  if (arguments.length === 1) {
    tunneledOperation = options;
    options = {};
  }
  
  const outputStream = new stream.PassThrough({objectMode: true});
  const complete = error => {
    if (error) { outputStream.emit('error', error) }
    outputStream.end();
  };
  
  sauceConnectLauncher(options, (error, tunnel) => {
    if (error) {
      return complete(error);
    }
    
    streamValue(tunneledOperation(tunnel))
      .on('error', error => {
        tunnel.close(closeError => complete(error || closeError));
      })
      .on('end', () => tunnel.close(complete))
      // do not auto-end -- we want to wait for the tunnel to close first
      .pipe(outputStream, {end: false});
  });
  
  return outputStream;
}

/**
 * Convert a promise, single value, or stream into a stream.
 * 
 * @param {any} value Value to convert into a stream
 * @returns {ReadableStream}
 */
function streamValue (value) {
  if (value instanceof stream.Stream) {
    return value;
  }
  
  return new stream.Readable({
    objectMode: true,
    read () {
      if (value.then) {
        value
          .then(result => (this.push(result), this.push(null)))
          .catch(error => this.emit('error', error));
      }
      else {
        this.push(value);
        this.push(null);
      }
    }
  });
}
