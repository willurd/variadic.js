suite("default defaults", function() {
	var func = variadic(function(v) {
		v.object("options");
		v.array("deps");
		v.func("fn");

		v.form("fn");
		v.form("deps", "fn");
		v.form("options", "deps", "fn");
	}, function(opt, rest, form) {
		return opt;
	});

	test("form 1", function() {
		var opt = func(function() {});
		assert.isUndefined(opt.deps);
		assert.isUndefined(opt.options);
	});

	test("form 2", function() {
		var opt = func([], function() {});
		assert.isUndefined(opt.options);
	});
});
