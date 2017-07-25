/** # Project initialization
*/

var projectArgs = export.projectArgs = function projectArgs(args, ask) { //TODO
	args = Object.assign({ // Defaults
		description: "",
		dependencies: {},
		devDependencies: {
			'creatartis-grunt': '~0.0.1'
		},
		files: "",
		keywords: []
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

var packageJSON = exports.packageJSON = function packageJSON(args) { //TODO
	ask = !!ask;
	args = args || {};

	if (fs.existsSync('./package.json')) {
		args = Object.assign(args, JSON.parse(
			fs.readFileSync('./package.json', { encoding: 'utf-8' })
		));
	}
	fs.writeFileSync('./package.json', JSON.stringify(args, null, '\t'));
};

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

var project = exports.project = {};

project.license = function license(args) {
	var name = args && args.name || '??',
		authorName = args && args.author && args.author.name || '??',
		authorEmail = args && args.author && args.author.email || '??',
		year = (new Date()).getFullYear();
	return [
		'The MIT License', '===============', '',
		'Source code for '+ name +'.js is Copyright (C) '+ year +' ['+ authorName 
			+'](mailto:'+ authorEmail +').', '',
		'Permission is hereby granted, free of charge, to any person obtaining a copy of this'
			+' software and associated documentation files (the "Software"), to deal in the'
			+' Software without restriction, including without limitation the rights to use, copy,'
			+' modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,'
			+' and to permit persons to whom the Software is furnished to do so, subject to the'
			+' following conditions:', '',
		'The above copyright notice and this permission notice shall be included in all copies or'
			+' substantial portions of the Software.', '',
		'**THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,'
			+' INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A'
			+' PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT'
			+' HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION'
			+' OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE'
			+' SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.**'
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
		'This software is being continually developed. Suggestions and comments are always welcome'
			+' via [email](mailto:'+ authorEmail +').', '',
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

project.karma_tester = function karma_tester(args) {
	return [
		'('+ (function () {
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
}) +')();'
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
	
	writeFile('./test/karma-tester.js', project.karma_tester(args), true);
});