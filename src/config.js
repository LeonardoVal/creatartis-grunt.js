/** # Grunt configuration.

TODO
*/

/** ## Configurate `clean` #####################################################

The `clean` task is used to delete all files in the build folder (`build/`).
*/
var config_clean = exports.config_clean = function config_clean(grunt, params) {
	var conf = {
		clean: {
			build: [params.paths.build]
		}
	};
	params.log('config_clean', conf);
	grunt.config.merge(conf);
	_loadTask(grunt, 'clean', 'grunt-contrib-clean');
};

/** ## Configurate `concat` ####################################################

The source files of the project (in the `src/` folder) are concatenated into one 
module. The plugin `grunt-contrib-concat` can also generate source map files, 
that are very useful for debugging.
*/
var config_concat = exports.config_concat = function config_concat(grunt, params) {
	var targets = params.targets,
		conf = {
			concat: { }
		};
	Object.keys(targets).forEach(function (k) {
		var t = targets[k],
			options = Object.assign({
				separator: params.separator,
				sourceMap: params.sourceMap,
				process: params.concatProcess
			}, wrapper(t.wrapper, params.globalName, params.deps));
		conf.concat[k] = {
			options: options,
			src: params.sourceFiles,
			dest: t.fileName +'.js'
		};
	});
	params.log('config_concat', conf);
	grunt.config.merge(conf);
	_loadTask(grunt, 'concat', 'grunt-contrib-concat');
};

