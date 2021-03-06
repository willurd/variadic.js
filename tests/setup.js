if (typeof require === "function") {
	var libpath = process.env["COVERAGE"] ? "../src-cov" : "../src";
	global.variadic = require(libpath + "/variadic");
	global.assert = require("chai").assert;
} else {
	window.assert = chai.assert;
}
