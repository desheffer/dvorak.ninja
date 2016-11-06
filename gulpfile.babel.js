import gulp from 'gulp';
import concat from 'gulp-concat';
import eslint from 'gulp-eslint';
import del from 'del';
import webpack from 'webpack-stream';
import webpackConfig from './webpack.config.babel';

const paths = {
    gulpFile: 'gulpfile.babel.js',
    webpackFile: 'webpack.config.babel.js',
    css: [
        'node_modules/bootstrap/dist/css/bootstrap.css',
        'src/css/*.css',
    ],
    vendorjs: [
        'node_modules/jquery/dist/jquery.js',
        'node_modules/bootstrap/dist/js/bootstrap.js',
        'node_modules/firebase/firebase.js',
    ],
    js: 'src/**/*.js?(x)',
    entryPoint: 'src/js/index.jsx',
    distDir: 'dist',
};

gulp.task('lint', () =>
    gulp.src([
        paths.gulpFile,
        paths.webpackFile,
        paths.js,
    ])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError())
);

gulp.task('clean', () => del([
    paths.distDir,
]));

gulp.task('css', () =>
    gulp.src(paths.css)
        .pipe(concat('bundle.css'))
        .pipe(gulp.dest(paths.distDir))
);

gulp.task('js', () =>
    gulp.src(paths.entryPoint)
      .pipe(webpack(webpackConfig))
      .pipe(gulp.dest(paths.distDir))
);

gulp.task('vendorjs', () =>
    gulp.src(paths.vendorjs)
        .pipe(concat('vendor.js'))
        .pipe(gulp.dest(paths.distDir))
);

gulp.task('build', ['lint', 'clean', 'css', 'js', 'vendorjs']);

gulp.task('watch', ['build'], () => {
    gulp.watch(paths.css, ['css']);
    gulp.watch(paths.js, ['js']);
});

gulp.task('default', ['build']);
