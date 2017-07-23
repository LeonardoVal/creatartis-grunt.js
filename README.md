# creatartis-grunt.js

[Grunt](https://gruntjs.com/) build setup for creatartis' projects. Includes source code
[concatenation](https://github.com/gruntjs/grunt-contrib-concat),
[linting](https://github.com/gruntjs/grunt-contrib-jshint),
[minimization](https://github.com/gruntjs/grunt-contrib-uglify),
[running test cases in browsers](https://github.com/karma-runner/grunt-karma) and
[documentation generation](https://github.com/Prevole/grunt-docker).

The `Gruntfile` can be abbreviated to something like this:

```javascript
module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
	});
	require('creatartis-grunt').config(grunt, {
		src: [
			'src/__prologue__.js',
			/* ... source files ... */
			'src/__epilogue__.js'
		],
		deps: [
			{	name: 'dependency',
				path: 'node_modules/dependency/build/dependency.js'
			},
			/* ... more dependencies ... */
		]
	});
	grunt.registerTask('default', ['build']);
};
```

Copyright 2017 - [Leonardo Val](https://github.com/LeonardoVal)
