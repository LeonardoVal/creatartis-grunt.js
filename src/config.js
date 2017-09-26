/**TODO
*/

/** Configuration parameters' default values.
*/
function defaults(grunt, params) {
	params = Object.assign({
		pkg_name: grunt.config('pkg.name'),
		pkg_version: grunt.config('pkg.version'),

		build: 'build/',
		test: 'tests/',
		docs: 'docs/',
		bundled: [],

		separator: '\n\n',
		sourceMap: true,
		wrapper: 'umd',
		karma: ['Firefox']
	}, params);
	params.log = params.log === true ? _log : function () {}; // log does nothing by default.
	if (params.hasOwnProperty('log') && typeof params.log !== 'function') {
		throw new Error('`params.log` must be function!');
	}

	var m = _parse_pkg_name(params.pkg_name);
	if (m) {
		params.pkg_name = m.name;
		params.pkg_scope = m.scope;
	}
	params.deps = normalizeDeps(grunt, params.deps);

	params.jshint = Object.assign({
		loopfunc: true,
		boss: true
	}, params.jshint);
	params.sourceFiles = (params.sourceFiles || [])
		.concat((params.sourceNames || []).map(function (n) {
			return 'src/'+ n +'.js';
		}));

	params.specs = params.test && (params.specs || params.test +'specs/');
	params.perf = params.test &&
		(typeof params.perf === 'string' ? params.perf : params.perf && params.test +'perf/');

	params.log('defaults', params);
	return params;
}

function _log(tag, data) {
	console.log(tag, inspect(data, { showHidden: false, colors: true, depth: 4 }));
}

/** ## Configurate `clean` #########################################################################

The `clean` task is used to delete all files in the build folder (`build/`).
*/
var config_clean = exports.config_clean = function config_clean(grunt, params) {
	var conf = {
		clean: {
			build: [params.build]
		}
	};
	params.log('config_clean', conf);
	grunt.config.merge(conf);
	_loadTask(grunt, 'clean', 'grunt-contrib-clean');
};

/** ## Configurate `concat` ########################################################################

The source files of the project (in the `src/` folder) are concatenated into one module. The plugin
`grunt-contrib-concat` can also generate source map files, that are very useful for debugging.
*/
var config_concat = exports.config_concat = function config_concat(grunt, params) {
	var options = Object.assign({
			separator: params.separator,
			sourceMap: params.sourceMap
		}, wrapper(params.wrapper, params.pkg_name, params.deps)),
		conf = {
			concat: {
				build: {
					options: options,
					src: params.sourceFiles,
					dest: params.build + params.pkg_name +'.js'
				},
			}
		};
	params.log('config_concat', conf);
	grunt.config.merge(conf);
	_loadTask(grunt, 'concat', 'grunt-contrib-concat');
};

/** ## Configurate `jshint` ########################################################################

Checking the code is imperative in Javascript. The plugin `grunt-contrib-jshint` is used to lint the
concatenated code, and also the scripts for the test cases.
*/
var config_jshint = exports.config_jshint = function config_jshint(grunt, params) {
	var src = [params.build +'*.js'];
	if (params.specs) {
		src.push(params.specs +'*.js');
	}
	var conf = {
		jshint: {
			build: {
				options: params.jshint,
				src: src,
			},
		}
	};
	params.log('config_jshint', conf);
	grunt.config.merge(conf);
	_loadTask(grunt, 'jshint', 'grunt-contrib-jshint');
};

/** ## Configurate `uglify` ########################################################################

The plugin `grunt-contrib-uglify` is used to minimize the concatenated code. It also can generate
source maps.
*/
var config_uglify = exports.config_uglify = function config_uglify(grunt, params) {
	var conf = {
		uglify: {
			build: {
				src: params.build + params.pkg_name +'.js',
				dest: params.build + params.pkg_name +'.min.js',
				options: {
					banner: '//! '+ params.pkg_name +' '+ params.pkg_version +'\n',
					report: 'min',
					sourceMap: params.sourceMap,
					sourceMapIn: params.build + params.pkg_name +'.js.map',
					sourceMapName: params.build + params.pkg_name +'.min.js.map'
				}
			}
		}
	};
	params.log('config_uglify', conf);
	grunt.config.merge(conf);
	_loadTask(grunt, 'uglify', 'grunt-contrib-uglify');
};

/** ## Write RequireJS configuration script. #######################################################

Dependencies for tests that use RequireJS need a configuration including the paths of each library.
This task generates a script that makes this configuration.
*/
var config_requirejs = exports.config_requirejs = function config_requirejs(grunt, params) {
	if (params.hasOwnProperty('requirejs') && !params.requirejs) {
		return false;
	} else {
		var allDeps = allDependencies(params),
			conf = {
				path: params.requirejs || params.test +'require-config.js',
				config: {
					paths: {}
				}
			},
			dirPath = path.dirname(conf.path);
		conf.config.paths[params.pkg_name] = path.relative(dirPath, params.build + params.pkg_name)
			.replace(/\.js$/, '');
		for (var id in allDeps) {
			conf.config.paths[id] = path.relative(dirPath, allDeps[id].path)
				.replace(/\.js$/, '');
		}
		conf = { requirejs: { build: conf }};
		params.log('config_uglify', conf);
		grunt.config.merge(conf);
		grunt.registerMultiTask("requirejs", function () {
			grunt.file.write(this.data.path, requireConfig(this.data.config));
			grunt.log.ok("Generated script "+ this.data.path +".");
		});
		return true;
	}
};

