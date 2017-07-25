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

project._args = function _args(args, ask) { //TODO
	args = Object.assign({ // Defaults
		description: "",
		dependencies: {},
		devDependencies: {
			'creatartis-grunt': '~0.0.1'
		},
		files: "",
		keywords: [],
		license: 'MIT',
		repository: { type: 'git' },
		scripts: {},
		version: '0.0.1'
	}, args);
	if (args.name && !args.main) {
		args.main = 'build/'+ args.name +'.js';
	}
	return args;
};

project.license = function license(args) {
	var name = args && args.name || '??',
		authorName = args && args.author && args.author.name || '??',
		authorEmail = args && args.author && args.author.email || '??',
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
	var name = args && args.name || '??',
		description = args && args.description || '...',
		authorName = args && args.author && args.author.name || '??',
		authorEmail = args && args.author && args.author.email || '??',
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
	var name = args && args.name || '??';
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
			//TODO Dependencies.
		]
	});

	grunt.registerTask('default', ['build']);
}) +';\n';
};

project.__prologue__ = function __prologue__(args) {
	return [ //FIXME deps
		'function __init__(/* deps */){ "use strict";', '', '// See __epilogue__.js'
	].join('\n');
};

project.__epilogue__ = function __epilogue__(args) {
	return [
		'// See __prologue__.js', '', '\treturn exports;', '}'
	].join('\n');
};

project.console = function console(args) {
	var name = args && args.name || '??',
		repo = ''; //FIXME
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
		'\t<h1><a href="'+ repo +'" target="_blank">'+ name +'</a> tester</h1>',
		'\t<p>Open your browser Javascript console. In Windows use: Ctrl+Shift+J in Chrome,'+
			' Ctrl+Shift+K in Firefox, F12 in Internet Explorer, Ctrl+Shift+I in Opera.</p>',
		'\t<table id="reference"><tr>',
		'\t\t<td><a href="javascript:console.info(\''+ name +'\');console.dir('+ name +
			');">ludorum</a></td>',
		'\t\t<td>'+ description +'</td>',
		'\t</tr></table>',
		'\t<p style="text-align:center;"><a href="mailto:'+ authorEmail +'">&copy; '+ year +
			' '+ authorName +'</a> - <a href="'+ repo +'" target="_blank">'+ name +
			'.js@GitHub</a>',
		'\t</p>',
		'<script type="text/javascript"> "use strict"; '+ main +'</script>',
		'</body></html>'
	].join('\n');
};

project.karma_tester = function karma_tester(args) {
	var main = function () {
	require.config({ // Configure RequireJS.
		baseUrl: '/base',
		paths: { /* Dependencies' paths */	}
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
};
	return [
		'('+ main +')();'
	].join('\n');
};

exports.newProject = function newProject(args) { //TODO
	mkdir('./src/', true);
	mkdir('./test/', true);
	mkdir('./test/lib/', true);
	mkdir('./test/specs/', true);
	mkdir('./test/perf/', true);
	mkdir('./build/', true);
	mkdir('./docs/', true);

	writeFile('./LICENSE.md', project.license(args), true);
	writeFile('./README.md', project.readme(args), true);
	writeFile('./.gitignore', project.gitignore(args), true);
	writeFile('./.npmignore', project.npmignore(args), true);
	writeFile('./.gitattributes', project.gitattributes(args), true);
	writeFile('./Gruntfile.js', project.gruntfile(args), true);

	writeFile('./src/__prologue__.js', project.__prologue__(args), true);
	writeFile('./src/__epilogue__.js', project.__epilogue__(args), true);

	writeFile('./test/console.html', project.console(args), true);
	writeFile('./test/karma-tester.js', project.karma_tester(args), true);
};
