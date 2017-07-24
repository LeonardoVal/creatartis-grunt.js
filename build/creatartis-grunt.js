/**TODO
*/
//"use strict";

var path = require('path'),
	fs = require('fs'),
	prompt = require('prompt'); // <https://github.com/flatiron/prompt>

var exports = module.exports;


/** # Utilities

Miscelaneous functions and definitions.
*/

/** An UMD wrapper takes a function that builds the module taking its dependencies as arguments. It
checks the Javascript environment and guesses which module definition method to use: AMD, CommonJS
or script tags.
*/
var wrapper_UMD = exports.wrapper_UMD = function wrapper_UMD(deps) {
	var nameList = JSON.stringify(deps.map(function (dep) {
			return dep.name;
		})),
		requireList = deps.map(function (dep) {
			return 'require('+ JSON.stringify(dep.name) +')';
		}).join(','),
		globalList = deps.map(function (dep) {
			return 'this.'+ dep.global;
		}).join(',');
	return (function (init) { "use strict";
			if (typeof define === 'function' && define.amd) {
				define($1, init); // AMD module.
			} else if (typeof exports === 'object' && module.exports) {
				module.exports = init($2); // CommonJS module.
			} else {
				this.Sermat = init($3); // Browser.
			}
		} +'')
		.replace('$1', nameList)
		.replace('$2', requireList)
		.replace('$3', globalList);
};

var wrapper_AMD = exports.wrapper_AMD = function wrapper_AMD(deps) {
	var nameList = JSON.stringify(deps.map(function (dep) {
			return dep.name;
		}));
	return (function (init) { "use strict";
			define($1, init);
		} +'').replace('$1', nameList);
};

var wrapper_node = exports.wrapper_node = function wrapper_node(deps) {
	var requireList = deps.map(function (dep) {
			return 'require('+ JSON.stringify(dep.name) +')';
		}).join(',');
	return (function (init) { "use strict";
			module.exports = init($1);
		} +'').replace('$1', requireList);
};

var wrapper = exports.wrapper = function wrapper(type, deps) {
	switch (type.trim().toLowerCase()) {
		case 'umd':
			return {
				banner: '('+ wrapper_UMD(deps) +').call(this,',
				footer: ');'
			};
		case 'amd':
			return {
				banner: '('+ wrapper_AMD(deps) +').call(this,',
				footer: ');'
			};
		case 'node':
			return {
				banner: '('+ wrapper_node(deps) +').call(this,',
				footer: ');'
			};
		default: return {};
	}
};

/** Dependencies can be expressed by a simple string with the module's name, or an object with many
properties. This properties include:

+ `name`: module's name (as in the `package.json` file),
+ `path`: path in the filesystem from where the module's script is loaded.
+ `sourceMap`: path in the filesystem from where the module's source map is loaded.
+ `global`: id in the global object (`window`) that the module uses when loaded with a script tag.
*/
var normalizeDeps = exports.normalizeDeps = function normalizeDeps(grunt, deps) {
	return !deps ? [] : deps.map(function (dep) {
		if (typeof dep === 'string') {
			dep = { name: dep };
		}
		if (!dep.path) {
			dep.path = require.resolve(dep.name);
			if (!grunt.file.exists(dep.path)) {
				grunt.fail.warn('Could not find module '+ dep.name +' at <'+ path +'>!');
			}
		}
		if (grunt.file.exists(dep.path +'.map')) {
			dep.sourceMap = dep.path +'.map';
		}
		return dep;
	});
};

/** This try-catch function is used to improve the error reporting if the code fails.
*/
function _try(f, grunt, params) {
	try {
		return f(grunt, params);
	} catch (error) {
		grunt.log.error('Error while calling '+ f.name +':\n'+ error.stack);
		throw error;
	}
}

/** This function loads a task if it is not already loaded.
*/
function _loadTask(grunt, task, npmTask) {
	if (!grunt.task.exists(task)) {
		grunt.loadNpmTasks(npmTask);
	}
}


/**TODO
*/

/** Configuration parameters' default values.
*/
function defaults(params) {
	params = Object.assign({
		build: 'build/',
		test: 'tests/',
		docs: 'docs/',

		separator: '\n\n',
		sourceMap: true,
		wrapper: 'umd',
		karma: ['Firefox']
	}, params);

	params.jshint = Object.assign({
		loopfunc: true,
		boss: true
	}, params.jshint);

	params.test_lib = params.test && (params.test_lib || params.test +'lib/');
	params.specs = params.test && (params.specs || params.test +'specs/');
	params.perf = params.test &&
		(typeof params.perf === 'string' ? params.perf : params.perf && params.test +'perf/');

	return params;
}

/** ## Configurate `clean` #########################################################################

The `clean` task is used to delete all files in the build folder (`build/`).
*/
var config_clean = exports.config_clean = function config_clean(grunt, params) {
	params = defaults(params);
	grunt.config.merge({
		clean: {
			build: [params.build]
		}
	});
	_loadTask(grunt, 'clean', 'grunt-contrib-clean');
};

/** ## Configurate `concat` ########################################################################

The source files of the project (in the `src/` folder) are concatenated into one module. The plugin
`grunt-contrib-concat` can also generate source map files, that are very useful for debugging.
*/
var config_concat = exports.config_concat = function config_concat(grunt, params) {
	params = defaults(params);
	var options = Object.assign({
			separator: params.separator,
			sourceMap: params.sourceMap
		}, wrapper(params.wrapper, params.deps));

	grunt.config.merge({
		concat: {
			build: {
				options: options,
				src: params.src,
				dest: params.build +'<%= pkg.name %>.js'
			},
		}
	});
	_loadTask(grunt, 'concat', 'grunt-contrib-concat');
};