/** ## Configurate `copy` ##########################################################################

For testing the library, the built module and its dependencies can be copied in the `tests/lib`
folder. This may be necessary for some tests.
*/
var config_copy = exports.config_copy = function config_copy(grunt, params) {
	var files = (params.bundled || []).map(function (b) {
		if (typeof b === 'string') {
			return { nonull: true, src: b,
				dest: params.build + path.basename(b) };
		} else {
			return b;
		}
	});
	if (params.test_lib) {
		files.push(
			{ nonull: true, src: 'node_modules/requirejs/require.js',
				dest: params.test_lib +'require.js' },
			{ nonull: true, expand: true, flatten: true,
				src: params.build +'*.js', dest: params.test_lib },
			{ nonull: true, expand: true, flatten: true,
				src: params.build +'*.js.map', dest: params.test_lib }
		);
		params.deps.forEach(function (dep) {
			files.push({ nonull: true, src: dep.path,
				dest: params.test_lib + path.basename(dep.path) });
			if (dep.sourceMap) {
				files.push({ nonull: true, src: dep.sourceMap,
					dest: params.test_lib + path.basename(dep.sourceMap) });
			}
		});
	}
	if (files.length < 1) {
		return false;
	} else {
		var conf = {
			copy: {
				build: {
					files: files
				}
			},
		};
		params.log('config_copy', conf);
		grunt.config.merge(conf);
		_loadTask(grunt, 'copy', 'grunt-contrib-copy');
		return true;
	}
};

/** ## Configurate `karma` #########################################################################

Karma is a framework that automates web browsers to run test cases. It is a little hard to configure
properly, but is very useful.
*/
var config_karma = exports.config_karma = function config_karma(grunt, params) {
	if (params.hasOwnProperty('karma') && !params.karma) {
		return false;
	} else {
		var pkgName = params.pkg_name,
			karma = {
				options: {
					frameworks: ['jasmine', 'requirejs'], // See: https://npmjs.org/browse/keyword/karma-adapter
					preprocessors: {},
				     files: [
						__dirname +'/karma-tester.js',
						{ pattern: params.specs +'*.test.js', included: false },
						{ pattern: params.build + pkgName +'.js', included: false },
						{ pattern: params.build + pkgName +'.js.map', included: false },
						{ pattern: params.test +'require-config.js', included: false }
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
			karma.options.preprocessors[params.build +'*.js'] = ['sourcemap'];
		}
		_karmaFiles(params, karma);

		params.karma.forEach(function (browser) {
			karma['test_'+ browser.toLowerCase()] = {
				browsers: [browser]
			};
			if (!karma.build) { // By default use the first browser.
				karma.build = {
					browsers: [browser]
				};
			}
		});

		var conf = { karma: karma };
		params.log('config_karma', conf);
		grunt.config.merge(conf);
		_loadTask(grunt, 'karma', 'grunt-karma');
		return true;
	}
};

function _karmaFiles(params, karma) {
	var allDeps = allDependencies(params),
		dep;
	for (var id in allDeps) {
		dep = allDeps[id];
		karma.options.files.push({
			pattern: dep.path,
			included: false
		});
		if (dep.sourceMap) {
			karma.options.preprocessors[dep.path] = ['sourcemap'];
		}
	}
}

/** ## Configurate `benchmark` #####################################################################

Performance benchmarks using `grunt-benchmark`.
*/
var config_benchmark = exports.config_benchmark = function config_benchmark(grunt, params) {
	if (!params.perf) {
		return false;
	} else {
		var conf = {
			benchmark: {
				build: {
					src: [params.perf +'*.perf.js']
				}
			}
		};
		params.log('config_benchmark', conf);
		grunt.config.merge(conf);
		_loadTask(grunt, 'benchmark', 'grunt-benchmark');
		return true;
	}
};

/** ## Configurate `docker` ########################################################################

Documentation generation uses `grunt-docker`, using the sources at `src/`, `README.md` and any
markdown file in the `docs/` folder.
*/
var config_docker = exports.config_docker = function config_docker(grunt, params) {
	if (params.hasOwnProperty('docs') && !params.docs) {
		return false;
	} else {
		var conf = {
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
		};
		params.log('config_docker', conf);
		grunt.config.merge(conf);
		_loadTask(grunt, 'docker', 'grunt-docker');
		return true;
	}
};

/** ## Full configuration ##########################################################################

TODO
*/
exports.config = function config(grunt, params) {
	if (!grunt.config('pkg')) {
		grunt.config('pkg', grunt.file.readJSON('package.json'));
	}
	grunt.file.defaultEncoding = 'utf8';

	params = defaults(grunt, params);
	_try(config_clean, grunt, params);
	_try(config_concat, grunt, params);
	_try(config_jshint, grunt, params);
	_try(config_uglify, grunt, params);

	var doRequireJS = _try(config_requirejs, grunt, params),
		doCopy = _try(config_copy, grunt, params),
		doTest = _try(config_karma, grunt, params),
		doDocs = _try(config_docker, grunt, params),
		doPerf = _try(config_benchmark, grunt, params);

	if (params.hasOwnProperty('tasks')) {
		if (params.tasks) {
			for (var t in params.tasks) {
				grunt.registerTask(task, params.tasks[t]);
			}
		}
	} else { // Register default tasks
		var compileTasks = ['clean:build', 'concat:build', 'jshint:build', 'uglify:build'],
			buildTasks = ['compile'];
		if (doRequireJS) {
			compileTasks.push('requirejs:build');
		}
		if (doCopy) {
			compileTasks.push('copy:build');
		}
		grunt.registerTask('compile', compileTasks);
		if (doTest) {
			grunt.registerTask('test', ['compile', 'karma:build']);
			buildTasks = ['test'];
		}
		grunt.registerTask('build', doDocs ? buildTasks.concat(['docker:build']) : buildTasks);
		if (doPerf) {
			grunt.registerTask('perf', buildTasks.concat(['benchmark:build']));
		}
	}
};
