const gulp = require('gulp');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const terser = require('gulp-terser');
const streamqueue  = require('streamqueue');

gulp.task('build', function() {
    
    return streamqueue({ objectMode: true },
        gulp.src('./src/*.js'),
        gulp.src('./src/util/**/*.js'),
        gulp.src('./src/first/**/*.js'),
        gulp.src('./src/dom/**/*.js')
    )
        .pipe(concat('emory.js'))
        .pipe(gulp.dest('./dist'))
        .pipe(rename('emory.min.js'))
        .pipe(terser())
        .pipe(gulp.dest('./dist'));
});