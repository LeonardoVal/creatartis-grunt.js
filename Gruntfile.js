/* # creatartis-grunt

Grunt build configuration for @creatartis projects. Copyright (c) 2017 Leonardo Val.
*/
"use strict";

module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		concat: { ////////////////////////////////////////////////////////////////////////////////
			build: {
				options: {
					separator: '\n\n',
					sourceMap: true,
					banner: '',
					footer: ''
				},
				src: ['__prologue__',
						'utils', 'config', 'layout'
					].map(function (name) {
						return 'src/'+ name +'.js';
					}),
				dest: 'build/creatartis-grunt.js'
			},
		},
		copy: { //////////////////////////////////////////////////////////////////////////////////
			build: {
				files: [
					{ nonull: true, src: 'src/bundled/karma-tester.js',
						dest: 'build/karma-tester.js' }
				]
			}
		},
		jshint: { ////////////////////////////////////////////////////////////////////////////////
			build: {
				options: { // Check <http://jshint.com/docs/options/>.
					loopfunc: true,
					boss: true,
					scripturl: true
				},
				src: [
					'build/creatartis-grunt.js',
					'build/karma-tester.js',
					'tests/specs/*.js'
				]
			},
		},
		clean: { /////////////////////////////////////////////////////////////////////////////////
			build: ['build/']
		}
	});

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-jshint');

	grunt.registerTask('build', ['clean:build', 'copy:build', 'concat:build', 'jshint:build']);
	grunt.registerTask('default', ['build']);
};
