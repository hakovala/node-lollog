"use strict";

var formatter = require('./formatter');
var writer = require('./writer');

var LEVELS = {
	verbose: 0,
	debug: 10,
	info: 20,
	warning: 30,
	error: 40,
	fatal: 90,
};

var TAG_COLORS = [6, 2, 3, 4, 5, 1];

var prevColor = 0;
function selectColor() {
	return TAG_COLORS[prevColor++ % TAG_COLORS.length];
}

function levelName(level) {
	for (var name in LEVELS) {
		if (level == LEVELS[name])
			return name;
	}
}

function levelNumber(name) {
	return LEVELS[name.toLowerCase()];
}

function Logger(tag, options) {
	if (!(this instanceof Logger))
		return new Logger(tag, options);

	this.tag = tag;
	this.enabled = true;
	this.color = selectColor();

	this._level = LEVELS.DEBUG;

	for (var ln in LEVELS) {
		this[ln[0]] = this.print.bind(this, LEVELS[ln]);
		this[ln] = this.print.bind(this, LEVELS[ln]);
	}
}
module.exports = Logger;
module.exports.Levels = LEVELS;
module.exports.TagColors = TAG_COLORS;

Object.defineProperty(Logger.prototype, 'level', {
	get: function() {
		// return name of the level
		return levelName(this._level);
	},
	set: function(level) {
		// TODO: swap unused log methods to empty functions
		if (typeof level === 'string') {
			level = levelNumber(level);
		}
		if (typeof level === 'number') {
			this._level = level;
		}
	}
});

Logger.prototype.print = function(level) {
	if (!this.enabled || level < this.level)
		return;

	// calculate time from last log with this tag
	this._current = +new Date();
	this._diff = this._current - (this._prevTime || this._current);
	this._prevTime = this._current;

//	var args = Array.prototype.slice.call(arguments, 1);
//	args[0] = formatter.coerce(args[0]);

	var formatOpts = {
		tag: this.tag,
		useColors: true,
		formatDepth: 2,
		color: this.color,
		diff: this._diff,
	};

	var args = formatter.formatArgs(formatOpts, Array.prototype.slice.call(arguments, 1));

	var fn = this.write || writer.write || console.log.bind(console);
	fn.apply(this, args);
};

/**
 * Print fatal message and exit process with given code
 * @param code Exit code
 */
Logger.prototype.die = function(code) {
	var args = Array.prototype.slice.call(arguments, 1);
	this.print.apply(this, [LEVELS.fatal].concat(args));
	process.exit(code);
};


