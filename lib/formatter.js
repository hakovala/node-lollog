"use strict";

var util = require('util');
var tty = require('tty');

var ms = require('ms');

var tools = require('./tools');

var OPTIONS = {
	tagLength: 10,
	levelLength: 5,
};

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

function applyFormatters(args, opt) {
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
	var level = opt.level.toUpperCase();

	if (opt.useColors) {
		var c = opt.color;
		var lc = opt.levelColor;

		tag = tools.strToLen(tag, OPTIONS.tagLength, 'left');
		level = tools.strToLen(level, OPTIONS.levelLength);

		var ansi = tools.ANSI;

		tag = ansi.fg(c, true) + tag + ansi.resetFg();
		diff = ansi.fg(c) + '+' + ms(diff) + ansi.resetFg();
		level = ansi.color(lc, true) + level + ansi.reset();

		args[0] = util.format('%s [%s] %s %s', tag, level, args[0], diff);

		if (typeof opt.bgColor !== 'undefined') {
			args[0] = ansi.bg(opt.bgColor) + args[0] + ansi.reset();
		}
	} else {
		args[0] = util.format('%s [%s] %s %s', new Date().toUTCString(), tag, level, args[0]);
	}
	return args;
}

function formatArgs(opt, args) {
	args[0] = coerce(args[0]);

	if (typeof args[0] !== 'string') {
		// let's inspect arguments as objects
		args = ['%o'].concat(args);
	}

	args = applyFormatters(args, opt);

	// TODO: use different method for browsers...
	args = formatArgsTerminal(args, opt);

	return args;
}

module.exports = {
	options: OPTIONS,
	formatArgs,
};
