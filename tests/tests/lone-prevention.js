suite("lone prevention", function() {
    test("list can't be alone", function() {
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
            v.array ("list")                    // the list to filter
             .regExp("name",   /./)             // default: match anything
             .number("minAge",   0)             // default: can't be less than zero
             .number("maxAge", 999);            // default: unless you've been cryogenically frozen...

            v.form("*list", "?name", "?minAge", "?maxAge");
        }, function(opt, rest, form) {
            console.log(opt);
            return opt.list.filter(function(person) {
                return (opt.name.test(person.name)) &&
                       (person.age >= opt.minAge) &&
                       (person.age <= opt.maxAge);
            });
        });

        assert.throw(function() {
            filterPeople(peopleList);
        }, Error, "do not match any specified form");
    });

    test("multiple no-lone parameters", function() {
        var testFn = variadic(function(v) {
            v.string ("one")
             .number ("two")
             .boolean("three")
             .string ("four");

            v.form("*one", "*two", "?three", "?four");
        }, function(opt, rest, form) {
            return {
                opt: opt,
                rest: rest,
                form: form
            };
        });

        var res;

        res = testFn("one", 2, true);
        assert.equal(res.opt.one, "one");
        assert.equal(res.opt.two, 2);
        assert.equal(res.opt.three, true);
        assert.equal(res.opt.four, undefined);
        assert.deepEqual(res.form, ["one", "two", "three"])

        res = testFn("one", 2, false, "four");
        assert.equal(res.opt.one, "one");
        assert.equal(res.opt.two, 2);
        assert.equal(res.opt.three, false);
        assert.equal(res.opt.four, "four");
        assert.deepEqual(res.form, ["one", "two", "three", "four"])

        assert.throw(function() {
            testFn("one", 2);
        }, Error, "do not match any specified form");
    });
});
