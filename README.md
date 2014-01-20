# Variadic.js

A JavaScript library for expressive variadic functions.

## Why?

Because JavaScript doesn't have function overloading.

Dealing with the `arguments` object is weird, argument type checking is a pain, and "optional argument soup" is...soupy. Yeah, you can do all that yourself, but Variadic gives you a terse and expressive way of allowing your functions to cleanly process different arrangements and types of arguments. Variadic's job is to take positional arguments, name them, and stick them in an object so you can access them without using `typeof` or if statements to check whether the right arguments were passed in or whether they were given in one of probably several valid arrangements &mdash; Variadic does all of that for you.

Variadic is completely transparent to users of your functions. All they need to know is what they already do: the set of valid ways they can pass arguments to your function.

Variadic also gives you 'rest' args (as a real-life, honest-to-goodness JavaScript Array; I'm looking at you, Arguments) and default argument values for free.

A side effect of Variadic (or is it?) is that using it produces self-documenting code. Function configuration code acts as an inline document that is very explicit about what types of arguments can be passed in and in what orders.

## How do I use it?

You use Variadic by calling `variadic` when creating a variadic function. `variadic` takes

1. a configuration function so you can tell it about your parameters and forms,
2. the function you're wrapping (your meat-and-potatoes code; the code the brings home the bacon), and
3. an optional context object

```javascript
var yourFunctionName = variadic(function(v) {
    // 'v' is the configuration object for this function.
}, function (opt, rest, form) { // Don't worry about these just yet.
    // Meat and potatoes.
}, context);
```

## Parameters and forms? Huh?

Here are a few Variadic terms:

**Variadic** *(big 'V')*

A sweet library for expressive *variadic functions*.

**variadic** *(little 'v')*

A *variadic function* is ["a function of indefinite arity, i.e., one which accepts a variable number of arguments"][1].

**Parameter**

A *name* and *descriptor*. In Variadic, *arguments* are what function callers pass in, and *parameters* are your configuration objects used to perform type checking and more on those arguments. For example:

```javascript
v.array("authors");
v.func("log", function(message) { console.log(message); });
```

Each of these lines represents a parameter. The first one is named "authors" (`opt.authors` when you use it in your function &mdash; more on that later) and it uses the built-in `array` descriptor. The `array` descriptor simply contains a test function to check whether an argument is an array.

The second parameter is named "log" and matches functions. This parameter has a default value that will be used if it is not passed in.

**Descriptor**

A descriptor is an argument *matcher*. A descriptor tells Variadic how to test arguments to see whether a certain *form* matches what's been passed in. For example:

```javascript
v.func("timeout"); // uses the built-in descriptor for functions
v.add("person", {
    cls: Person,   // a custom descriptor for a Person class (defined elsewhere)
    description: "a person",
    defaultGenerator: function() {
        return new Person("John Doe", NaN);
    }
});
```

**Form**

A declaration of *parameter names* and their order. For example:

```javascript
v.form("url", "query");
```

This says the function has a form that takes two arguments, a "url" and a "query" (defined elsewhere).

**Best match**

When a variadic function is called, the *best match* is the form that most closely resembles the given arguments (every parameter of the form must match its argument, there is no partial form matching). Multiple forms can match, but only one will be used. The rules for matching are pretty simple:

* If a form has more parameters than there are arguments, it doesn't match.
* If all of a form's *N* parameters match the first *N* arguments, it matches.
* The longest matching form is the *best match*.
* If two matching forms have the same length, the first one (in order of configuration) is the *best match*.

## Built-in descriptors

This section needs to be written.

## Custom descriptors

Custom descriptors can define one of the following three argument matching properties:

```javascript
{
    type: "boolean", // will only match booleans (uses typeof)
```

or:

```javascript
{
    cls: Person, // will only match Person instances (uses instanceof)
```

or:

```javascript
{
    test: function(value) {
        value === "awesome"; // will only match the string "bob"
    },
```

They share the rest of their interface:

```javascript
    description: "a something", // should be able to be used in the sentence "must be *a something*"
    defaultValue: 123,          // the value to use if this argument is not passed in
    defaultGenerator: function() {
        return new Something(); // creates a new default value for each function call (if required)
    }
}
```

If a `defaultGenerator` is specified, `defaultValue` will be ignored.

## What variadic passes to your functions

Consider the following code:

```javascript
var query = variadic(function(v) {
    v.date("start")
     .date("end")
     .string("category", "all items");

    v.form("category")                  // form 1: string
     .form("end")                       // form 2: date
     .form("category", "end")           // form 3: string, date
     .form("start", "end")              // form 4: date, date
     .form("category", "start", "end"); // form 5: string, date, date
}, function(opt, rest, form) {
    // this is "your function"
});
```

If you call

```javascript
query("bell bottoms", new Date(1975, 0, 1), "blue", "denim")
```

what are the values of `opt`, `rest`, and `form` inside your function?

Well, forms 1 (string) and 3 (string, date) both match the arguments, but form 3 is the best match because it's longer. That means the value of `form` is:

```javascript
["category", "end"] // form
```

Because form 3 matched, our `opt` object will have two properties:

```javascript
{ // opt
    "category": "bell bottoms",
    "end": new Date(1975, 0, 1)
}
```

And lastly, `rest` contains the unmatched arguments:

```javascript
["blue", "denim"] // rest
```

You can use all of these values in your function (let's rename `rest` to `keywords` and ditch the `form` argument because we don't need it), like so:

```javascript
}, function(opt, keywords) {
    // this is "your function"
    var dateLine = makeDateLine(opt.start, opt.end);
    var keywordLine = (keywords.length > 0) ? (", matching: '" + keywords.join("', '") + "'") : "";

    return "Showing " + opt.category + " in fashion" + dateLine + keywordLine;
});

function makeDateLine(start, end) {
    if (start && end) {
        return " between" + start + " and " + end;
    } else if (end) {
        return " before " + end;
    } else {
        return "";
    }
}
```

This returns *Showing bell bottoms in fashion before Wed Jan 01 1975 00:00:00, matching: 'blue', 'denim'*.

## How argument matching works

### A basic example

Here's a very simple function that we've likely all written 100 times:

```javascript
// Accepts the forms randomInt(max) and randomInt(min, max).
// You have a few choices as far as argument names go, because the
// arguments will be different depending on how you call the function.
// 'a' and 'b' are meaningless, 'maxOrMin' and 'minOrMax' are just weird,
// and 'min' and 'max' suck too because sometimes they are actually
// 'max' and neither (respectively).
var randomInt = function(min, max) {
    if (typeof max === "undefined") {
        max = min;
        min = 0;
        // wat...
    }

    return Math.floor(Math.random() * (max - min) + min);
};
```

rewritten using variadic:

```javascript
var randomInt = variadic(function(v) {
    v.number("min", 0)
     .number("max");

    v.form("max")            // form 1: number
     .form("min", "max");    // form 2: number, number
}, function(opt, rest, form) {
    return Math.floor(Math.random() * (opt.max - opt.min) + opt.min);
});

randomInt(10);               // matches form 1
randomInt(4, 15);            // matches form 2
```

It's a little bit more code (not by much), but it removes *all* of the plumbing code and helps the actual logic of the function stand out. You only have to look at 1 line of code to know what the function does, not 5.

### A less basic example

Here's another simple function (thanks to Variadic) that accepts 4 different arguments in 5 different arrangements.

```javascript
var filterPeople = variadic(function(v) {
    v.array ("list")                    // the list to filter
     .regExp("name",   /./)             // default: match anything
     .number("minAge",   0)             // default: can't be less than zero
     .number("maxAge", 999);            // default: unless you've been cryogenically frozen...

    v.form("list", "name")                      // form 1: array, regExp
     .form("list", "minAge")                    // form 2: array, number
     .form("list", "name", "minAge")            // form 3: array, regExp, number
     .form("list", "minAge", "maxAge")          // form 4: array, number, number
     .form("list", "name", "minAge", "maxAge"); // form 5: array, regExp, number, number
}, function(opt, rest, form) {
    return opt.list.filter(function(person) {
        return (opt.name.test(person.name)) &&
               (person.age >= opt.minAge) &&
               (person.age <= opt.maxAge);
    });
});

filterPeople(/\bjoe\b/);                // matches form 1
filterPeople(18);                       // matches form 2
filterPeople(/\bjoe\b/, 18);            // matches form 3
filterPeople(18, 25);                   // matches form 4
filterPeople(/\bjoe\b/, 18, 25);        // matches form 5
```

Using Variadic's optional (`?`) and "no lone" (`*`) flags, we can simplify that down to:

```javascript
var filterPeople = variadic(function(v) {
    v.array ("list")                    // the list to filter
     .regExp("name",   /./)             // default: match anything
     .number("minAge",   0)             // default: can't be less than zero
     .number("maxAge", 999);            // default: unless you've been cryogenically frozen...

    v.form("*list", "?name", "?minAge", "?maxAge");
}, function(opt, rest, form) {
    return opt.list.filter(function(person) {
        return (opt.name.test(person.name)) &&
               (person.age >= opt.minAge) &&
               (person.age <= opt.maxAge);
    });
});
```

This tells variadic that `list` is required and it can't be alone, and `name`, `minAge`, and `maxAge` are all optional (but because `list` can't be alone, at least one of them must be supplied; this is what Variadic calls "lone prevention").

