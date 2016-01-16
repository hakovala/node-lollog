"use strict";

var tools = require('./tools');
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
	this.color = selectColor(); // select color for this logger

	this._logMethods = {};

	// setup log methods
	for (var ln in LEVELS) {
		this._logMethods[ln] = LEVELS[ln];
	}

	// set initial log level
	this.setLevel((options && options.level) || LEVELS.debug);
}
module.exports = Logger;
module.exports.Levels = LEVELS;
module.exports.LevelColors = LEVEL_COLORS;
module.exports.TagColors = TAG_COLORS;

Object.defineProperty(Logger.prototype, 'level', {
	get: function() { return levelName(this._level); },
	set: function(level) { this.setLevel(level); },
});

/**
 * Set Logger instance log level.
 * Log methods will be enabled/disabled accordingly.
 * @param level Log level number or string
 */
Logger.prototype.setLevel = function(level) {
	if (typeof level === 'string') {
		level = levelNumber(level);
	}
	if (typeof level !== 'number') {
		// not a number, will ignore
		return;
	}
	this._level = level;

	// enable/disable logging methods
	for (var ln in this._logMethods) {
		var lml = this._logMethods[ln];
		if (lml >= level) {
			this._enableLogMethod(ln, lml);
		} else {
			this._disableLogMethod(ln);
		}
	}
};

/**
 * Add log method with given name for given log level.
 * Adds both, one letter and full name, methods.
 * @param name Log method name
 * @param level Log level
 */
Logger.prototype._enableLogMethod = function(name, level) {
	this[name[0]] = this.print.bind(this, level);
	this[name] = this.print.bind(this, level);
};

/**
 * Remove log method with given name by replacing it with empty function.
 * Removes both, one letter and full name, methods.
 * @param name Log method name
 */
Logger.prototype._disableLogMethod = function(name) {
	this[name[0]] = function() {};
	this[name] = function() {};
};

/**
 * Common print method for all log levels.
 * @param level Log level
 */
Logger.prototype.print = function(level) {
	if (!this.enabled || level < this.level)
		return;

	// calculate time from last log with this tag
	this._current = +new Date();
	this._diff = this._current - (this._prevTime || this._current);
	this._prevTime = this._current;

	var formatOpts = {
		tag: this.tag,
		level: levelName(level),
		levelColor: levelColor(level),
		useColors: true,
		formatDepth: 2,
		color: this.color,
		diff: this._diff,
		trace: tools.getTrace('Logger'),
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
