/* # creatartis-grunt

Grunt build configuration for @creatartis projects. Copyright (c) 2017 Leonardo Val.
*/
"use strict";

module.exports = function (grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		concat: { ////////////////////////////////////////////////////////////
			build: {
				options: {
					separator: '\n\n',
					sourceMap: true,
					banner: '',
					footer: ''
				},
				src: ['__prologue__',
						'utils', 'params',
						'config', 'config-requirejs',
						'layout'
					].map(function (name) {
						return 'src/'+ name +'.js';
					}),
				dest: 'build/creatartis-grunt.js'
			},
		},
		copy: { //////////////////////////////////////////////////////////////
			build: {
				files: [
					{ nonull: true, src: 'src/bundled/karma-tester.js',
						dest: 'build/karma-tester.js' }
				]
			}
		},
		jshint: { ////////////////////////////////////////////////////////////
			build: {
				options: { // Check <http://jshint.com/docs/options/>.
					loopfunc: true,
					boss: true,
					scripturl: true,
					esversion: 6
				},
				src: [
					'build/creatartis-grunt.js',
					'build/karma-tester.js',
					'tests/specs/*.js'
				]
			},
		},
		clean: { /////////////////////////////////////////////////////////////
			build: ['build/']
		},
		jsdoc: { /////////////////////////////////////////////////////////////
			build: {
				src: ['src/**/*.js', 'README.md', 'docs/*.md'],
				options: {
					destination: 'docs/jsdoc/',
					configure: 'docs/jsdoc-conf.json'
				}
			}
		}

	});

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-jsdoc');

	grunt.registerTask('build', ['clean:build', 'copy:build', 'concat:build', 'jshint:build']);
	grunt.registerTask('default', ['build', 'jsdoc:build']);
};
