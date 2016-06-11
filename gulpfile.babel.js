'use strict';

import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import browserSync from 'browser-sync';
import webpack from 'webpack';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import del from 'del';
import path from 'path';
import fs from 'fs';
import { stream as wiredep } from 'wiredep';

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

gulp.task('pug', () => {
    return gulp.src(['app/_source/pug/**/*.pug', '!app/_source/pug/components/*', '!app/_source/pug/layout/*'])
        .pipe($.plumber())
        .pipe($.data(function(file) {
            let pageData = './app/_source/pug/data/' + path.basename(file.path, '.pug') + '.json';
            if (fs.existsSync(pageData)) {
                return require(pageData);
            } else {
                return require('./app/_source/pug/data/data.json');
            }
        }))
        .pipe($.pug({
            pretty: true
        }))
        .pipe(gulp.dest('app'))
});

gulp.task('compass', () => {
    gulp.src('app/_source/sass/**/*.scss')
        .pipe($.plumber())
        .pipe($.sourcemaps.init())
        .pipe($.compass({
            import_path: ['app/_source/_function'],
            sass: 'app/_source/sass',
            css: 'app/css',
            image: 'app/images',
            sourcemap: true
        }))
        .pipe($.sourcemaps.init({ loadMaps: true }))
        .pipe($.autoprefixer({ browsers: ['> 1%', 'last 2 versions', 'Firefox ESR'] }))
        .on('error', () => {})
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('app/css'))
        .pipe(reload({ stream: true }))
});


gulp.task('server', ['pug', 'compass'], () => {
    browserSync({
        notify: false,
        port: 9000,
        server: {
            baseDir: ['app'],
            index: 'home.html',
            routes: {
                // '/bower_components': 'bower_components'
            }
        }
    });

    gulp.watch([
        'app/**/*.html',
        'app/images/**/*',
    ]).on('change', reload);

    gulp.watch('app/_source/pug/**/*.pug', ['pug'])
    gulp.watch('app/_source/sass/**/*.scss', ['compass'])

});

gulp.task('default', () => {
    return gulp.src('app/js/entry.js')
        .pipe($.webpack({
            watch: true,
            module: {
                loaders: [
                    // { test: /\.css$/, loader: 'style!css' },
                    { test: /\.css$/, loader: ExtractTextPlugin.extract("style-loader", "css-loader") },
                    { test: /\.png$/, loader: "url-loader?mimetype=image/png" }
                ],
            },
            output: {
                filename: 'a.js',
            },
            plugins: [
                new webpack.optimize.UglifyJsPlugin({
                    compress: {
                        warnings: false
                    }
                }),
                new webpack.optimize.OccurenceOrderPlugin(),
                new webpack.optimize.AggressiveMergingPlugin(),
                new webpack.optimize.CommonsChunkPlugin('common.js'),
                new ExtractTextPlugin("css/styles.css")
            ]
        }))
        .pipe(gulp.dest('dist/'));
});

// 帮助说明
gulp.task('help', () => {
    console.log("compass         :sass编译");
});
