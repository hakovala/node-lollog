"use strict";

var tools = require('./tools');
var formatter = require('./formatter');

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
	return CONST.levels[name.toLowerCase()];
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
	this.color = selectColor(); // select color for this logger

	this.formatOptions = {
		useColors: undefined,
		formatDepth: undefined,
		trace: undefined,
	};

	this._logMethods = {};

	this._enabled = true;
	this._level = 0; // private log level

	this._writers = [];

	// setup log methods
	for (var ln in CONST.levels) {
		this._logMethods[ln] = CONST.levels[ln];
	}

	// set initial log level
	this.setLevel((options && options.level) || CONST.level || CONST.levels.debug);
}
module.exports = Logger;
module.exports.Levels = CONST.Levels;
module.exports.LevelColors = CONST.LevelColors;
module.exports.TagColors = CONST.tagColors;

// define Logger property getters and setters
Object.defineProperties(Logger.prototype, {
	enabled: {
		get: function() { return this._enabled; },
		set: function(enabled) {
			if (this._enabled == enabled)
				return;

			this._enabled = enabled
			this._updateLogMethods();
		}
	},
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

	this._updateLogMethods();
};

/**
 * Enable/disable log methods based on global enable flag,
 * local enable flag and log level.
 */
Logger.prototype._updateLogMethods = function() {
	// enable/disable logging methods
	for (var ln in this._logMethods) {
		var lml = this._logMethods[ln];
		if (CONST.enabled && this.enabled && lml >= this._level) {
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
 * Add writer to this Logger instance.
 * @param writer Writer object to add
 */
Logger.prototype.addWriter = function(writer) {
	if (!this._writers) {
		this._writers = [writer];
	} else {
		this._writers.push(writer);
	}
};

/**
 * Remove writer from this Logger instance.
 * @param writer Writer object to remove
 */
Logger.prototype.removeWriter = function(writer) {
	if (this._writers) {
		this._writers.splice(this._writers.indexOf(writer), 1);
	}
};

/**
 * Common print method for all log levels.
 * @param level Log level
 */
Logger.prototype.print = function(level) {
	if (!CONST.enabled || !this.enabled || level < this.level)
		return;

	// calculate time from last log with this tag
	this._current = +new Date();
	this._diff = this._current - (this._prevTime || this._current);
	this._prevTime = this._current;

	// set format options for this log call
	var formatOpts = {
		tag: this.tag,
		level: levelName(level),
		levelColor: levelColor(level),
		color: this.color,
		diff: this._diff,
	};
	// extend global format options
	formatOpts = tools.extend(formatOpts, CONST.formatOptions);
	// extend local format options
	formatOpts = tools.extend(formatOpts, this.formatOptions);

	if (formatOpts.trace) {
		formatOpts.trace = tools.getTrace('Logger');
	}

	// TODO: Move formatting to Writer, to support multiple concurrent writers
	var args = formatter.formatArgs(formatOpts, Array.prototype.slice.call(arguments, 1));

	this.write.apply(this, args);
};

Logger.prototype.write = function() {
	if (this._writers.length == 0) {
		console.log.apply(console, arguments);
	} else {
		for (var i = 0; i < this._writers.length; i++) {
			var writer = this._writers[i];
			writer.write.apply(writer, arguments);
		}
	}
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
