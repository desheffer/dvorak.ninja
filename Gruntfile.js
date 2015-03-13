module.exports = function(grunt) {
  'use strict';

  require('load-grunt-tasks')(grunt);
  require('time-grunt')(grunt);

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      options: {
        jshintrc: '.jshintrc',
      },
      all: [
        'Gruntfile.js',
        'src/**/*.js',
      ],
    },

    clean: {
      dist: {
        files: [{
          expand: true,
          dot: true,
          src: [
            'dist/**/*',
          ],
        }],
      },
    },

    copy: {
      dist: {
        files: [{
          expand: true,
          cwd: 'bower_components/chartist/dist',
          src: [
            'chartist.min.js.map',
          ],
          dest: 'dist/',
        }],
      },
    },

    concat: {
      css: {
        options: {
          banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        },
        src: [
          'src/css/style.css',
        ],
        dest: 'dist/<%= pkg.name %>.css',
      },
      vendorcss: {
        src: [
          'bower_components/bootstrap/dist/css/bootstrap.min.css',
          'bower_components/chartist/dist/chartist.min.css',
          'bower_components/vex/css/vex.css',
          'bower_components/vex/css/vex-theme-default.css',
        ],
        dest: 'dist/vendor.css',
      },
      js: {
        options: {
          banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        },
        src: [
          'src/js/Game.js',
          'src/js/Input.js',
          'src/js/KeyboardMapper.js',
          'src/js/LayoutBox.js',
          'src/js/ParaBox.js',
          'src/js/ScoreCard.js',
          'src/js/StatsBox.js',
          'src/js/TypeBox.js',
          'src/js/paragraphs.js',
          'src/js/app.js',
        ],
        dest: 'dist/<%= pkg.name %>.js',
      },
      vendorjs: {
        src: [
          'bower_components/jquery/dist/jquery.min.js',
          'bower_components/bootstrap/dist/js/bootstrap.min.js',
          'bower_components/chartist/dist/chartist.min.js',
          'bower_components/vex/js/vex.min.js',
        ],
        dest: 'dist/vendor.js',
      },
    },

    cssmin: {
      css: {
        src: 'dist/<%= pkg.name %>.css',
        dest: 'dist/<%= pkg.name %>.min.css',
      },
      vendorcss: {
        src: 'dist/vendor.css',
        dest: 'dist/vendor.min.css',
      },
    },

    uglify: {
      options: {
        preserveComments: 'some',
      },
      js: {
        src: 'dist/<%= pkg.name %>.js',
        dest: 'dist/<%= pkg.name %>.min.js',
      },
      vendorjs: {
        src: 'dist/vendor.js',
        dest: 'dist/vendor.min.js',
      },
    },

  });

  grunt.registerTask('build', [
    'jshint',
    'clean',
    'copy',
    'concat',
    'cssmin',
    'uglify',
  ]);

  grunt.registerTask('default', ['build']);

};
