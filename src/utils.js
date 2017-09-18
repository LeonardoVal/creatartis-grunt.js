/** # Utilities

Miscelaneous functions and definitions.
*/

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

/** An UMD wrapper takes a function that builds the module taking its dependencies as arguments. It
checks the Javascript environment and guesses which module definition method to use: AMD, CommonJS
or script tags.
*/
function _js_ref(obj, id) {
	return obj + (/^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(id) ? '.'+ id : '['+ JSON.stringify(id) +']');
}

var wrapper_UMD = exports.wrapper_UMD = function wrapper_UMD(pkg_name, deps) {
	deps = deps.filter(function (dep) {
		return !dep.indirect;
	});
	var nameList = JSON.stringify(deps.map(function (dep) {
			return _parse_pkg_name(dep.id).name;
		})),
		requireList = deps.map(function (dep) {
			return 'require('+ JSON.stringify(dep.id) +')';
		}).join(','),
		globalList = deps.map(function (dep) {
			return _js_ref('this', dep.name);
		}).join(',');
	return (function (init) { "use strict";
			if (typeof define === 'function' && define.amd) {
				define($1, init); // AMD module.
			} else if (typeof exports === 'object' && module.exports) {
				module.exports = init($2); // CommonJS module.
			} else {
				$4 = init($3); // Browser.
			}
		} +'')
		.replace('$1', nameList)
		.replace('$2', requireList)
		.replace('$3', globalList)
		.replace('$4', _js_ref('this', pkg_name));
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
			return 'require('+ JSON.stringify(dep.id) +')';
		}).join(',');
	return (function (init) { "use strict";
			module.exports = init($1);
		} +'').replace('$1', requireList);
};

var wrapper = exports.wrapper = function wrapper(type, name, deps) {
	switch (type.trim().toLowerCase()) {
		case 'umd':
			return {
				banner: '('+ wrapper_UMD(name, deps) +').call(this,',
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

function _parse_pkg_name(name, result) {
	var m = /^(@.+?)\/(.+?)$/.exec(name);
	result = result || {};
	result.scope = m && m[1];
	result.name = m ? m[2] : name;
	return result;
}

/** Dependencies can be expressed by a simple string with the module's name, or an object with many
properties. This properties include:

+ `name`: module's name (as in the `package.json` file),
+ `path`: path in the filesystem from where the module's script is loaded.
+ `sourceMap`: path in the filesystem from where the module's source map is loaded.
+ `global`: id in the global object (`window`) that the module uses when loaded with a script tag.
*/
var normalizeDeps = exports.normalizeDeps = function normalizeDeps(grunt, deps) {
	return !deps ? [] : deps.map(function (dep) {
		return normalizeDep(grunt, dep);
	});
};

var normalizeDep = exports.normalizeDep = function normalizeDep(grunt, dep) {
	if (typeof dep === 'string') {
		dep = { id: dep };
	}
	if (!dep.name) {
		_parse_pkg_name(dep.id, dep);
	}
	if (!dep.path) {
		dep.absolutePath = require.resolve(dep.id);
	} else if (path.isAbsolute(dep.path)){
		dep.absolutePath = dep.path;
	} else {
		dep.absolutePath = path.resolve(dep.path);
	}
	dep.path = path.relative(path.dirname(module.parent.filename), dep.absolutePath);

	if (!dep.hasOwnProperty('module')) {
		require(dep.id);
		dep.module = require.cache[dep.absolutePath];
	}

	if (grunt.file.exists(dep.path +'.map')) {
		dep.sourceMap = dep.path +'.map';
	}
	return dep;
};

/** Generates a script for configuring RequireJS. Mostly used for setting the `paths` in tests.
*/
var requireConfig = exports.requireConfig = function requireConfig(config) {
	var code = '// Generated code, please do NOT modify.\n('+
		(function () { "use strict";
			var config = $1;
			require.config(config);
			console.log("RequireJS configuration: "+ JSON.stringify(config, null, '  '));
		} +')()')
		.replace('$1', JSON.stringify(config, null, '\t'))
	;
	return code;
};
