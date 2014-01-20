suite("optional arguments", function() {
	suite("required in-between", function() {
		var fn = variadic(function(v) {
			v.string ("one")
			 .number ("two")
			 .boolean("three");

			v.form("?one", "two", "?three");
		}, function(opt, rest, form) {
			return {
				opt: opt,
				rest: rest,
				form: form
			};
		});

		test("form 1: two", function() {
			var res = fn(10);
			assert.equal(res.opt.one, undefined);
			assert.equal(res.opt.two, 10);
			assert.equal(res.opt.three, undefined);
			assert.deepEqual(res.form, ["two"]);
		});

		test("form 2: one, two, three", function() {
			var res = fn("one", 10, true);
			assert.equal(res.opt.one, "one");
			assert.equal(res.opt.two, 10);
			assert.equal(res.opt.three, true);
			assert.deepEqual(res.form, ["one", "two", "three"]);
		});

		test("randomInt", function() {
			var randomInt = variadic(function(v) {
				v.number("min", 0).number("max");
				v.form("?min", "max");
			}, function(opt) {
				return opt;
			});

			var res;

			res = randomInt(10);
			assert.equal(res.min, 0);
			assert.equal(res.max, 10);

			res = randomInt(15, 30);
			assert.equal(res.min, 15);
			assert.equal(res.max, 30);
		});
	});
});
