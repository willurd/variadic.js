var TAB_SIZE_CSS = 'pre{-moz-tab-size:4;-o-tab-size:4;-webkit-tab-size:4;-ms-tab-size:4;tab-size:4;}';

function mochaCommand(reporter) {
	return "./node_modules/mocha/bin/mocha --ui tdd --reporter " + reporter + " --recursive tests";
}

function docsCommand(command) {
	if (typeof command !== "string") {
		command = command.join(" && ");
	}

	return "mkdir -p docs && " + command;
}

module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),

		files: {
			src: ["src/**/*.js"],
			tests: ["tests/tests/**/*.js"],
			watch: ["Gruntfile.js", "<%= files.src %>", "<%= files.tests %>"]
		},

		concat: {
			dist: {
				src: ["<%= files.src %>"],
				dest: "dist/variadic.js"
			}
		},

		jshint: {
			options: {
				sub: true,
				boss: true,
				smarttabs: true
			},
			files: ["<%= files.watch %>"],
		},

		uglify: {
			options: {
				banner: '/* Variadic.js - by William Bowers */\n'
			},
			dist: {
				files: {
					"dist/variadic.min.js": ["<%= concat.dist.dest %>"]
				}
			}
		},

		exec: {
			"test": {
				command: mochaCommand("dot")
			},
			"test-verbose": {
				command: mochaCommand("spec")
			},
			"coverage": {
				command: docsCommand([
					"jscoverage --no-highlight src src-cov",
					"COVERAGE=1 " + mochaCommand("html-cov") + " > docs/coverage.html"
				])
			},
			"docco": {
				command: docsCommand([
					"./node_modules/docco/bin/docco <%= concat.dist.dest %>",
					'echo "' + TAB_SIZE_CSS + '" >> docs/docco.css'
				])
			}
		},

		watch: {
			build: {
				files: "<%= files.watch %>",
				tasks: "build"
			},
			test: {
				files: "<%= files.watch %>",
				tasks: "test"
			}
		}
	});

	grunt.loadNpmTasks("grunt-contrib-concat");
	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-exec");

	grunt.registerTask("test", "exec:test");
	grunt.registerTask("test-verbose", "exec:test-verbose");

	grunt.registerTask("docs:annotated-source", "exec:docco");
	grunt.registerTask("docs:coverage", "exec:coverage");
	grunt.registerTask("docs", ["build", "docs:annotated-source", "docs:coverage"]);

	grunt.registerTask("lint", "jshint");
	grunt.registerTask("min", "uglify");
	grunt.registerTask("build", ["lint", "concat", "min"]);
	grunt.registerTask("default", "watch:build");
};
