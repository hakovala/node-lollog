"use strict";

var util = require('util');
var tty = require('tty');

var ms = require('ms');

var formatters = {
	'o': function(v, opt) {
		return util.inspect(v, { colors: opt.useColors, depth: opt.formatDepth})
			.replace(/\s*\n\s/g, ' ');
	}
};

function coerce(val) {
	if (val instanceof Error)
		return val.stack || val.message;
	return val;
}

function appylFormatters(args, opt) {
	var i = 0;
	args[0] = args[0].replace(/%([a-z%])/g, (match, format) => {
		// skip escaped %
		if (match === '%%') return match;
		i++;

		var formatter = formatters[format];
		if (typeof formatter === 'function') {
			var val = args[i];
			match = formatter.call(this, val, opt);

			// remove 'args[i]' as it's inlined
			args.splice(i, 1);
			i--;
		}
		return match;
	});
	return args;
}

function formatArgsTerminal(args, opt) {
	opt = opt || {};
	var tag = opt.tag || 'global';
	var diff = opt.diff;

	if (opt.useColors) {
		var c = opt.color;

		var startColor = `\u001b[3${c};1m`;
		var startBoldColor = `\u001b[3${c}m`;
		var resetColor = `\u001b[0m`;

		tag = startBoldColor + tag + resetColor;
		diff = startColor + '+' + ms(diff) + resetColor;

		args[0] = util.format('%s %s %s', tag, args[0], diff);
	} else {
		args[0] = util.format('%s %s %s', new Date().toUTCString(), tag, args[0]);
	}
	return args;
}

function formatArgs(opt, args) {
	args[0] = coerce(args[0]);

	if (typeof args[0] !== 'string') {
		// let's inspect arguments as objects
		args = ['%o'].concat(args);
	}

	args = appylFormatters(args, opt);

	// TODO: use different method for browsers...
	args = formatArgsTerminal(args, opt);

	return args;
}

module.exports = {
	coerce,
	formatArgs,
};
