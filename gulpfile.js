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
  ;

var SRC = {
  html:    './static/html',
  scss:    './static/scss',
  img:     './static/img',
  js:      './static/js',
  extra:   './static/rootExtra'
};

var DEST = {
  html:'./app/static',
  css: './app/static/css',
  img: './app/static/img',
  js:  './app/static/js'
};

gulp.task('html', function() {
  gulp.src(SRC.html + '/*.html')
    .pipe(gulp.dest(DEST.html));
});

gulp.task('html:watch', function() {
  gulp.watch(`${SRC.html}/*.html`, ['html']);
});

gulp.task('html:serve', function (cb) {
  var server = new http_server.HttpServer({
    root: 'app/static',
    before: [connect_logger()]
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
    transform: [es2040]
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
    transform: [es2040]
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

function runKarmaTests ({singleRun, configFile}) {
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
    const karma = spawn('./node_modules/.bin/karma', karmaArguments, {
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

gulp.task('test', function() {
  return runKarmaTests({singleRun: true});
});

gulp.task('test:watch', function() {
  return runKarmaTests();
});

gulp.task('test:continuous-integration', function() {
  return runKarmaTests({configFile: 'karma.ci.conf.js'});
});

gulp.task('default', ['html', 'html:watch', 'html:serve', 'sass', 'sass:watch', 'copy-images', 'copy-images:watch', 'scripts', 'scripts:watch', 'extra']);
gulp.task('deploy', ['html', 'sass', 'build-scripts', 'extra', 'copy-images']);