### Precedence

If two or more forms match:

1. the first form (in order of configuration) has higher precedence than the second, which has higher precendence than the third, and so on
2. the longest form has the highest precedence, even if it comes last

For example:

```javascript
var strings = variadic(function(v) {
    v.string("s1");
    v.string("s2");
    v.string("s3");

    v.form("s1");               // form 1: string
    v.form("s1", "s2");         // form 2: string, string
    v.form("s1", "s2", "s3");   // form 3: string, string, string
}, function(opt, rest, form) {
    // ...
});

strings("one");                 // matches form 1
strings("one", "two");          // matches form 2
strings("one", "two", "three"); // matches form 3
```

### Swapped order

Here's the common `bind` (or `proxy`) function rewritten using Variadic:

```javascript
var bind = variadic(function(v) {
    v.func("fn");
    v.type("context", "object", "an object");      // v.object excludes arrays

    v.form("fn", "context");                       // form 1: function, object
    v.form("context", "fn");                       // form 2: object, function
}, function(opt, rest, form) {
    return function() {
        return opt.fn.apply(opt.context, arguments);
    };
});

// Go ahead, pass your args in either order
this.button.on("click", bind(this.onClick, this)); // matches form 1
this.button.on("click", bind(this, this.onClick)); // matches form 2
```

