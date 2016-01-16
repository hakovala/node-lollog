"use strict";

var stackTrace = require('stack-trace');

//
// Misc helpers
//

function cloneDeep(obj) {
	var clone = {};

	for (var key in obj) {
		if (typeof obj[key] === 'object' && obj[i] !== null) {
			clone[i] = cloneDeep(obj[key]);
		} else {
			close[i] = obj[key];
		}
	}
	return clone;
}

function extend(origin, other) {
	origin = origin || {};

	if (other === null || typeof other !== 'object')
		return origin;

	var keys = Object.keys(other);
	var i = keys.length;
	while (i--) {
		// skip undefined properties
		if (typeof other[keys[i]] === 'undefined')
			continue;

		if (typeof other[keys[i]] === 'object') {
			origin[keys[i]] = extend(origin[keys[i]], other[keys[i]]);
		} else {
			origin[keys[i]] = other[keys[i]];
		}
	}
	return origin;
}

//
// String manipulation helpers
//

function padRight(str, len, c) {
	return str + new Array(len - str.length + 1).join(c || ' ');
}

function padLeft(str, len, c) {
	return new Array(len - str.length + 1).join(c || ' ') + str;
}

function strToLen(str, len, dir) {
	if (str.length >= len)
		return str.slice(0, len);

	return (dir == 'left') ? padLeft(str, len) : padRight(str, len);
}

//
// ANSI color helpers
//

var ANSI = {
	reset: function() { return '\u001b[0m'; },
	resetFg: function() { return '\u001b[39m'; },
	resetBg: function() { return '\u001b[49m'; },
	color: function(c) { return '\u001b[' + c + 'm'; },
	fg: function(c, bold) { return '\u001b[3' + c + (bold ? ';1' : '') + 'm'; },
	bg: function(c) { return '\u001b[4' + c + 'm'; },
};

function startColor(c) {
	return '\u001b[3' + c + 'm';
}

function resetColor() {
	return '\u001b[0m';
}

//
// Stack trace helpers
//

function formatStackTrace(trace) {
	return {
		type: trace.getTypeName(),
		func: trace.getFunctionName(),
		method: trace.getMethodName(),
		file: trace.getFileName(),
		line: trace.getLineNumber(),
	};
}

function getTrace(belowType, belowFn) {
	var stack = stackTrace.get(belowFn || getTrace);

	for (var i = 0; i < stack.length; i++) {
		var trace = formatStackTrace(stack[i]);
		if (trace.type != belowType)
			return trace;
	}
	return null;
}

module.exports = {
	cloneDeep,
	extend,
	ANSI,
	padRight,
	padLeft,
	strToLen,
	getTrace,
};
