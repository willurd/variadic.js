
suite("example: filtering a list", function() {
	function Person(name, age) {
		this.name = name;
		this.age = age;
	}

	Person.prototype.toString = function() {
		return this.name;
	};

	var peopleList = [
		new Person("bob", 20),
		new Person("sally", 24),
		new Person("joe", 21),
		new Person("joeseph", 29),
		new Person("jane", 17),
		new Person("sue", 26),
		new Person("john", 25),
		new Person("joe", 16),
		new Person("joe", 29)
	];

	var filterPeople = variadic(function(v) {
		v.array ("list")
		 .regExp("name", /./)               // default: match anything
		 .number("minAge", 0)               // default: can't be less than zero years old
		 .number("maxAge", 999);            // default: unless you've been cryogenically frozen...

		v.form("?name", "?minAge", "?maxAge")
		 .nonEmpty();
	}, function(opt, rest, form) {
		return peopleList.filter(function(person) {
			return (opt.name.test(person.name)) &&
				   (person.age >= opt.minAge) &&
				   (person.age <= opt.maxAge);
		}).map(function(person) {
			return person.toString() + "," + person.age;
		});
	});

	test("form 1: name", function() {
		var people = filterPeople(/\bjoe\b/);
		assert.deepEqual(people, ["joe,21", "joe,16", "joe,29"]);
	});

	test("form 2: minAge", function() {
		var people = filterPeople(18);
		assert.deepEqual(people, ["bob,20", "sally,24", "joe,21", "joeseph,29", "sue,26", "john,25", "joe,29"]);
	});

	test("form 3: name, minAge", function() {
		var people = filterPeople(/\bjoe\b/, 18);
		assert.deepEqual(people, ["joe,21", "joe,29"]);
	});

	test("form 4: minAge, maxAge", function() {
		var people = filterPeople(18, 25);
		assert.deepEqual(people, ["bob,20", "sally,24", "joe,21", "john,25"]);
	});

	test("form 5: name, minAge, maxAge", function() {
		var people = filterPeople(/\bjoe\b/, 0, 18);
		assert.deepEqual(people, ["joe,16"]);
	});

	test("Can't be empty", function() {
		assert.throw(filterPeople, Error, "Arguments '' do not match any specified form");
	});
});
