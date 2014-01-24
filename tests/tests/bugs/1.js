suite("bug #1", function() {
	suite("errors throw an exception", function() {
		test("arguments don't match any form", function() {
			var t = variadic(function(v) {
				v.string("test")
				 .form("test");
			}, function() {});

			assert.throw(function() {
				t(1);
			}, Error, "Arguments '1' do not match any specified form");
		});

		test("unknown parameter", function() {
			var t = variadic(function(v) {
				v.form("test");
			}, function() {});

			assert.throw(function() {
				t(1);
			}, Error, "Unknown parameter: test");
		});

		test("invalid descriptor", function() {
			var t = variadic(function(v) {
				v.add("age", {
					description: "a person's age"
				});

				v.form("age");
			}, function() {});

			assert.throw(function() {
				t(21);
			}, Error, "Invalid descriptor 'age'. Must contain a type, cls, or test property for matching arguments");
		});
	});
});
