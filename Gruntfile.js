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
          'src/js/SocialBox.js',
          'src/js/StatsBox.js',
          'src/js/TypeBox.js',
          'src/js/config.js',
          'src/js/app.js',
        ],
        dest: 'dist/<%= pkg.name %>.js',
      },
      vendorjs: {
        src: [
          'bower_components/jquery/dist/jquery.min.js',
          'bower_components/bootstrap/dist/js/bootstrap.min.js',
          'bower_components/firebase/firebase.js',
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
    'concat',
    'cssmin',
    'uglify',
  ]);

  grunt.registerTask('default', ['build']);
};
