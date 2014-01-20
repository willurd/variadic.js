(function() {

// Helpers
// -------

// These are some utility functions variadic uses internally.
var noop = function() {};

var toString = Object.prototype.toString;
var slice = Array.prototype.slice;

var isArray = Array.isArray || function(value) {
	return toString.call(value) === "[object Array]";
};

var isFunction = function(value) {
	return typeof value === "function";
};

var isString = function(value) {
	return typeof value === "string";
};

var isObject = function(value) {
	return value && typeof value === "object" &&
		   !isFunction(value) && !isArray(value);
};

var isBoolean = function(value) {
	return typeof value === "boolean";
};

var isNumber = function(value) {
	return typeof value === "number";
};

var isRegExp = function(value) {
	return value instanceof RegExp;
};

var isNull = function(value) {
	return !value && isObject(value);
};

var isUndefined = function(value) {
	return typeof value === "undefined";
};

var isDefined = function(value) {
	return typeof value !== "undefined";
};

var toArray = function(obj, from) {
	return slice.call(obj, from || 0);
};

var format = function(format) {
	var args = toArray(arguments, 1);

	return (args.length === 0 ?
		format :
		format.replace(/\{(\d+)\}/g, function(match, index) {
			return args[index];
		}));
};

// Entry point
// -----------

// Call this function to configure and return a new variadic function.
function variadic(configFn, fn, context) {
	var config = new Config();
	configFn(config);

	// The caller just configured variadic. Let's let them know early on if
	// they've made a mistake.
	config.validate();

	// This wrapper function is what's actually returned by variadic (it's
	// what callers will think of as "their" function). Its responsibility is
	// to forward arguments to the config object for processing.
	return function() {
		return config.process(toArray(arguments), fn, context || this);
	};
}

// Error reporting
// ---------------

// You can override variadic's error handling by setting `variadic.error` to
// your own function.
variadic.error = function(message) {
	log.error(message);
};

// Function Configuration
// ----------------------

var exactMatch = {}; // a token for telling if a form is an exact match

// A new instance of this object is passed into configuration functions, like so:
//
// ```javascript
// variadic(function(v) {
//     // v is an instance of Config ('v' for 'variadic'). Use it to add parameters and forms.
// }, function() {
//     ...
// });
// ```
function Config() {
	this._parameterNames = [];
	this._descriptors = {};
	this._forms = [];
	this._formMap = {};
	this._flags = [
		{ name: "optional", symbol: "?" },
		{ name: "noLone",   symbol: "*" }
	];

	var flagsList = this._flags.map(function(flag) {
		return "\\" + flag.symbol;
	}).join("");
	this._flagsRegex = new RegExp("^([" + flagsList + "]+)");

	this._flagsMap = {};
	for (var i = 0, len = this._flags.length; i < len; i++) {
		var flag = this._flags[i];
		this._flagsMap[flag.symbol] = flag.name;
	}
}

Config.fn = Config.prototype;

// Get the flags from a parameter name.
Config.fn.getFlags = function(name) {
	var flagsObject = {};
	var match = name.match(this._flagsRegex);

	if (!match) {
		return flagsObject;
	}

	var flagsList = match[0].split("");

	for (var i = 0, len = flagsList.length; i < len; i++) {
		var key = this._flagsMap[flagsList[i]];
		flagsObject[key] = true;
	}

	return flagsObject;
};

// Remove the flags from a parameter name.
Config.fn.removeFlags = function(name) {
	return name.replace(this._flagsRegex, "");
};

// TODO: Make sure all of the forms are valid (no duplicates, all args have
// descriptors, etc).
Config.fn.validate = function() {
};

Config.fn.process = function(args, fn, context) {
	var form = this.getBestMatch(args);

	if (!form) {
		variadic.error(format("Arguments '{0}' do not match any specified form", args.join(", ")));
		return;
	}

	var result = this.processArguments(form, args);
	var names = form.names || [];

	return fn.call(context, result.opt, result.rest, names, args);
};

// Get the form that is the best match for the given arguments. This
// is necessary because multiple forms can match. Only after we have
// the best match will we actually process the arguments and pass them
// along to the user function.
Config.fn.getBestMatch = function(args) {
	var bestMatch;
	var bestRating;
	var forms = this._forms;

	for (var i = 0, len = forms.length; i < len; i++) {
		var form = forms[i];

		if (form.nonEmpty) {
			if (args.length === 0) {
				return false;
			}

			continue;
		}

		var a = this.rateForm(form, args);

		if (a === exactMatch) {
			// This is an exact match for the arguments. Nothing can
			// beat this form so we might as well exit early.
			return form;
		}

		var b = bestMatch ? bestRating : -1;

		if (a != -1 && a > b) {
			bestMatch = form;
			bestRating = a;
		}
	}

	return bestMatch;
};

/**
 * -1 == no match
 *  1 point for each matching parameter that isn't an 'any' parameter
 */
Config.fn.rateForm = function(form, args) {
	if (args.length === 0) {
		if (form.empty) {
			return exactMatch;
		} else {
			return -1;
		}
	}

	if (form.empty) {
		return -1;
	} if (form.any) {
		// 0 is the lowest possible match rating.
		return 0;
	}

	var names = form.names;

	// `v.form("one", "two", "?three", "four", "?five")` is the same as:
	//
	// ```javascript
	// v.form("one", "two", four")
	// v.form("one", "two", four", "five")
	// v.form("one", "two", "three", "four")
	// v.form("one", "two", "three", "four", "five")
	// ```

	var rating = -1;

	if (args) {
		for (var i = 0; i < names.length; i++) {
			var arg = args[i];
			var name = names[i];
			var desc = this._descriptors[name];

			if (!desc) {
				variadic.error(format("Unknown parameter: {0}", name));
				return -1;
			}

			if (!this.checkArg(name, desc, arg)) {
				return -1;
			} else if (!desc.any) {
				rating++;
			}
		}
	} else {
		variadic.error(format("Unknown form: {0}", form));
	}

	return rating;
};

Config.fn.processArguments = function(form, args) {
	var names = (form.names || []);
	var result = {
		opt: {},
		rest: args.slice(names.length)
	};

	for (var prop in this._descriptors) {
		var defaultValue = this.getDefaultValue(this._descriptors[prop]);

		if (isDefined(defaultValue)) {
			result.opt[prop] = defaultValue;
		}
	}

	if (!form.empty) {
		for (var i = 0, name; name = names[i]; i++) {
			result.opt[name] = args[i];
		}
	}

	return result;
};

Config.fn.getDefaultValue = function(descriptor) {
	if (isFunction(descriptor.defaultGenerator)) {
		return descriptor.defaultGenerator();
	} else {
		return descriptor.defaultValue;
	}
};

Config.fn.checkArg = function(name, descriptor, value) {
	if (descriptor.any) {
		return true;
	} else if ("type" in descriptor) {
		if (value !== null && typeof value === descriptor.type) {
			return true;
		}
	} else if ("cls" in descriptor) {
		if (value instanceof descriptor.cls) {
			return true;
		}
	} else if ("test" in descriptor) {
		if (descriptor.test(value)) {
			return true;
		}
	} else {
		var str = "Invalid descriptor '{0}'. Must contain a type, cls, or test property for matching arguments";
		var message = format(str, name);
		variadic.error(message);
		return false;
	}

	return false;
};

Config.fn.forms = function() {
	this.form.apply(this, this._parameterNames.map(function(name) {
		return "?" + name;
	}));
};

Config.fn._removeForms = function(testFn) {
	var forms = this._forms;

	for (var i = forms.length - 1; i >= 0; i--) {
		if (testFn(forms[i])) {
			forms.splice(i, 1);
		}
	}

	return this;
};

// Adds a new form to the variadic function. Forms are just arrays of
// parameter names (parameters are specified using `.add` or one of the
// built in parameter functions like `.object`, `.array`, etc).
Config.fn.form = function(/* names */) {
	var names = toArray(arguments);
	var mapKey = names.join(",");
	var i;
	var len = names.length;
	var noLoneCount = 0;
	var flags;

	// Don't add empty forms and don't add the same form twice.
	if (this._formMap.hasOwnProperty(mapKey)) {
		return this;
	}

	if (names.length === 0) {
		return this.empty();
	}

	// Count the "no lone" parameters.
	for (i = 0; i < len; i++) {
		if (this.getFlags(names[i]).noLone) {
			noLoneCount++;
		}
	}

	if (noLoneCount === len) {
		// You must have at least 1 non-"no lone" parameter.
		return this;
	}

	// Provide an easy way to know that this form has already been added.
	this._formMap[mapKey] = true;

	// Add this form.
	this._forms.push({
		positional: true,
		names: names.map(this.removeFlags, this)
	});

	// Recursively add more forms if there are optional parameters. Add
	// the "sub" forms backwards because we want the optional parameters
	// that show up first to match first.
	for (i = len - 1; i >= 0; i--) {
		if (this.getFlags(names[i]).optional) {
			this.form.apply(this, names.slice(0, i).concat(names.slice(i + 1)));
		}
	}

	return this;
};

// Will only match when given no arguments. When this matches it is the
// only possible match, and it's the only way to build a function that
// can accept no arguments.
Config.fn.empty = function() {
	var mapKey = "*empty";

	if (this._formMap.hasOwnProperty(mapKey)) {
		return this;
	}

	this._removeForms(function(form) {
		return form.nonEmpty || form.empty;
	});

	this._forms.push({
		empty: true
	});

	this._formMap[mapKey] = true;

	return this;
};

// Will not match when given no arguments.
Config.fn.nonEmpty = function() {
	var mapKey = "*nonEmpty";

	if (this._formMap.hasOwnProperty(mapKey)) {
		return this;
	}

	this._removeForms(function(form) {
		return form.empty;
	});

	this._forms.push({
		nonEmpty: true
	});

	this._formMap[mapKey] = true;

	return this;
};

// Will match any set of arguments. All arguments will be put into the
// rest array and opt will be null. This will have the lowest match rating.
Config.fn.anyForm = function() {
	this._forms.push({
		any: true
	});

	return this;
};

Config.fn.add = function(name, descriptor) {
	this._descriptors[name] = descriptor;
	this._parameterNames.push(name);
	return this;
};

// The `any` descriptor. Matches any value, but has less weight than
// more specific matching descriptors.
Config.fn.any = function(name, defaultValue) {
	return this.add(name, {
		any: true,
		description: "any value",
		defaultValue: defaultValue
	});
};

Config.fn.type = function(name, type, description, defaultValue) {
	return this.add(name, {
		type: type,
		description: description,
		defaultValue: defaultValue
	});
};

Config.fn.test = function(name, testFn, description, defaultValue) {
	return this.add(name, {
		test: testFn,
		description: description,
		defaultValue: defaultValue
	});
};

Config.fn.cls = function(name, cls, description, defaultValue) {
	return this.add(name, {
		cls: cls,
		description: description,
		defaultValue: defaultValue
	});
};

Config.fn.object = function(name, defaultValue) {
	return this.add(name, {
		test: isObject,
		description: "an object",
		defaultValue: defaultValue
	});
};

Config.fn.array = function(name, defaultValue) {
	return this.add(name, {
		test: isArray,
		description: "an array",
		defaultValue: defaultValue
	});
};

Config.fn.func = function(name, defaultValue) {
	return this.add(name, {
		type: "function",
		description: "a function",
		defaultValue: defaultValue
	});
};

Config.fn.string = function(name, defaultValue) {
	return this.add(name, {
		type: "string",
		description: "a string",
		defaultValue: defaultValue
	});
};

Config.fn.number = function(name, defaultValue) {
	return this.add(name, {
		type: "number",
		description: "a number",
		defaultValue: defaultValue
	});
};

Config.fn.boolean = function(name, defaultValue) {
	return this.add(name, {
		type: "boolean",
		description: "a boolean",
		defaultValue: defaultValue
	});
};

Config.fn.regExp = function(name, defaultValue) {
	return this.add(name, {
		test: isRegExp,
		description: "a regular expression",
		defaultValue: defaultValue
	});
};

Config.fn.date = function(name, defaultValue) {
	return this.add(name, {
		cls: Date,
		description: "a date",
		defaultValue: defaultValue
	});
};

Config.fn.match = function(name, regExp, description, defaultValue) {
	return this.add(name, {
		test: function(value) {
			return regExp.test(value);
		},
		description: description,
		defaultValue: defaultValue
	});
};

// Debug
// -----

variadic.silent = true;

variadic.debug = function() {
	function formatMessage(level, method, formatString, args) {
		return (level ? level + " " : "") +                          // level
			   "[variadic" + (method ? ("." + method) : "") + "] " + // category
			   format.apply(null, [formatString].concat(args));      // message
	}

	function logFunction(name) {
		var level = name.toUpperCase();

		return function(method, format) {
			var rest = toArray(arguments, 2);
			return console[name](formatMessage(level, method, format, rest));
		};
	}

	function errorFunction(name) {
		var level = name.toUpperCase();

		return function(format) {
			var rest = toArray(arguments, 2);

			if (variadic.silent) {
				return console[name](formatMessage(level, null, format, rest));
			} else {
				throw new Error(formatMessage(null, null, format, rest));
			}
		};
	}

	function logRedirect(name) {
		return function() {
			console[name].apply(console, arguments);
		};
	}

	log = {
		debug: logFunction("debug"),
		info:  logFunction("info"),
		warn:  logFunction("warn"),
		error: errorFunction("error"),
		dir:   logRedirect("dir")
	};
};

variadic.production = function() {
	log = {
		debug: noop,
		info: noop,
		warn: noop,
		error: noop,
		dir: noop
	};
};

variadic.production();

// Expose
// ------

if (typeof exports !== "undefined") {
	if (typeof module !== "undefined") {
		exports = module.exports = variadic;
	}
	exports.variadic = variadic;
} else {
	this.variadic = variadic;
}

}());
