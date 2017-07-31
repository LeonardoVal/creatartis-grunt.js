/**TODO
*/
//"use strict";

var path = require('path'),
	fs = require('fs');

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
			return 'this.'+ dep.id;
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
	params.sourceFiles = (params.sourceFiles || [])
		.concat((params.sourceNames || []).map(function (n) {
			return 'src/'+ n +'.js';
		}));

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
				src: params.sourceFiles,
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
		if (Array.isArray(params.testLibFiles)) {
			files = files.concat(params.testLibFiles);
		}

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
		var compileTasks = ['clean:build', 'concat:build', 'jshint:build', 'uglify:build'],
			buildTasks = ['compile'];
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


/** # Project initialization
*/

function mkdir(path, ifNotExists) {
	if (!ifNotExists || !fs.existsSync(path)) {
		fs.mkdirSync(path);
	}
}

function writeFile(path, content, ifNotExists) {
	if (!ifNotExists || !fs.existsSync(path)) {
		fs.writeFileSync(path, content, { encoding: 'utf-8' });
	}
}

function readJSON(path) {
	if (fs.existsSync(path)) {
		return JSON.parse(fs.readFileSync(path, { encoding: 'utf-8' }));
	} else {
		return null;
	}
}

/** ## Project layout generation ###################################################################

*/
var project = exports.project = {};

function errorIf(cond) {
	if (cond) {
		throw new Error(Array.prototype.slice.call(arguments, 1).join(''));
	}
}

var _args = project._args = function _args(args) { //TODO
	args = Object.assign({ // Defaults
		contributors: [],
		dependencies: {
			'creatartis-base': 'latest'
		},
		devDependencies: {
			'creatartis-grunt': 'latest'
		},
		files: ['LICENSE.md', 'build'],
		keywords: [],
		license: 'MIT',
		repository: {},
		scripts: {},
		version: '0.0.1'
	}, readJSON('./package.json'), args);

	errorIf(!args.name, 'Project has no `name`!');
	errorIf(!args.description, 'Project has no `description`!');
	errorIf(!args.author, 'Project has no `author`!');

	if (typeof args.author === 'string') {
		args.author = { name: args.author };
	}
	if (!args.main) {
		args.main = 'build/'+ args.name +'.js';
	}
	if (args.author.github) {
		if (!args.author.url) {
			args.author.url = 'https://github.com/'+ args.author.github;
		}
		if (!args.homepage) {
			args.homepage = 'https://github.com/'+ args.author.github +'/'+ args.name +'.js';
		}
		if (!args.repository) {
			args.repository = { type: 'git', url: args.homepage +'.git' };
		}
		if (!args.bugs) {
			args.bugs = { url: args.homepage +'/issues' };
		}
		if (typeof args.license !== 'object') {
			args.license = { type: args.license || 'MIT', url: args.homepage +'/LICENSE.md' };
		}
	}
	return args;
};

project.license = function license(args) {
	var name = args && args.name || '¿name?',
		authorName = args && args.author && args.author.name || '¿author.name?',
		authorEmail = args && args.author && args.author.email || '¿author.email?',
		year = (new Date()).getFullYear();
	return [
		'The MIT License', '===============', '',
		'Source code for '+ name +'.js is Copyright (C) '+ year +' ['+ authorName +
			'](mailto:'+ authorEmail +').', '',
		'Permission is hereby granted, free of charge, to any person obtaining a copy of this'+
			' software and associated documentation files (the "Software"), to deal in the'+
			' Software without restriction, including without limitation the rights to use,'+
			' copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the'+
			' Software, and to permit persons to whom the Software is furnished to do so,'+
			' subject to the following conditions:', '',
		'The above copyright notice and this permission notice shall be included in all copies'+
		 	' or substantial portions of the Software.', '',
		'**THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,'+
			' INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A'+
			' PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR'+
			' COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN'+
			' AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION'+
			' WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.**'
	].join('\n');
};

