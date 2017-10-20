/** # RequireJS configuration
*/

/** `requireConfig` generates a script for configuring RequireJS. Mostly used for setting the
`paths` in tests.
*/
var requireConfig = exports.requireConfig = function requireConfig(config) {
	return '// Generated code, please do NOT modify.\n('+
(function (config) { "use strict";
	define([], function () {
		if (window.__karma__) {
			config.baseUrl = '/base';
			for (var p in config.paths) {
				config.paths[p] = config.paths[p]
					.replace(/^\.\.\//, '/base/');
			}
			config.deps = Object.keys(window.__karma__.files) // Dynamically load all test files
				.filter(function (file) { // Filter test modules.
					return /\.test\.js$/.test(file);
				}).map(function (file) { // Normalize paths to RequireJS module names.
					return file.replace(/^\/base\/(.*?)\.js$/, '$1');
				});
		}
		require.config(config);
		console.log("RequireJS configuration: "+ JSON.stringify(config, null, '  '));

		return function (deps, main) {
			require(deps, function () {
				var args = Array.prototype.slice.call(arguments);
				args.forEach(function (module, i) {
					name = module.__name__ || deps[i];
					if (window.hasOwnProperty(name)) {
						console.error("Global `"+ name +"` already defined!");
					} else {
						window[name] = module;
						console.log("Loaded library `"+ deps[i] +"` is available as `window."+
							name +"`.");
					}
				});
				main.apply(window, args);
				console.log("Ready.");
			}, function (err) {
				console.error(err);
			});
		};
	});
}) +')('+ JSON.stringify(config, null, '\t').replace(/\n/g, '\n\t\t') +');';
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
				path: params.requirejs || params.paths.test +'require-config.js',
				config: {
					paths: {}
				}
			},
			dirPath = path.dirname(conf.path),
			dep, name;
		conf.config.paths[params.pkgName] = path.relative(dirPath, params.paths.build + params.pkgName)
			.replace(/\\/g, '/') // For Windows' paths.
			.replace(/\.js$/, '');
		for (var id in allDeps) {
			dep = allDeps[id];
			conf.config.paths[_parse_pkgName(dep.id).name] = path.relative(dirPath, dep.path)
				.replace(/\\/g, '/') // For Windows' paths.
				.replace(/\.js$/, '');
		}
		conf = { requirejs: { build: conf }};
		params.log('config_requirejs', conf);
		grunt.config.merge(conf);
		grunt.registerMultiTask("requirejs", function () {
			grunt.file.write(this.data.path, requireConfig(this.data.config));
			grunt.log.ok("Generated script "+ this.data.path +".");
		});
		return true;
	}
};
