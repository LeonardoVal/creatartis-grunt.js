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
		jasmine.DEFAULT_TIMEOUT_INTERVAL = 8000; // 8 seconds.
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
	var karmaFiles = window.__karma__.files,
		testFiles = [],
		requireConfigPath;
	for (var p in window.__karma__.files) {
		if (/require-config/.test(p)) {
			requireConfigPath = p;
		} else if (/\.test\.js$/.test(p)) {
			testFiles.push(p.replace(/^\/base\/(.*?)\.js$/, '$1'));
		}
	}
	require([requireConfigPath], function () {
		require(testFiles, function () {
			window.__karma__.start();
		});
	});
})();