project.readme = function readme(args) {
	var name = args && args.name || '¿name?',
		description = args && args.description || '¿description?',
		authorName = args && args.author && args.author.name || '¿author.name?',
		authorEmail = args && args.author && args.author.email || '¿author.email?',
		year = (new Date()).getFullYear();
	return [
		'# '+ name, '', description, '',
		'[![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)', '',
		'## License', '',
		'Open source under an MIT license. See [LICENSE](LICENSE.md).', '',
		'## Contact', '',
		'This software is being continually developed. Suggestions and comments are always'+
		 	' welcome via [email](mailto:'+ authorEmail +').', '',
		'Copyright 2017 - ['+ authorName +'](mailto:'+ authorEmail +')'
	].join('\n');
};

project.gitignore = function gitignore(args) {
	return [
		'# Repo files', '.svn/', '.git/', '',
		'# Dependencies', 'node_modules/', 'bower_components/', '',
		'# Generated files', 'docs/docker/', 'npm-debug.log*'
	].join('\n');
};

project.gitattributes = function gitattributes(args) {
	return [
		'# Auto detect text files and perform LF normalization',
		'*.js text=on', '*.js eol=lf'
	].join('\n');
};

project.npmignore = function npmignore(args) {
	return [
		'.svn', '.git', 'npm-debug.log', 'node_modules/', 'bower_components/',
		'docs/docker/', 'lib/', 'src/', 'test/', 'Gruntfile.js'
	].join('\n');
};

project.gruntfile = function gruntfile(args) {
	var name = args && args.name || '¿name?';
	return '// Gruntfile for ['+ name +'.js](repo).\n\nmodule.exports = '+ (function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
	});

	require('creatartis-grunt').config(grunt, {
		src: ['__prologue__',
			//TODO source files
			'__epilogue__'].map(function (n) { ////////////////////////////////////////////// Fin
				return 'src/'+ n +'.js';
			}),
		deps: [
			//TODO Dependencies { name: ..., path: ..., id: ... }
		]
	});

	grunt.registerTask('default', ['build']);
}) +';\n';
};

project.__prologue__ = function __prologue__(args) {
	var name = args && args.name || '¿name?',
		dependencies = (args && args.dependencies && Object.keys(args.dependencies) ||
			['¿dependencies?']).join(', ');
	return [
		'/** Library '+ name +' wrapper and layout.', '*/',
		'function __init__('+ dependencies +'){ "use strict";', '',
		'// Import synonyms. ////////////////////////////////////////////////////////////////////////////////',
		'',
		'// Library layout. /////////////////////////////////////////////////////////////////////////////////',
		'\tvar exports = {',
		'\t\t__package__: \''+ name +'\',',
		'\t\t__name__: \''+ name +'\',',
		'\t\t__init__: __init__,',
		'\t\t__dependencies__: ['+ dependencies +']',
		'\t};',
		'', '// See __epilogue__.js'
	].join('\n');
};

project.__epilogue__ = function __epilogue__(args) {
	return [
		'// See __prologue__.js', '', '\treturn exports;', '}'
	].join('\n');
};

