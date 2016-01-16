"use strict";


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

module.exports = {
	ANSI,
	padRight,
	padLeft,
	strToLen,
};
