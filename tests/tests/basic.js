suite("basic use case", function() {
	var fn, deps, options;

	var func = variadic(function(v) {
		v.object("options");
		v.array("deps");
		v.func("fn");

		v.form("fn");
		v.form("deps", "fn");
		v.form("options", "deps", "fn");
	}, function(opt, rest, form) {
		fn = opt.fn;
		deps = opt.deps;
		options = opt.options;
		return rest;
	});

	setup(function() {
		fn = undefined;
		deps = undefined;
		options = undefined;
	});

	test("form 1", function() {
		var theFn = function() {};
		func(theFn);

		assert.equal(theFn, fn);
	});

	test("form 2", function() {
		var theDeps = [];
		var theFn = function() {};
		func(theDeps, theFn);

		assert.equal(theDeps, deps);
		assert.equal(theFn, fn);
	});

	test("form 3", function() {
		var theOptions = {};
		var theDeps = [];
		var theFn = function() {};
		func(theOptions, theDeps, theFn);

		assert.equal(theOptions, options);
		assert.equal(theDeps, deps);
		assert.equal(theFn, fn);
	});
});
