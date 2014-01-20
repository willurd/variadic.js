# TODO

```javascript
var fn = function(a, b) {
  // the function
}.variadic(function(v) {
  // config
});
```

* More tests
  * v.form errors if passed no parameter names
  * v.type
  * v.test
  * v.cls
  * v.regExp
  * v.date
  * v.match
  * Configuration function chaining
  * Make sure undefined args not added to opt object
  * Make sure "null" doesn't match on the "object" type (v.type)
  * Does Variadic work with constructor functions and 'new'?
* Features
  * `any` descriptor
    * Add ranking system so the `any` descriptor is given less precedence than other descriptors
  * Optional parameters in forms (possibly using "?name")
  * Exploding array arguments
  * Exploding object arguments
  * Empty form (opt == null, rest contains all arguments)
* Get the docs all set up
* Examples (try taking some beastly functions from the wild and making them better with variadic)
* Performance tests
* After configuration, generate a documentation string for the function and set it to something like: 
  * fn.usage
  * fn.documentation
  * fn.doc
  * fn.forms
  * fn.help
