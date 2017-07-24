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

exports.newProject = function newProject(args) { //TODO
	//var packageJSON =

};
