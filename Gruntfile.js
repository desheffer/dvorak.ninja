module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);
  require('time-grunt')(grunt);

  // Project configuration.
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

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
          'src/style.css',
        ],
        dest: 'dist/<%= pkg.name %>.css',
      },
      vendorcss: {
        src: [
          'bower_components/bootstrap/dist/css/bootstrap.min.css',
          'bower_components/chartist/dist/chartist.min.css',
        ],
        dest: 'dist/vendor.min.css',
      },
      js: {
        options: {
          banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        },
        src: [
          'src/paragraphs.js',
          'src/app.js',
        ],
        dest: 'dist/<%= pkg.name %>.js',
      },
      vendorjs: {
        src: [
          'bower_components/jquery/dist/jquery.min.js',
          'bower_components/bootstrap/dist/js/bootstrap.min.js',
          'bower_components/chartist/dist/chartist.min.js',
        ],
        dest: 'dist/vendor.min.js',
      },
    },

    cssmin: {
      dist: {
        src: 'dist/<%= pkg.name %>.css',
        dest: 'dist/<%= pkg.name %>.min.css',
      },
    },

    uglify: {
      options: {
        preserveComments: 'some',
      },
      dist: {
        src: 'dist/<%= pkg.name %>.js',
        dest: 'dist/<%= pkg.name %>.min.js',
      },
    },

  });

  grunt.registerTask('build', [
    'clean',
    'copy',
    'concat',
    'cssmin',
    'uglify',
  ]);

  grunt.registerTask('default', ['build']);

};
