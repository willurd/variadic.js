suite("rest", function() {
	var func = variadic(function(v) {
		v.object("options");
		v.array("deps");
		v.func("fn");

		v.form("fn");
		v.form("deps", "fn");
		v.form("options", "deps", "fn");
	}, function(opt, rest, form) {
		return rest;
	});

	test("form 1", function() {
		var rest = func(function() {}, "one", "two", "three");
		assert.equal(rest.length, 3);
		assert.deepEqual(rest, ["one", "two", "three"]);
	});

	test("form 2", function() {
		var rest = func([], function() {}, "one", "two", "three");
		assert.equal(rest.length, 3);
		assert.deepEqual(rest, ["one", "two", "three"]);
	});

	test("form 3", function() {
		var rest = func({}, [], function() {}, "one", "two", "three");
		assert.equal(rest.length, 3);
		assert.deepEqual(rest, ["one", "two", "three"]);
	});
});
