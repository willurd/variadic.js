suite("context", function() {
	var MyClass = variadic(function(v) {
		v.number("x")
		 .number("y");

		v.form("x", "y");
	}, function(opt) {
		this.x = opt.x;
		this.y = opt.y;
	});

	MyClass.prototype.add = variadic(function(v) {
		v.number("x")
		 .number("y", 5);

		v.form("x", "?y");
	}, function(opt) {
		this.x += opt.x;
		this.y += opt.y;
	});

	test("constructors have correct 'this'", function() {
		var c = new MyClass(1, 2);
		assert.equal(c.x, 1);
		assert.equal(c.y, 2);
	});

	test("instance methods have correct 'this'", function() {
		var c = new MyClass(1, 2);
		c.add(2);       // x =  3, y =  7
		c.add(7, 12);   // x = 10, y = 19
		assert.equal(c.x, 10);
		assert.equal(c.y, 19);
	});
});
