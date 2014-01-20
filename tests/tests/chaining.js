suite("chaining", function() {
	suite("configuration functions return the configuration object", function() {
		var v;

		setup(function() {
			// Get a reference to the variadic configuration object.
			variadic(function(vv) { v = vv; }, function() {});
		});

		test("form", function() {
			assert.equal(v, v.form("name"));
		});

		test("add", function() {
			assert.equal(v, v.add("name", { type: "string", description: "a string" }));
		});

		test("type", function() {
			assert.equal(v, v.type("name", "string", "a string"));
		});

		test("test", function() {
			assert.equal(v, v.test("name", function(value) {}));
		});

		test("cls", function() {
			assert.equal(v, v.cls("name", Date));
		});

		test("object", function() {
			assert.equal(v, v.object("name"));
		});

		test("array", function() {
			assert.equal(v, v.array("name"));
		});

		test("func", function() {
			assert.equal(v, v.func("name"));
		});

		test("string", function() {
			assert.equal(v, v.string("name"));
		});

		test("number", function() {
			assert.equal(v, v.number("name"));
		});

		test("boolean", function() {
			assert.equal(v, v.boolean("name"));
		});

		test("regExp", function() {
			assert.equal(v, v.regExp("name"));
		});

		test("date", function() {
			assert.equal(v, v.date("name"));
		});

		test("match", function() {
			assert.equal(v, v.match("name", /./));
		});
	});
});
