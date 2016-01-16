"use strict";

var formatter = require('./formatter');
var writer = require('./writer');

var LEVELS = {
	verbose: 0,
	debug: 10,
	info: 20,
	warn: 30,
	error: 40,
	fatal: 90,
};

var LEVEL_COLORS = {
	default: 37,
	verbose: 36,
	debug: 34,
	info: 37,
	warn: '30;43',
	error: '39;41',
	fatal: '39;45',
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

function levelColor(name) {
	if (typeof name === 'number')
		name = levelName(name);

	return (name in LEVEL_COLORS) ? LEVEL_COLORS[name] : LEVEL_COLORS.default;
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
module.exports.LevelColors = LEVEL_COLORS;
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


