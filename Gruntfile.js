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
				src: ['src/__prologue__.js', 'src/utils.js', 'src/config.js'],
				dest: 'build/<%= pkg.name %>.js'
			},
		},
		jshint: { ////////////////////////////////////////////////////////////////////////////////
			build: {
				options: { // Check <http://jshint.com/docs/options/>.
					loopfunc: true,
					boss: true
				},
				src: ['build/<%= pkg.name %>.js', 'tests/specs/*.js'],
			},
		},
		clean: { /////////////////////////////////////////////////////////////////////////////////
			build: ['build/']
		}
	});

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-jshint');

	grunt.registerTask('build', ['clean:build', 'concat:build', 'jshint:build']);
	grunt.registerTask('default', ['build']);
};
