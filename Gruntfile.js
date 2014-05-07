module.exports = function(grunt) {
  // Load Grunt tasks declared in the package.json file
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);
  var srcCss = [
        'lib/bootstrap/bootstrap.css',
        'bower_components/Bootflat/bootflat/css/bootflat.css',
        'bower_components/bootstrap-jasny/dist/extend/css/jasny-bootstrap.css',
        'lib/font-awesome/css/font-awesome.css',
        'lib/selectize/selectize.css',
        'lib/ladda-bootstrap/ladda-themeless.css',
        'lib/messenger/messenger.css',
        'lib/messenger/messenger-theme-future.css',
        'lib/typeahead-css/typeaheadjs.css',
        'bower_components/iCheck/skins/line/aero.css',
        'lib/keyboard/keyboard.css',
        'lib/jquery-ui-bootstrap/css/custom-theme/jquery-ui-1.10.0.custom.css',
        'assets/css/custom.css'
      ],
      srcJs = [
        'lib/jquery/jquery.js',
        'lib/handlebars/handlebars.js',
        'lib/swag/swag.js',
        'lib/underscore/underscore.js',
        'lib/bootstrap/bootstrap.js',
        'bower_components/bootstrap-jasny/dist/extend/js/jasny-bootstrap.js',
        'lib/backbone/backbone.js',
        'lib/backbone.wreqr/backbone.wreqr.js',
        'lib/backbone.babysitter/backbone.babysitter.js',
        'lib/backbone.supermodel/backbone.supermodel.js',
        'bower_components/marionette/lib/core/backbone.marionette.js',
        'lib/backbone.marionette.handlebars/backbone.marionette.handlebars.js',
        'lib/moment/moment.js',
        'lib/messenger/messenger.js',
        'lib/messenger/messenger-theme-future.js',
        'lib/typeahead.js/typeahead.bundle.js',
        'bower_components/iCheck/icheck.js',
        'lib/jquery-ui/jquery-ui.js',
        'lib/keyboard/jquery.keyboard.js',
        'bower_components/keyboard/js/jquery.keyboard.extension-all.js',
        'lib/fixed-header-table/jquery.fixedheadertable.js',
        'lib/backbone.bootstrap-modal/src/backbone.bootstrap-modal.js',
      ];
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    bower: {
      install: {
        options: {
          targetDir: './lib',
          layout: 'byType',
          install: true,
          verbose: false,
          cleanTargetDir: true,
          cleanBowerDir: false
        }
      }
    },
    jshint: {
      all: ['Gruntfile.js', 'assets/js/**/*.js'],
      server: ['server.js', 'routes/index.js']
    },
    uglify: {
      options: {
        beautify: true,
        mangle: false
      },
      vendors: {
        options: {
          sourceMap: 'public/js/vendors.min.map'
        },
        files: {
          'public/js/vendors.min.js': srcJs
        }
      },
      app: {
        options: {
          sourceMap: 'public/js/app.min.map'
        },
        files: {
          'public/js/app.min.js': [
            'assets/js/**/*.js'
          ]
        }
      }
    },
    cssmin: {
      combine: {
        files: {
          'public/css/app.css': srcCss
        }
      }
    },
    concat: {
      options: {
        stripBanners: true,
        banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
          '<%= grunt.template.today("yyyy-mm-dd") %> */',
      },
      css: {
        src: srcCss,
        dest: 'public/css/app.css',
      },
      app: {
        src: [
          'assets/js/**/*.js'
        ],
        dest: 'public/js/app.min.js',
      },
      jsDev: {
        src: srcJs,
        dest: 'public/js/vendors.min.js',
      },
    },
    copy: {
      main: {
        files: [
          {
            expand: true,
            flatten: true,
            src: [
              'lib/bootstrap/*.svg',
              'lib/bootstrap/*.eot',
              'lib/bootstrap/*.ttf',
              'lib/bootstrap/*.woff',
              'lib/font-awesome/fonts/*',
            ],
            dest: 'public/fonts/',
            filter: 'isFile'
          },

          {
            expand: true,
            flatten: true,
            src: [
              'lib/font-awesome/css/*.css'
            ],
            dest: 'public/css/',
            filter: 'isFile'
          },

          {
            expand: true,
            flatten: true,
            src: [
              'bower_components/iCheck/skins/line/*.png'
            ],
            dest: 'public/css/',
            filter: 'isFile'
          },

        ]
      }
    },
    handlebars: {
      compile: {
        options: {
          namespace: "Templates",
          processName: function(filePath) { // input:  templates/_header.hbs
            var pieces = filePath.split("/");
            return pieces[pieces.length - 1].split(".")[0]; // output: _header.hbs
          },
          compilerOptions: {
            knownHelpers: {
              "ul": true
            }
          }
        },
        files: {
          "public/js/templates.js": ["assets/templates/*.html"]
        }
      }
    },
    watch: {
      grunt: {
        files: ['Gruntfile.js'],
        tasks: ['build', 'express:dev', 'watch'],
        options: {
          spawn: true,
        },
      },
      scripts: {
        files: ['assets/js/**/*.js'],
        tasks: ['jshint:all', 'concat:app'],
        options: {
          spawn: true,
        },
      },
      express: {
        files: ['server.js', 'routes/index.js', 'io-routes/index.js'],
        tasks: ['jshint:server', 'express:dev'],
        options: {
          nospawn: true //Without this option specified express won't be reloaded
        }
      },
      css: {
        files: ['assets/css/*.css'],
        tasks: ['concat:css'],
        options: {
          spawn: true,
        },
      },
      templates: {
        files: ['assets/templates/*.html'],
        tasks: ['handlebars'],
        options: {
          spawn: true,
        },
      },
      data: {
        files: ['assets/data/*.json'],
        tasks: ['json:data'],
        options: {
          spawn: true,
        },
      }
    },
    express: {
      options: {
        debug: true
        // Override defaults here
      },
      dev: {
        options: {
          script: 'server.js'
        }
      }
    },
    'node-inspector': {
      default: {}
    },
    json: {
      data: {
        options: {
          namespace: 'Data',
          includePath: true,
          processName: function(filename) {
            var _name = filename.split("/"),
                len = _name.length-1,
                name = _name[len].split(".")[0];
            return name.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
          }
        },
        src: ['assets/data/**/*.json'],
        dest: 'public/js/json.js'
      }
    }
  });

  grunt.registerTask('build', [
    'bower:install',
    'jshint:server',
    'jshint:all',
    'uglify',
    'cssmin',
    'copy',
    'handlebars',
    'json:data'
  ]);

  grunt.registerTask('build-dev', [
    'bower:install',
    'jshint:server',
    'jshint:all',
    'concat',
    'copy',
    'handlebars',
    'json:data'
  ]);

  grunt.event.on('watch', function(action, filepath, target) {
    grunt.log.writeln(target + ': ' + filepath + ' has ' + action);
  });

  grunt.registerTask('server', [ 'build-dev', 'express:dev', 'watch' ]);

  // Default task(s).
  grunt.registerTask('default', ['build']);

};
