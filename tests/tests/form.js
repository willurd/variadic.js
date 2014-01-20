suite("form", function() {
	var func = variadic(function(v) {
		v.object("options");
		v.array("deps");
		v.func("fn");

		v.form("fn");
		v.form("deps", "fn");
		v.form("options", "deps", "fn");
	}, function(opt, rest, form) {
		return form;
	});

	test("form 1", function() {
		var form = func(function() {});
		assert.equal(form.length, 1);
		assert.deepEqual(form, ["fn"]);
	});

	test("form 2", function() {
		var form = func([], function() {});
		assert.equal(form.length, 2);
		assert.deepEqual(form, ["deps", "fn"]);
	});

	test("form 3", function() {
		var form = func({}, [], function() {});
		assert.equal(form.length, 3);
		assert.deepEqual(form, ["options", "deps", "fn"]);
	});
});
