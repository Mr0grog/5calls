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
  , mochaPhantomJS = require('gulp-mocha-phantomjs')
  , through = require('through2')
  , fs = require('fs')
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
  js:  './app/static/js',
  jsTest: './app/test/js'
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

gulp.task('test-scripts', function () {
  const output = gulp.dest(DEST.jsTest);

  const files = [];
  const fileStream = gulp.src(`${SRC.js}/**/*_test.js`, {read: false});
  fileStream
    .on('data', file => files.push(file.path))
    .on('end', () => {
      const b = browserify({
        entries: files,
        debug: true,
        transform: [es2040]
      });

      b.bundle()
        .pipe(source('app-tests.js'))
        .pipe(buffer())
        .pipe(output);
    });

  return output;
});

gulp.task('scripts:watch', function() {
  gulp.watch(`${SRC.js}/**/*.js`, ['scripts']);
});

gulp.task('test-support', function () {
  return gulp.src('./static/test/*').pipe(gulp.dest('./app/test/'));
});

gulp.task('extra', function() {
  gulp.src(SRC.extra + '/*.+(ico|xml|json)')
    .pipe(gulp.dest(DEST.html));
});

gulp.task('test', ['test-support', 'test-scripts'], function() {
  const testPort = 8001;

  const phantomStream = mochaPhantomJS({
    phantomjs: {
      useColors:true
    }
  });

  const testServer = new http_server.HttpServer({
    root: 'app/test',
    before: [
      function (request, response) {
        const safeModulePaths = [
          '/node_modules/mocha/mocha.css',
          '/node_modules/mocha/mocha.js',
          '/node_modules/source-map-support/browser-source-map-support.js',
        ];
        if (safeModulePaths.includes(request.url)) {
          const filePath = `.${request.url}`;
          fs.createReadStream(filePath).pipe(response);
          return;
        }
        response.emit('next');
      }
    ]
  });

  testServer.listen(testPort, function () {
    util.log(`Test server started on port ${testPort}`);

    phantomStream.write({path: `http://localhost:${testPort}/test.html`});
    phantomStream.end();
    phantomStream.on('error', () => testServer.close());
    phantomStream.on('end', () => testServer.close());
  });

  return phantomStream;


  return gulp.src('./app/test/test.html')
      .pipe(mochaPhantomJS({
        phantomjs: {
          useColors:true
        }
      }));
});

gulp.task('default', ['html', 'html:watch', 'html:serve', 'sass', 'sass:watch', 'copy-images', 'copy-images:watch', 'scripts', 'scripts:watch', 'extra']);
gulp.task('deploy', ['html', 'sass', 'build-scripts', 'extra', 'copy-images']);
