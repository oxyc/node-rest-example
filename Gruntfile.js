var path = require('path');

module.exports = function(grunt) {
  'use strict';
  //
  // Grunt configuration:
  //
  // https://github.com/cowboy/grunt/blob/master/docs/getting_started.md
  //
  grunt.initConfig({

    // headless testing through PhantomJS
    mocha: {
      all: ['test/**/*.html']
    },

    // default lint configuration, change this to match your setup:
    // https://github.com/cowboy/grunt/blob/master/docs/task_lint.md#lint-built-in-task
    lint: {
      options: {
        options: {
          curly: false,
          eqeqeq: true,
          forin: true,
          immed: true,
          indent: 2,
          latedef: false,
          newcap: true,
          noarg: true,
          noempty: true,
          nonew: true,
          regexp: true,
          undef: true,
          unused: false,
          trailing: true,
          sub: true,
          boss: true,
          eqnull: true,
          laxcomma: true,
          laxbreak: true,
          es5: true
        },
        globals: {}
      },
      nodejs: {
        files: { src: ['*.js', 'app/**/*.js', 'bin/*'] },
        options: { globals: { console: true, module: true, require: true, exports: true, process: true } }
      }
    },

    // Build configuration
    // -------------------

    // the staging directory used during the process
    staging: 'temp',
    // final build output
    output: 'dist',

    mkdirs: {
      staging: 'app/'
    },

    server: {
      port: 3501,
      base: '.'
    }
  });

  // Alias the `test` task to run the `mocha` task instead
  grunt.registerTask('test', 'mocha');
  grunt.registerTask('server:docs', 'Launch a server pointing to docs', function() {
    var cb = this.async(),
      opts = {
        port: grunt.config('server.port') || 0xDAD,
        base: path.resolve('.'),
        inject: true,
        target: '.',
        hostname: grunt.config('server.hostname') || 'localhost'
      };

    grunt.helper('server', opts, cb);
    grunt.task.run('watch');
  });
  grunt.registerTask('build', 'intro clean');
};
