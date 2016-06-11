'use strict';

import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import browserSync from 'browser-sync';
import cleancss from 'gulp-clean-css';
import webpack from 'webpack';
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

gulp.task('pug:build', () => {
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
        .pipe(gulp.dest('dist'))
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

gulp.task('compass:build', () => {
    gulp.src('app/_source/sass/**/*.scss')
        .pipe($.plumber())
        .pipe($.compass({
            import_path: ['app/_source/_function'],
            sass: 'app/_source/sass',
            css: 'app/css',
            image: 'app/images'
        }))
        .pipe($.autoprefixer({ browsers: ['> 1%', 'last 2 versions', 'Firefox ESR'] }))
        .pipe(cleancss({
        	compatibility: 'ie8'
        }))
        .pipe(gulp.dest('dist/css'))
});

gulp.task('script', () => {
    return gulp.src('app/js/entry.js')
        .pipe($.webpack({
            module: {
                loaders: [
                    { test: /\.css$/, loader: 'style!css' },
                    { test: /\.png$/, loader: "url-loader?mimetype=image/png" }
                ],
            },
            output: {
                filename: 'output.js',
            },
            plugins: [
                new webpack.optimize.UglifyJsPlugin({
                    compress: {
                        warnings: false
                    }
                }),
                new webpack.optimize.OccurenceOrderPlugin(),
                new webpack.optimize.AggressiveMergingPlugin(),
                // new webpack.optimize.CommonsChunkPlugin('common.js'),
            ]
        }))
        .pipe(gulp.dest('app/js/'));
});

gulp.task('script:build', () => {
    return gulp.src('app/js/entry.js')
        .pipe($.webpack({
            module: {
                loaders: [
                    { test: /\.css$/, loader: 'style!css' },
                    { test: /\.png$/, loader: "url-loader?mimetype=image/png" }
                ],
            },
            output: {
                filename: 'output.js',
            },
            plugins: [
                new webpack.optimize.UglifyJsPlugin({
                    compress: {
                        warnings: false
                    }
                }),
                new webpack.optimize.OccurenceOrderPlugin(),
                new webpack.optimize.AggressiveMergingPlugin(),
                // new webpack.optimize.CommonsChunkPlugin('common.js'),
            ]
        }))
        .pipe(gulp.dest('dist/js/'));
});

gulp.task('imagemin', () => {
    return gulp.src('app/images/**/*')
        .pipe($.imagemin({
            progressive: true
        }))
        .pipe(gulp.dest('dist/images/'))
});

gulp.task('server', ['pug', 'compass', 'script'], () => {
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
        'app/js/**/*'
    ]).on('change', reload);

    gulp.watch('app/_source/pug/**/*.pug', ['pug'])
    gulp.watch('app/_source/sass/**/*.scss', ['compass'])
    gulp.watch('app/js/**/*.js', ['script'])

});

gulp.task('clean', del.bind(null, ['dist']));

gulp.task('build', ['pug:build', 'compass:build', 'imagemin', 'script:build'])

gulp.task('default', ['clean'],() => {
    gulp.start('build')
});

// 帮助说明
gulp.task('help', () => {
    console.log("clean             :清空dist目录");
    console.log("compass           :sass编译");
    console.log("imagemin          :图片压缩");
    console.log("pug               :pug编译");
    console.log("script            :js编译");
    console.log("server            :开发模式 开启实时监听");
    console.log("不加参数           :生产模式 打包压缩文件到dist目录");

});
