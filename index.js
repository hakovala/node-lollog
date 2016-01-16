"use strict";

var Logger = require('./lib/logger');

// list of loggers
var loggers = [];

// list of enable regexps
var enabledLoggers = [];
// list of disable regexps
var disabledLoggers = [];

/**
 * Get existing Logger instance with given tag
 * or create new Logger with given tag.
 * @param tag Logger tag
 */
function LolLog(tag) {
	var logger = loggers[tag];
	if (!logger) {
		logger = new Logger(tag);
		logger.enabled = enabled(tag);
		loggers.push(logger);
	}
	return logger;
}
module.exports = LolLog;
module.exports.options = require('./lib/const');
module.exports.enable = enable;
module.exports.disable = disable;
module.exports.enabled = enabled;

/**
 * Update Loggers according global enable/disable filters.
 */
function updateLoggers() {
	for (var i = 0; i < loggers.length; i++) {
		var logger = loggers[i];
		logger.enabled = enabled(logger.tag);
	}
}

/**
 * Enable matching tags.
 * @param tags Space or comma separated string list of tags or
 * 				a Array of those strings.
 */
function enable(tags) {
	if (Array.isArray(tags))
		return tags.forEach(enable);

	tags = (tags || '').split(/[\s,]+/);
	for (var i = 0; i < tags.length; i++) {
		if (!tags[i]) continue;
		var tag = tags[i].replace(/\*/g, '.*?');
		enabledLoggers.push(new RegExp('^' + tag + '$'));
	}
	updateLoggers();
}

/**
 * Disable matching tags.
 * @param tags Space or comma separated string list of tags or
 * 				a Array of those strings.
 */
function disable(tags) {
	if (Array.isArray(tags))
		return tags.forEach(disable);

	tags = (tags || '').split(/[\s,]+/);
	for (var i = 0; i < tags.length; i++) {
		if (!tags[i]) continue;
		var tag = tags[i].replace(/\*/g, '.*?');
		disabledLoggers.push(new RegExp('^' + tag + '$'));
	}
	updateLoggers();
}

/**
 * Check if given tag is enabled.
 * @param tag Logger tag
 * @returns {boolean} True if enabled
 */
function enabled(tag) {
	for (var i = 0; i < disabledLoggers.length; i++) {
		if (disabledLoggers[i].test(tag))
			return false;
	}
	for (var i = 0; i < enabledLoggers.length; i++) {
		if (enabledLoggers[i].test(tag))
			return true;
	}
	return false;
}