/** ## Configurate `jshint` ####################################################

Checking the code is imperative in Javascript. The plugin `grunt-contrib-jshint`
is used to lint the concatenated code, and also the scripts for the test cases.
*/
var config_jshint = exports.config_jshint = function config_jshint(grunt, params) {
	var src = [
			params.paths.build +'*.js',
			params.paths.specs +'*.js'
		],
		conf = {
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

/** ## Configurate `terser` ####################################################

The plugin `grunt-terser` is used to minimize the concatenated code. It also can
generate source maps.
*/
var config_terser = exports.config_terser = function config_terser(grunt, params) {
	var targets = params.targets,
	conf = {
		terser: { }
	};
	Object.keys(targets).forEach(function (k) {
		var t = targets[k];
		conf.terser[k] = {
			options: {
				sourceMap: params.sourceMap && {
					content: grunt.file.read(t.fileName +'.js.map'),
					filename: t.fileName +'.min.js.map'
				}
			},
			files: {} 
		};
		conf.terser[k].files[t.fileName +'.min.js'] = t.fileName +'.js'; 
	});
	params.log('config_terser', conf);
	grunt.config.merge(conf);
	_loadTask(grunt, 'terser', 'grunt-terser');
};

/** ## Configurate `copy` ######################################################

For testing the library, the built module and its dependencies can be copied in
the `tests/lib` folder. This may be necessary for some tests.
*/
var config_copy = exports.config_copy = function config_copy(grunt, params) {
	function __testLibFiles__(paths, files, params) {
		if (paths.test_lib) {
			files.push(
				{ nonull: true, src: 'node_modules/requirejs/require.js', 
					dest: paths.test_lib +'require.js' },
				{ nonull: true, expand: true, flatten: true,
					src: paths.build +'*.js', dest: paths.test_lib },
				{ nonull: true, expand: true, flatten: true,
					src: paths.build +'*.js.map', dest: paths.test_lib }
			);
			params.deps.forEach(function (dep) {
				files.push({ nonull: true, src: dep.path,
					dest: paths.test_lib + path.basename(dep.path) });
				if (dep.sourceMap) {
					files.push({ 
						nonull: true, 
						src: dep.sourceMap,
						dest: paths.test_lib + path.basename(dep.sourceMap) 
					});
				}
			});
		}
	}

	var paths = params.paths,
		files = [];
	Object.keys(params.copy).forEach(function (dest) {
		var src = params.copy[dest];
		if (typeof src === 'string') {
			src = [src];
		}
		src.forEach(function (src) {
			files.push({ src: src, dest: dest, nonull: true, expand: true, 
				flatten: true });
		});
	});
	__testLibFiles__(paths, files, params);
	if (files.length < 1) {
		return false;
	} else {
		var conf = { copy: { build: { files: files } } };
		params.log('config_copy', conf);
		grunt.config.merge(conf);
		_loadTask(grunt, 'copy', 'grunt-contrib-copy');
		return true;
	}
};

/** ## Configurate `karma` #####################################################

Karma is a framework that automates web browsers to run test cases. It is a 
little hard to configure properly, but is very useful.
*/
var config_karma = exports.config_karma = function config_karma(grunt, params) {
	if (params.hasOwnProperty('karma') && !params.karma) {
		return false;
	} else {
		var pkgName = params.pkgName,
			paths = params.paths,
			karma = {
				options: {
					frameworks: ['jasmine', 'requirejs'], // See: https://npmjs.org/browse/keyword/karma-adapter
					preprocessors: {},
				     files: [
						__dirname +'/karma-tester.js',
						{ pattern: paths.specs +'*.test.js',
							included: false },
						{ pattern: paths.build + pkgName +'.js',
							included: false },
						{ pattern: paths.build + pkgName +'.js.map',
							included: false },
						{ pattern: paths.test +'require-config.js',
							included: false }
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
			karma.options.preprocessors[paths.build +'*.js'] = ['sourcemap'];
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

/** ## Configurate `benchmark` #################################################

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

/** ## Configurate `connect` ###################################################

Static http server configuration for testing with web pages.
*/
var config_connect = exports.config_connect = function config_connect(grunt, params) {
	if (params.hasOwnProperty('connect') && !params.connect) {
		return false;
	} else {
		var conf = {
			connect: {
				options: {
					port: 8088,
					keepalive: true,
					base: '.'
				}
			}
		};
		Object.keys(params.connect).forEach(function (task) {
			var url = params.connect[task];
			if (!url.startsWith('http')) {
				url = 'http://localhost:8088/'+ url;
			}
			conf.connect[task] = { options: { open: url } };
		});
		params.log('config_connect', conf);
		grunt.config.merge(conf);
		_loadTask(grunt, 'connect', 'grunt-contrib-connect');
		return true;
	}
};

/** ## Configurate `jsdoc` #####################################################

Documentation generation uses `grunt-jsdoc`, using the sources at `src/`, 
`README.md` and any markdown file in the `docs/` folder.
*/
var config_jsdoc = exports.config_jsdoc = function config_jsdoc(grunt, params) {
	if (params.hasOwnProperty('docs') && !params.docs) {
		return false;
	} else {
		if (!grunt.file.exists(params.paths.docs +'jsdoc')) {
			grunt.file.mkdir(params.paths.docs +'jsdoc');
		}
		grunt.file.write(params.paths.docs +'jsdoc-conf.json',
			JSON.stringify({
				source: {
					exclude: ['src/__prologue__.js', 'src/__epilogue__.js']
				},
				sourceType: "script",
				plugins: ["plugins/markdown"],
				opts: {
					template: "templates/default",
					encoding: "utf8",
					recurse: true
				}
			})
		);
		var conf = {
			jsdoc: {
				build: {
					src: ['src/'],
					options: {
						destination: params.paths.docs +'jsdoc',
						readme: 'README.md',
						tutorials: params.paths.docs +'*.md',
						configure: params.paths.docs +'jsdoc-conf.json' 
					}
				}
			}
		};
		params.log('config_jsdoc', conf);
		grunt.config.merge(conf);
		_loadTask(grunt, 'jsdoc', 'grunt-jsdoc');
		return true;
	}
};

/** ## Full configuration ######################################################

TODO
*/
exports.config = function config(grunt, params) {
	if (!grunt.config('pkg')) {
		grunt.config('pkg', grunt.file.readJSON('package.json'));
	}
	grunt.file.defaultEncoding = 'utf8';

	params = __params__(grunt, params);
	_try(config_clean, grunt, params);
	_try(config_concat, grunt, params);
	_try(config_jshint, grunt, params);
	_try(config_terser, grunt, params);

	var doRequireJS = _try(config_requirejs, grunt, params),
		doCopy = _try(config_copy, grunt, params),
		doTest = _try(config_karma, grunt, params),
		doDocs = _try(config_jsdoc, grunt, params),
		doConnect = _try(config_connect, grunt, params),
		doPerf = _try(config_benchmark, grunt, params);

	if (params.hasOwnProperty('tasks')) {
		if (params.tasks) {
			for (var t in params.tasks) {
				grunt.registerTask(task, params.tasks[t]);
			}
		}
	} else { // Register default tasks
		grunt.registerTask('concat-all', Object.keys(params.targets).map(function (t) {
			return 'concat:'+ t;
		}));
		grunt.registerTask('terser-all', Object.keys(params.targets).map(function (t) {
			return 'terser:'+ t;
		}));
		var compileTasks = ['clean:build', 'concat-all', 'jshint:build', 'terser-all'],
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
		if (doDocs) {
			buildTasks.push('jsdoc:build');
		}
		grunt.registerTask('build', buildTasks);
		if (doConnect) {
			Object.keys(params.connect).forEach(function (task) {
				grunt.registerTask(task, ['compile', 'connect:'+ task]);
			});
		}
		if (doPerf) {
			grunt.registerTask('perf', buildTasks.concat(['benchmark:build']));
		}
	}
};
