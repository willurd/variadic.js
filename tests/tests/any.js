suite("any", function() {
	var Test = {};

	function SimpleTest(property, operator, value, valueIsLiteral) {
		this.property = property;
		this.operator = operator;
		this.value = value;
		this.valueIsLiteral = valueIsLiteral;
	}

	suite("any type", function() {
		Test.create = variadic(function(v) {
			v.string ("property")
			 .string ("operator")
			 .any    ("value")
			 .boolean("valueIsLiteral", false)
			 .forms();
		}, function(opt) {
			return new SimpleTest(opt.property, opt.operator, opt.value, opt.valueIsLiteral);
		});

		function testTest(p, value, valueIsLiteral) {
			assert.equal(p.property, "Number");
			assert.equal(p.operator, "gt");
			assert.equal(p.value, value);

			if (valueIsLiteral) {
				assert.isTrue(p.valueIsLiteral);
			} else {
				assert.isFalse(p.valueIsLiteral);
			}
		}

		test("any", function() {
			testTest(Test.create("Number", "gt", 100), 100);
		});

		test("boolean", function() {
			testTest(Test.create("Number", "gt", true), undefined, true);
		});

		test("any and boolean", function() {
			testTest(Test.create("Number", "gt", 100, true), 100, true);
		});
	});
});
