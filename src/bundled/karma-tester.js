(function () { "use strict";
	// Polyfill (particularly for PhantomJS) //////////////////////////////////////////////////////

	// See <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind>
	if (!Function.prototype.bind) {
		Function.prototype.bind = function bind(oThis) {
			if (typeof this !== 'function') {
				throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
			}
			var aArgs   = Array.prototype.slice.call(arguments, 1),
				fToBind = this,
				fNOP    = function() {},
				fBound  = function() {
					return fToBind.apply(this instanceof fNOP ? this
						: oThis, aArgs.concat(Array.prototype.slice.call(arguments))
					);
				};
			fNOP.prototype = this.prototype;
			fBound.prototype = new fNOP();
			return fBound;
		};
	}

	// Testing environment extensions and custom definitions. /////////////////////////////////////

	beforeEach(function() { // Add custom matchers.
		jasmine.addMatchers({
			toBeOfType: function (util, customEqualityTesters) {
				return {
					compare: function (actual, expected) {
						switch (typeof expected) {
							case 'function': return {
								pass: actual instanceof expected,
								message: "Expected type "+ expected.name +" but got "+ actual.constructor.name +"."
							};
							case 'string': return {
								pass: typeof actual === expected,
								message: "Expected type '"+ expected +"' but got '"+ typeof actual +"'."
							};
							default: return {
								pass: false,
								message: "Unknown type "+ expected +"!"
							};
						}
					}
				};
			}
		});
	});

	// Actual testing brought to you by RequireJS. ////////////////////////////////////////////////

	var config = {
		baseUrl: '/base',
		paths: { }
	};
	Object.keys(window.__karma__.files).forEach(function (path) {
		if (!/(karma-tester|\.test)\.js$/.test(path)) {
			var m = /^\/base\/(?:node_modules\/(?:@.+?\/)?(.*?)\/|build\/(.*?)\.js$)/.exec(path);
			if (m) {
				config.paths[m[1] || m[2]] = path.replace(/\.js$/, '');
			}
		}
	});
	console.log("RequireJS config: "+ JSON.stringify(config, null, '\t'));
	require.config(config);

	require(Object.keys(window.__karma__.files) // Dynamically load all test files
			.filter(function (file) { // Filter test modules.
				return /\.test\.js$/.test(file);
			}).map(function (file) { // Normalize paths to RequireJS module names.
				return file.replace(/^\/base\//, '').replace(/\.js$/, '');
			}),
		function () {
			window.__karma__.start();
		}
	);
})();