/** # Utilities

Miscelaneous functions and definitions.
*/

/** An UMD wrapper takes a function that builds the module taking its dependencies as arguments. It
checks the Javascript environment and guesses which module definition method to use: AMD, CommonJS
or script tags.
*/
var makeUMDWrapper = exports.makeUMDWrapper = function makeUMDWrapper(deps) {
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
		f(grunt, params);
	} catch (error) {
		grunt.log.error('Error while calling '+ f.name +':\n'+ error.stack);
		throw error;
	}
}
