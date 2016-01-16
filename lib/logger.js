"use strict";

var tools = require('./tools');
var formatter = require('./formatter');
var writer = require('./writer');

var CONST = require('./const');

var prevColor = 0;
function selectColor() {
	return CONST.tagColors[prevColor++ % CONST.tagColors.length];
}

function levelName(level) {
	for (var name in CONST.levels) {
		if (level == CONST.levels[name])
			return name;
	}
}

function levelNumber(name) {
	return LEVELS[name.toLowerCase()];
}

function levelColor(name) {
	if (typeof name === 'number')
		name = levelName(name);

	return (name in CONST.levelColors) ? CONST.levelColors[name] : CONST.levelColors.default;
}

function Logger(tag, options) {
	if (!(this instanceof Logger))
		return new Logger(tag, options);

	this.tag = tag;
	this.enabled = true;
	this.color = selectColor(); // select color for this logger

	this._logMethods = {};

	this._level = 0; // private log level

	// setup log methods
	for (var ln in CONST.levels) {
		this._logMethods[ln] = CONST.levels[ln];
	}

	// set initial log level
	this.setLevel((options && options.level) || CONST.levels.debug);
}
module.exports = Logger;
module.exports.Levels = CONST.Levels;
module.exports.LevelColors = CONST.LevelColors;
module.exports.TagColors = CONST.tagColors;

Object.defineProperties(Logger.prototype, {
	level: {
		get: function() { return levelName(this._level); },
		set: function(level) { this.setLevel(level); },
	}
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
	this.fatal.apply(this, args);
	process.exit(code);
};
