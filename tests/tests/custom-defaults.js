suite("custom defaults", function() {
	var defaultOptions = {};
	var defaultDeps = [];

	var func = variadic(function(v) {
		v.object("options", defaultOptions);
		v.array("deps", defaultDeps);
		v.func("fn");

		v.form("fn");
		v.form("deps", "fn");
		v.form("options", "deps", "fn");
	}, function(opt, rest, form) {
		return opt;
	});

	test("form 1", function() {
		var opt = func(function() {});
		assert.equal(opt.options, defaultOptions);
		assert.equal(opt.deps, defaultDeps);
	});

	test("form 2", function() {
		var opt = func([], function() {});
		assert.equal(opt.options, defaultOptions);
	});
});
