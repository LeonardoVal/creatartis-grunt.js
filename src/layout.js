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
