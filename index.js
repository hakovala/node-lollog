"use strict";

var Logger = require('./lib/logger');

var loggers = [];

var enabledLoggers = [];
var disabledLoggers = [];

/**
 * Get existing Logger instance with given tag
 * or create new Logger with given tag.
 * @param tag Logger tag
 */
function LolLog(tag) {
	var log = loggers[tag];
	if (!log) {
		log = new Logger(tag);
		loggers.push(log);
	}
	return log;
}
module.exports = LolLog;
module.exports.enable = enable;
module.exports.disable = disable;
module.exports.enabled = enabled;

function enable(tags) {
	var split = (tags || '').split(/[\s,]+/);
	var len = split.length;

	for (var i = 0; i < len; i++) {
		if (!split[i]) continue;
		tags = split[i].replace(/\*/g, '.*?');
		if (tags[0] === '-') {
			loggerSkips.push(new RegExp('^' + tags.substr(1) + '$'));
		} else {
			enabledLoggers.push(new RegExp('^' + tags + '$'));
		}
	}
}

function disable() {
	enable('');
}

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

