const { src, dest, task, watch, series, parallel } = require('gulp');
const del = require('del');
const browserSync = require('browser-sync').create();
const sass = require('gulp-sass')(require('sass'));
const concat = require('gulp-concat');
const imagemin = require('gulp-imagemin');
const postcss = require('gulp-postcss');
const uglify = require('gulp-terser');
const cleanCSS = require('gulp-clean-css');
const purgecss = require('gulp-purgecss');
const autoprefixer = require('gulp-autoprefixer');
const logSymbols = require('log-symbols'); 

// load preview
function livePreview(done) {
    browserSync.init({
        server: {
            baseDir: './dist'
        },
        port: 9050 || 5000
    });
    done();
}

// trigger reload
function previewReload(done) {
    console.log("\n\t" + logSymbols.info, "Reloading Browser Preview.\n");
    browserSync.reload();
    done();
}

// Dev tasks
function devHTML() {
    return src('./src/**/*.html')
        .pipe(dest('./dist'));
}

function devStyles() {
    const tailwindcss = require('tailwindcss');
    return src('./src/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(dest('./src/css'))
        .pipe(postcss([
            tailwindcss('./tailwind.config.js'),
            require('autoprefixer'),
        ]))
        .pipe(concat({ path: 'main.css'}))
        .pipe(autoprefixer({
            browsers: ['last 99 versions'],
            cascade: false
        }))
        .pipe(dest('./dist/assets/css'));
}

function devScripts() {
    return src('./src/**/*.js')
        .pipe(concat({ path: 'scripts.js'}))
        .pipe(dest('./dist/assets/js'));
}

function devImages() {
    return src('./src/assets/images/**/*')
        .pipe(dest('./dist/assets/images'));
}

function watchFiles() {
    watch('./src/**/*.html', series(devHTML, devStyles, previewReload));
    watch(['./tailwind.config.js', './src/assets/css/**/*.scss'], series(devStyles, previewReload));
    watch('./src/assets/js/**/*.js', series(devScripts, previewReload));
    watch('./src/assets/images/**/*', series(devImages, previewReload));
    console.log("\n\t" + logSymbols.info,"Watching for Changes..\n");
}

function devClean() {
    console.log("\n\t" + logSymbols.info,"Cleaning dist folder for fresh start.\n");
    return del('./dist');
}

// Prod tasks
function prodHTML() {
    return src('./src/**/*.html')
        .pipe(dest('./public'));
}

function prodStyles() {
    return src('./dist/css/**/*')
        .pipe(purgecss({
            content: ['src/**/*.{html,js}'],
            defaultExtractor: content => {
                const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || []
                const innerMatches = content.match(/[^<>"'`\s.()]*[^<>"'`\s.():]/g) || []
                return broadMatches.concat(innerMatches)
            }
        }))
        .pipe(cleanCSS({ compatibility: 'ie8'}))
        .pipe(dest('./public/assets/css'));
}

function prodScripts() {
    return src('./src/assets/js/**/*.js')
        .pipe(concat({ path: 'scripts.js' }))
        .pipe(uglify())
        .pipe(dest('./public/assets/js'));
}

function prodImages() {
    return src('./src/assets/images/**/*')
        .pipe(imagemin())
        .pipe(dest('./public/assets/images'));
}

function prodClean() {
    console.log("\n\t" + logSymbols.info,"Cleaning build folder for fresh start.\n");
    return del('./public');
}

exports.default = series(
    devClean, // clean out folder
    parallel(devStyles, devScripts, devImages, devHTML),
    livePreview,
    watchFiles
);

exports.prod = series(
    prodClean,
    parallel(prodStyles, prodScripts, prodImages, prodHTML)
);