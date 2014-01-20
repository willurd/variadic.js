suite("similar forms", function() {
	var theFn = function() {};
	var theOptions = {};

	var func = variadic(function(v) {
		v.object("options");
		v.func("fn");

		v.form("fn", "options");
		v.form("options", "fn");
	}, function(opt, rest, form) {
		return opt;
	});

	test("form 1", function() {
		var opt = func(theFn, theOptions);
		assert.equal(opt.fn, theFn);
		assert.equal(opt.options, theOptions);
	});

	test("form 2", function() {
		var opt = func(theOptions, theFn);
		assert.equal(opt.fn, theFn);
		assert.equal(opt.options, theOptions);
	});
});