project.console = function console(args) {
	var name = args && args.name || '¿name?',
		description = args && args.description || '¿description?',
		authorName = args && args.author && args.author.name || '¿author.name?',
		authorEmail = args && args.author && args.author.email || '¿author.email?',
		homepage = args && args.homepage || '¿homepage?',
		year = (new Date()).getFullYear();

	function main() {
		require.config({ paths: { /*TODO*/ } });
		require([], function () {
			/*TODO*/
		}, function (error) {
			throw error;
		});
		Array.prototype.slice.call(document.querySelectorAll('#reference tr td a'))
		.forEach(function (jsLink) {
			var code;
			if (jsLink.href === "javascript:") {
				code = JSON.stringify(''+
					(jsLink.getAttribute('data-code') || jsLink.textContent)
				);
				jsLink.href="javascript:console.info("+ code +");console.log(eval("+ code +"));";
			}
		});
	}

	return [
		'<!DOCTYPE html>', '<html><head>',
		'\t<title>'+ name +' test console</title>',
		'\t<meta charset="UTF-8"/>',
		'\t<style>',
		'\tbody { font-family:"Merriweather","PT Serif",Georgia,"Times New Roman",serif; }',
		'\th1 { text-align:center; }',
		'\ta { color:black; text-decoration:none; }',
		'\t#reference tr td { padding: 0.5em; }',
		'\t#reference tr td:nth-child(1) { font-family:"Courier New",Courier,monospace; '+
			'background-color:black; color:white; }',
		'\t#reference tr td:nth-child(1) a { color:white; }',
		'\t</style>',
		'\t<script type="text/javascript" src="lib/require.js"></script>',
		'</head><body onload="main();">',
		'\t<h1><a href="'+ homepage +'" target="_blank">'+ name +'</a> tester</h1>',
		'\t<p>Open your browser Javascript console. In Windows use: Ctrl+Shift+J in Chrome,'+
			' Ctrl+Shift+K in Firefox, F12 in Internet Explorer, Ctrl+Shift+I in Opera.</p>',
		'\t<table id="reference"><tr>',
		'\t\t<td><a href="javascript:console.info(\''+ name +'\');console.dir('+ name +
			');">ludorum</a></td>',
		'\t\t<td>'+ description +'</td>',
		'\t</tr></table>',
		'\t<p style="text-align:center;"><a href="mailto:'+ authorEmail +'">&copy; '+ year +
			' '+ authorName +'</a> - <a href="'+ homepage +'" target="_blank">'+ name +
			'.js</a>',
		'\t</p>',
		'<script type="text/javascript"> "use strict"; '+ main +'</script>',
		'</body></html>'
	].join('\n');
};

project.karma_tester = function karma_tester(args) {
	var name = args && args.name || '¿name?',

		paths = {};
	paths[name] = 'lib/'+ name +'.js';
	var main = (function () {
			require.config({ // Configure RequireJS.
				baseUrl: '/base',
				paths: $paths
			});
			require(Object.keys(window.__karma__.files) // Dynamically load all test files
					.filter(function (file) { // Filter test modules.
						return /\.test\.js$/.test(file);
					}).map(function (file) { // Normalize paths to RequireJS module names.
						return file.replace(/^\/base\//, '').replace(/\.js$/, '');
					}),
				function () {
					window.__karma__.start(); // we have to kickoff jasmine, as it is asynchronous
				}
			);
		} +'')
		.replace(/\n\t\t/g, '\n')
		.replace('$paths', JSON.stringify(paths));
	return [
		'('+ main +')();'
	].join('\n');
};

exports.newProject = function newProject(args) {
	args = _args(args);
	var params = defaults({});

	['src/', params.test, params.test_lib, params.specs, params.perf, params.build, params.docs
	].forEach(function (p) {
		if (p) {
			mkdir('./'+ p, true);
		}
	});

	writeFile('./LICENSE.md', project.license(args), true);
	writeFile('./README.md', project.readme(args), true);
	writeFile('./.gitignore', project.gitignore(args), true);
	writeFile('./.npmignore', project.npmignore(args), true);
	writeFile('./.gitattributes', project.gitattributes(args), true);
	writeFile('./Gruntfile.js', project.gruntfile(args), true);
	writeFile('./package.json', JSON.stringify(args, null, '\t'), true);

	writeFile('./src/__prologue__.js', project.__prologue__(args), true);
	writeFile('./src/__epilogue__.js', project.__epilogue__(args), true);

	writeFile('./'+ params.test +'console.html', project.console(args), true);
	writeFile('./'+ params.test +'karma-tester.js', project.karma_tester(args), true);
};

//# sourceMappingURL=creatartis-grunt.js.map