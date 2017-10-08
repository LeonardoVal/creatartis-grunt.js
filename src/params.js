/** # Parameters

The method `config` takes the following parameters.
*/

/** + `pkgName` is by default equal to `pkg.name` taken from the `package.json` file by Grunt. If
	the text has the form `@scope/name`, it is split in the parameters `pkgScope` and `pkgName`.
*/
var __param_pkgName__ = exports.__param_pkgName__ = function __param_pkgName__(params, grunt) {
	var pkgName = params.pkgName || grunt.config('pkg.name');
	if (!params.pkgScope) {
		m = _parse_pkgName(params.pkgName);
		if (m) {
			params.pkgName = m.name;
			params.pkgScope = m.scope;
		}
	}
	return params;
};

/** + `pkg_version` is equal to `pkg.version` taken from the `package.json` file by Grunt.
*/
var __param_pkgVersion__ = exports.__param_pkgVersion__ = function __param_pkgVersion__(params, grunt) {
	params.pkgVersion = params.pkgVersion || grunt.config('pkg.version');
	return params;
};

/** + `sourceFiles` is a list of path of sources to concatenate to make the package. If the
	parameter `sourceNames` is given, it is used to make paths like `src/name.js`.
*/
var __param_sourceFiles__ = exports.__param_sourceFiles__ = function __param_sourceFiles__(params) {
	if (params.sourceFiles !== false) {
		params.sourceFiles = (params.sourceFiles || [])
			.concat((params.sourceNames || []).map(function (n) {
				return params.paths.src + n +'.js';
			}));
		if (params.sourceFiles.length < 0) {
			throw new Error('`params.sourceFiles` is empty!');
		}
	}
	return params;
};

/** + `paths` defines the layout of the project folder.
*/
var __params_paths__ = exports.__params_paths__ = function __params_paths__(params) {
	var paths = Object.assign({
		build: 'build/',
		src: 'src/',
		test: 'tests/',
		docs: 'docs/'
	}, params.paths);
	params.paths = paths;
	paths.specs = paths.specs || params.test +'specs/';
	paths.perf = paths.perf || params.test +'perf/';
	return params;
};

/** + `builds`
*/
var __param_targets__ = exports.__param_targets__ = function __param_targets__(grunt, params) {
	var targets = params.targets;
	if (!targets) {
		targets = 'umd'; // Make a UMD build by default.
	}
	if (typeof targets === 'string') {
		targets = targets.split(/[\s,.:;]+/);
	}
	if (Array.isArray(targets)) {
		if (targets.length === 1) {
			params.targets = { build: {
				fileName: params.paths.build + params.pkgName,
				wrapper: t
			} };
		} else {
			params.targets = {};
			targets.forEach(function (t) {
				params.targets['build_'+ t] = {
					fileName: params.paths.build + params.pkgName +'-'+ t,
					wrapper: t
				};
			});
		}
		return params;
	}
	if (typeof targets === 'object' && targets) {
		params.targets = {};
		Object.keys(targets).forEach(function (k) {
			var t = params.targets[k];
			params.targets[k] = typeof t === 'string' ? {
				fileName: params.paths.build + params.pkgName +'-'+ t,
				wrapper: t
			} : Object.assign({}, t);
		});
		return params;
	}
	throw new Error('`targets` is invalid!');
};

/** + `jshint` has the JSHint flags.
*/
var __param_jshint__ = exports.__param_jshint__ = function __param_jshint__(params) {
	params.jshint = Object.assign({
		loopfunc: true,
		boss: true
	}, params.jshint);
	return params;
};

/** + `log` is used to debug the configuration. If `true` the `_log` function is used; else it may
	be a function with the signature `(tag, data)`.
*/
var __param_log__ = exports.__param_log__ = function __param_log__(params) {
	if (!params.hasOwnProperty('log')) {
		params.log = (function () {}); // log does nothing by default.
	} else if (params.log === true) {
		params.log = _log;
	} else if (typeof params.log !== 'function') {
		throw new Error('`params.log` must be function!');
	}
	return params;
};

/**
*/
var __params__ = exports.__params__ = function __params__(grunt, params) {
	params = Object.assign({
		bundled: [],
		separator: '\n\n',
		sourceMap: true,
		karma: ['Firefox']
	}, params);

	__param_pkgName__(params, grunt);
	__param_pkgVersion__(params, grunt);
	__params_paths__(params);
	__param_sourceFiles__(params);
	__param_targets__(params);
	__param_jshint__(params);
	__param_log__(params);
	params.deps = normalizeDeps(grunt, params.deps);

	params.log('Parameters', params);
	return params;
};