/** ## Configurate `jshint` ########################################################################

Checking the code is imperative in Javascript. The plugin `grunt-contrib-jshint` is used to lint the
concatenated code, and also the scripts for the test cases.
*/
var config_jshint = exports.config_jshint = function config_jshint(grunt, params) {
	params = defaults(params);
	var src = [params.build +'<%= pkg.name %>.js'];
	if (params.specs) {
		src.push(params.specs +'*.js');
	}
	grunt.config.merge({
		jshint: {
			build: {
				options: params.jshint,
				src: src,
			},
		}
	});
	_loadTask(grunt, 'jshint', 'grunt-contrib-jshint');
};

/** ## Configurate `uglify` ########################################################################

The plugin `grunt-contrib-uglify` is used to minimize the concatenated code. It also can generate
source maps.
*/
var config_uglify = exports.config_uglify = function config_uglify(grunt, params) {
	params = defaults(params);
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
	_loadTask(grunt, 'uglify', 'grunt-contrib-uglify');
};

/** ## Configurate `copy` ##########################################################################

For testing the library, the built module and its dependencies are copied in the `tests/lib` folder.
This makes it easier to run the test cases, but also to create HTML pages for debugging.
*/
var config_copy = exports.config_copy = function config_copy(grunt, params) {
	params = defaults(params);
	if (params.hasOwnProperty('test_lib') && !params.test_lib) {
		return false;
	} else {
		var files = [
				params.build +'<%= pkg.name %>.js',
				params.build +'<%= pkg.name %>.js.map',
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
						return { nonull: true, src: f, dest: params.test_lib + path.basename(f) };
					})
				}
			},
		});
		_loadTask(grunt, 'copy', 'grunt-contrib-copy');
		return true;
	}
};

/** ## Configurate `karma` #########################################################################

Karma is a framework that automates web browsers to run test cases. It is a little hard to configure
properly, but is very useful.
*/
var config_karma = exports.config_karma = function config_karma(grunt, params) {
	params = defaults(params);
	if (params.hasOwnProperty('karma') && !params.karma) {
		return false;
	} else {
		var pkgName = grunt.config('pkg.name'),
			karma = {
				options: {
					frameworks: ['jasmine', 'requirejs'], // See: https://npmjs.org/browse/keyword/karma-adapter
					preprocessors: {},
				     files: [
						params.test +'karma-tester.js',
						{ pattern: params.specs +'*.test.js', included: false },
						{ pattern: params.test_lib + pkgName +'.js', included: false }
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
			karma.options.preprocessors[params.test_lib + pkgName +'.js'] = ['sourcemap'];
		}
		params.deps.forEach(function (dep) {
			karma.options.files.push({
				pattern: params.test_lib + path.basename(dep.path),
				included: false
			});
		});

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
		grunt.config.merge({ karma: karma });
		_loadTask(grunt, 'karma', 'grunt-karma');
		return true;
	}
};


/** ## Configurate `benchmark` #####################################################################

Performance benchmarks using `grunt-benchmark`.
*/
var config_benchmark = exports.config_benchmark = function config_benchmark(grunt, params) {
	params = defaults(params);
	if (!params.perf) {
		return false;
	} else {
		grunt.config.merge({
			benchmark: {
				build: {
					src: [params.perf]
				}
			}
		});
		_loadTask(grunt, 'benchmark', 'grunt-benchmark');
		return true;
	}
};

/** ## Configurate `docker` ########################################################################

Documentation generation uses `grunt-docker`, using the sources at `src/`, `README.md` and any
markdown file in the `docs/` folder.
*/
var config_docker = exports.config_docker = function config_docker(grunt, params) {
	params = defaults(params);
	if (params.hasOwnProperty('docs') && !params.docs) {
		return false;
	} else {
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
		_loadTask(grunt, 'docker', 'grunt-docker');
		return true;
	}
};

/** ## Full configuration ##########################################################################

TODO
+ `build`: Path to place the build, `build/` by default.
+ `src`: List of source file paths to concatenate.
+ `sourceMap`: Flag for the generation of source maps, `true` by default.

*/
exports.config = function config(grunt, params) {
	if (!grunt.config('pkg')) {
		grunt.config('pkg', grunt.file.readJSON('package.json'));
	}
	grunt.file.defaultEncoding = 'utf8';

	params.deps = normalizeDeps(grunt, params.deps);
	_try(config_clean, grunt, params);
	_try(config_concat, grunt, params);
	_try(config_jshint, grunt, params);
	_try(config_uglify, grunt, params);

	var doCopy = _try(config_copy, grunt, params),
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
		var compileTasks = ['clean:build', 'concat:build', 'jshint:build', 'uglify:build'];
		if (doCopy) {
			compileTasks.push('copy:build');
		}
		grunt.registerTask('compile', compileTasks);
		if (doTest) {
			grunt.registerTask('test', ['compile', 'karma:build']);
		}
		if (doDocs) {
			grunt.registerTask('build', ['test', 'docker:build']);
		}
		if (doPerf) {
			grunt.registerTask('perf', ['test', 'benchmark:build']);
		}
	}
};

//# sourceMappingURL=creatartis-grunt.js.map