### Forms with the same signature

A form's signature is the ordered set of descriptors it will apply to a set of arguments. If you have two forms with the same signature, the second form will never match.

## Variadic in action

Here's a function that works with 5 different argument types and 6 different arrangements of arguments with absolutely no code in the function body having to distinguish between them.

```javascript
var ajax = variadic(function(v) {
    v.string("type")
     .string("url")
     .object("data", null)
     .func  ("success", function() {})
     .func  ("error", function() {});

    v.form("type", "url", "?data", "?success", "?error");
}, function(opt, rest, form) {
    // Not a 'typeof' or if statement in sight!
    // Also, don't use this ajax code in production. Or anywhere. Ever.
    var xhr = new XMLHttpRequest();
    xhr.open(opt.type, opt.url, true);
    xhr.onreadystatechange = function() {
        // Ok there are some if statements here, but you know what I meant!
        if (xhr.readyState == 4) {
            if (xhr.status == 200) opt.success(xhr);
            else                   opt.error(xhr);
        }
    };
    xhr.send(opt.data);
    return xhr;
});

// Valid calls to the new ajax function:
ajax("get", "http://baconipsum.com/api/?type=meat-and-filler");
ajax("get", "http://baconipsum.com/api/?type=meat-and-filler", onSuccess);
ajax("get", "http://baconipsum.com/api/?type=meat-and-filler", { get: "data" });
ajax("get", "http://baconipsum.com/api/?type=meat-and-filler", { get: "data" }, onSuccess);
ajax("get", "http://baconipsum.com/api/?type=meat-and-filler", onSuccess, onError);
ajax("get", "http://baconipsum.com/api/?type=meat-and-filler", { get: "data" }, onSuccess, onError);
```

