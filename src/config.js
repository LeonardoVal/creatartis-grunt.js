/**TODO
*/

/** Configuration parameters' default values.
*/
var DEFAULTS = {
	build: 'build/',
	test: 'tests/',
	docs: 'docs/',

	separator: '\n\n',
	sourceMap: true,
	wrapper: 'umd',
	jshint: {
		loopfunc: true,
		boss: true
	}
};

/** ## Configurate `clean` #########################################################################

The `clean` task is used to delete all files in the build folder (`build/`).
*/
var config_clean = exports.config_clean = function config_clean(grunt, params) {
	params = Object.assign({
		build: DEFAULTS.build
	}, params);

	grunt.config.merge({
		clean: {
			build: [params.build]
		}
	});
	if (!grunt.task.exists('clean')) {
		grunt.loadNpmTasks('grunt-contrib-clean');
	}
};

/** ## Configurate `concat` ########################################################################

The source files of the project (in the `src/` folder) are concatenated into one module. The plugin
`grunt-contrib-concat` can also generate source map files, that are very useful for debugging.
*/
var config_concat = exports.config_concat = function config_concat(grunt, params) {
	params = Object.assign({
		build: DEFAULTS.build,
		separator: DEFAULTS.separator,
		sourceMap: DEFAULTS.sourceMap,
		wrapper: DEFAULTS.wrapper
	}, params);

	grunt.config.merge({
		concat: {
			build: {
				options: {
					//FIXME banner: '('+ UMDWrapper +').call(this,',
					//footer: ');',
					separator: params.separator,
					sourceMap: params.sourceMap
				},
				src: params.src,
				dest: params.build +'<%= pkg.name %>.js'
			},
		}
	});
	if (!grunt.task.exists('concat')) {
		grunt.loadNpmTasks('grunt-contrib-concat');
	}
};

/** ## Configurate `jshint` ########################################################################

Checking the code is imperative in Javascript. The plugin `grunt-contrib-jshint` is used to lint the
concatenated code, and also the scripts for the test cases.
*/
var config_jshint = exports.config_jshint = function config_jshint(grunt, params) {
	var options = Object.assign({ // Check <http://jshint.com/docs/options/>.
		loopfunc: true,
		boss: true
	}, params && params.jshint); //FIXME test path

	grunt.config.merge({
		jshint: {
			build: {
				options: options,
				src: ['build/<%= pkg.name %>.js', 'tests/specs/*.js'],
			},
		}
	});
	if (!grunt.task.exists('jshint')) {
		grunt.loadNpmTasks('grunt-contrib-jshint');
	}
};

/** ## Configurate `uglify` ########################################################################

The plugin `grunt-contrib-uglify` is used to minimize the concatenated code. It also can generate
source maps.
*/
var config_uglify = exports.config_uglify = function config_uglify(grunt, params) {
	params = Object.assign({
		build: DEFAULTS.build,
		sourceMap: DEFAULTS.sourceMap
	}, params);

	grunt.config.merge({
		uglify: {
			build: {
				src: params.build +'<%= pkg.name %>.js',
				dest: params.build +'<%= pkg.name %>.min.js',
				options: {
					banner: '//! <%= pkg.name %> <%= pkg.version %>\n',
					report: 'min',
					sourceMap: params.sourceMap,
					sourceMapIn: params.build +'<%= pkg.name %>.js.map',
					sourceMapName: params.build +'<%= pkg.name %>.min.js.map'
				}
			}
		}
	});
	if (!grunt.task.exists('uglify')) {
		grunt.loadNpmTasks('grunt-contrib-uglify');
	}
};

/** ## Configurate `copy` ##########################################################################

For testing the library, the built module and its dependencies are copied in the `tests/lib` folder.
This makes it easier to run the test cases, but also to create HTML pages for debugging.
*/
var config_copy = exports.config_copy = function config_copy(grunt, params) {
	params = Object.assign({
		build: DEFAULTS.build,
		test: DEFAULTS.test,
		sourceMap: DEFAULTS.sourceMap
	}, params);

	var files = [
			DEFAULTS.build +'<%= pkg.name %>.js',
			DEFAULTS.build +'<%= pkg.name %>.js.map',
			'node_modules/requirejs/require.js'
		];
	params.deps.forEach(function (dep) {
		files.push(dep.path);
		if (dep.sourceMap) {
			files.push(dep.sourceMap);
		}
	});

	grunt.config.merge({
		copy: {
			build: {
				files: files.map(function (f) {
					return { nonull: true, src: f, dest: DEFAULTS.test +'lib/'+ path.basename(f) };
				})
			}
		},
	});
	if (!grunt.task.exists('copy')) {
		grunt.loadNpmTasks('grunt-contrib-copy');
	}
};

/** ## Configurate `karma` #########################################################################

Karma is a framework that automates web browsers to run test cases. It is a little hard to configure
properly, but is very useful.
*/
var config_karma = exports.config_karma = function config_karma(grunt, params) {
	params = Object.assign({
		test: DEFAULTS.test,
		sourceMap: DEFAULTS.sourceMap,
		browsers: ['Firefox']
	}, params);

	var pkgName = grunt.config('pkg.name'),
		karma = {
			options: {
				frameworks: ['jasmine', 'requirejs'], // See: https://npmjs.org/browse/keyword/karma-adapter
				preprocessors: {},
			     files: [
					params.test +'karma-tester.js',
					{pattern: params.test +'specs/*.test.js', included: false},
					{pattern: params.test +'lib/'+ pkgName +'.js', included: false}
			     ],
			     exclude: [],
			     reporters: ['progress'], // https://npmjs.org/browse/keyword/karma-reporter
				port: 9876,
				colors: true,
			     logLevel: 'INFO',
			     autoWatch: false,
			     singleRun: true
			}
		};
	if (params.sourceMap) { // Source map loader.
		karma.options.preprocessors[params.test +'lib/'+ pkgName +'.js'] = ['sourcemap'];
	}
	params.deps.forEach(function (dep) {
		karma.options.files.push({
			pattern: params.test +'lib/'+ path.basename(dep.path),
			included: false
		});
	});

	(params && params.browsers || ['Firefox']).forEach(function (browser) {
		karma['test_'+ browser.toLowerCase()] = {
			browsers: [browser]
		};
		if (!karma.build) { // By default use the first browser.
			karma.build = {
				browsers: [browser]
			};
		}
	});
	//console.log(JSON.stringify(karma, null, '  '));//FIXME
	grunt.config.merge({ karma: karma });
	if (!grunt.task.exists('karma')) {
		grunt.loadNpmTasks('grunt-karma');
	}
};

/** ## Configurate `docker` ########################################################################

Documentation generation uses `grunt-docker`, using the sources at `src/`, `README.md` and any
markdown file in the `docs/` folder.
*/
var config_docker = exports.config_docker = function config_docker(grunt, params) {
	params = Object.assign({
		docs: DEFAULTS.docs
	}, params);

	grunt.config.merge({
		docker: {
			build: {
				src: ['src/**/*.js', 'README.md', params.docs +'*.md'],
				dest: params.docs +'docker',
				options: {
					colourScheme: 'borland',
					ignoreHidden: true,
					exclude: 'src/__prologue__.js,src/__epilogue__.js'
				}
			}
		}
	});
	if (!grunt.task.exists('docker')) {
		grunt.loadNpmTasks('grunt-docker');
	}
};

/** ## Full configuration ##########################################################################

TODO
+ `build`: Path to place the build, `build/` by default.
+ `src`: List of source file paths to concatenate.
+ `sourceMap`: Flag for the generation of source maps, `true` by default.

*/
exports.config = function config(grunt, params) {
	if (!params) {
		grunt.fail.warn('No params given!');
	}
	params.deps = normalizeDeps(grunt, params.deps);

	if (!grunt.config('pkg')) {
		grunt.config('pkg', grunt.file.readJSON('package.json'));
	}
	grunt.file.defaultEncoding = 'utf8';


	_try(config_clean, grunt, params);
	_try(config_concat, grunt, params);
	_try(config_jshint, grunt, params);
	_try(config_uglify, grunt, params);
	_try(config_copy, grunt, params);

	var doTest = !params.hasOwnProperty('karma') || params.karma;
	if (doTest) {
		_try(config_karma, grunt, params);
	}

	var doDocs = !params.hasOwnProperty('docs') || params.docs;
	if (doDocs) {
		_try(config_docker, grunt, params);
	}

	if (params.hasOwnProperty('tasks')) {
		if (params.tasks) {
			for (var t in params.tasks) {
				grunt.registerTask(task, params.tasks[t]);
			}
		}
	} else { // Register default tasks
		grunt.registerTask('compile',
			['clean:build', 'concat:build', 'jshint:build', 'uglify:build', 'copy:build']);
		if (doTest) {
			grunt.registerTask('test', ['compile', 'karma:build']);
		}
		if (doDocs) {
			grunt.registerTask('build', ['test', 'docker:build']);
		}
	}
};