That's it [in a nutshell.][2] Check out `/examples/ajax/` to see this code in action.

*Note: This function takes a lot of arguments and the rules about which arguments are optional when and in what order they go are pretty complicated. This particular example is __not__ necessarily an example of good design. It merely serves to show the power, expressiveness, and terseness of Variadic.*

## Project layout

* **common/** - Assets shared between examples, documentation, etc.
* **dist/** - The full (development) and minified (production) versions of Variadic.js
* **docs/** - Documentation. Read the setup guide below for instructions on how to generate the docs.
* **examples/** - Examples of Variadic in action. These are separate from the tests.
* **src/** - The code.
* **tests/** - Contains the unit tests (written using Mocha and Chai).
* **Gruntfile.js** - Grunt tasks (it's like a Makefile, but for the 21st century).
* **LICENSE.txt** - MIT license. Use this code freely.
* **package.json** - Meta information about the project.
* **README.md** - You're reading it.
* **TODO.md** - Stuff I want to get done.

## Setup

If you want to hack on Variadic.js, you first need to get the dev dependencies:

```shell
$ npm install
```

Getting the dev dependencies is enough to generate the annotated source code. If you want to generate the html coverage documentation, you need [jscoverage][3] (here are some great [setup instructions][4]) and a global installation of Mocha.

```shell
$ npm install -g mocha
```

**Generating the docs**

You can generate all documentation at once by running `grunt docs`. See the *Grunt tasks* section for how to generate individual docs.

## Available documentation

* `/docs/variadic.html` - Annotated source code.
* `/docs/coverage.html` - Test coverage.

To view these docs, run a quick webserver at the project root. Here are [a few ways you can do that][5].

## Other project web pages

* `/tests/index.html` - Run the tests in your browser.
* `/examples/ajax/index.html` - The ajax example in this document, put to work.

## Grunt tasks

* `grunt` - Default task: `grunt watch:build`
* `grunt watch:build` - Watch the source and test files (and Gruntfile.js) for changes, and build the project on change.
* `grunt watch:test` - Watch the source and test files (and Gruntfile.js) for changes, and run the headless tests on change.
* `grunt test` - Run the headless tests with compact output.
* `grunt test-verbose` - Run the headless tests with verbose output.
* `grunt docs` - Generate all documentation.
* `grunt docs:annotated-source` - Generate the annotated source.
* `grunt docs:coverage` - Generate the code coverage documentation.
* `grunt lint` - Run lint on the project source code and tests.
* `grunt build` - Concat and minify the source.
* `grunt concat` - Concat the source.
* `grunt min` - Minify the concatenated source.

## License

MIT licensed. See `LICENSE.txt` for the full details.


[1]: http://en.wikipedia.org/wiki/Variadic_function
[2]: http://www.youtube.com/watch?v=jKMK3XGO27k#t=5.2s
[3]: http://siliconforks.com/jscoverage/
[4]: http://www.seejohncode.com/2012/03/13/setting-up-mocha-jscoverage/
[5]: https://gist.github.com/willurd/5720255
