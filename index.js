"use strict";

var Logger = require('./lib/logger');

var options = require('./lib/const');

// list of loggers
var loggers = [];

// lits of tag levels
var loggerOptions = [];

/**
 * Get existing Logger instance with given tag
 * or create new Logger with given tag.
 * @param tag Logger tag
 */
function LolLog(tag) {
	var logger = loggers[tag];
	if (!logger) {
		logger = new Logger(tag);
		logger.enabled = false;
		updateLogger(logger);
		loggers.push(logger);
	}
	return logger;
}
module.exports = LolLog;
module.exports.options = options;
module.exports.enable = enable;
module.exports.disable = disable;
module.exports.enabled = enabled;

module.exports.loggers = loggers;
module.exports.loggerOptions = loggerOptions;

loadEnv();

/**
 * Parse matcher string
 * @param  {string} tag Tag matcher string
 * @return {object}     Object
 */
function parseMatcher(matcher) {
	if (typeof matcher !== 'string')
		throw new Error('Matcher must be a string');

	matcher = matcher.replace(/\*/g, '.*?');
	return new RegExp('^' + matcher + '$');
}

/**
 * Get logger options with matcher string
 * @param  {string} matcher Matcher string
 * @return {object}         Logger options, or undefined if not found
 */
function getLoggerOption(matcher) {
	return loggerOptions.find(opt => opt.matcher == matcher);
}

/**
 * Check if logger options for given matcher string exists
 * @param  {string}  matcher Matcher string
 * @return {boolean} True if matcher options found
 */
function hasLoggerOption(matcher) {
	return !!getLoggerOption(matcher);
}

/**
 * Create/update logger options for given matcher
 * @param {string}  matcher Matcher string
 * @param {boolean} enabled Logger enabled/disabled
 * @param {number}  level   Logger level number
 */
function setLoggerOption(matcher, enabled, level) {
	var opt = getLoggerOption(matcher);
	if (opt) {
		if (typeof enabled === 'boolean') {
			opt.enabled = enabled;
		}
		if (typeof level === 'number') {
			opt.level = level;
		}
	} else {
		opt = {
			matcher: matcher,
			rx: parseMatcher(matcher),
			enabled: enabled,
			level: level,
		};
		loggerOptions.push(opt);
	}
}

/**
 * Remove logger options for given matcher
 * @param  {string} matcher Matcher string
 * @return {object}         Removed logger options object
 */
function removeLoggerOption(matcher) {
	return loggerOptions.splice(loggerOptions.findIndex(opt => opt.matcher == matcher), 1);
}

/**
 * Find matching logger options for tag
 * @param  {string} tag Tag string
 * @return {object}     Logger options object
 */
function findLoggerOptions(tag) {
	return loggerOptions.find(opt => opt.rx.test(tag));
}

/**
 * Load DEBUG environment variable
 *
 * Enable/disable defined tags
 */
function loadEnv() {
	var level = process.env.LOLLOG_LEVEL;
	if (level) {
		options.level = level.toLowerCase();
		console.log(options.level);
	}

	var matchers = process.env.DEBUG;
	(matchers || '').split(/[\s,]+/)
		.forEach((matcher) => {
			if (matcher[0] == '!') setLoggerOption(matcher.slice(1), false);
			else setLoggerOption(matcher, true);
		});
}

/**
 * Update all loggers according loggerOptions list.
 */
function updateLoggers() {
	loggers.forEach(updateLogger);
}

/**
 * Update logger according loggerOptions list.
 * @param  {Logger} logger Logger object
 */
function updateLogger(logger) {
	loggerOptions.filter(opt => opt.rx.test(logger.tag))
		.forEach((opt) => {
			logger.enabled = opt.enabled;
			logger.level = opt.level;
		});
}

/**
 * Enable matching Loggers.
 * @param {string|array} tags  Space or comma separated string list of tags or a Array of those strings.
 * @param {number}       level Logger log level number
 */
function enable(matcher, level) {
	if (Array.isArray(matcher))
		return matcher.forEach(m => enabled(m, level));

	(matcher || '').split(/[\s,]+/)
		.forEach((m) => {
			setLoggerOption(m, true, level);
		});

	updateLoggers();
}

/**
 * Disable matching Loggers.
 * @param {string|array} tags  Space or comma separated string list of tags or a Array of those strings.
 */
function disable(matcher) {
	if (Array.isArray(matcher))
		return matcher.forEach(m => disable(m));

	(matcher || '').split(/[\s,]+/)
		.forEach((m) => {
			setLoggerOption(m, false);
		});

	updateLoggers();
}

/**
 * Check if given tag is enabled.
 * @param   {string}  tag Logger tag
 * @returns {boolean}     True if enabled
 */
function enabled(tag) {
	var opt = findLoggerOptions(tag);
	return !!(opt && opt.enabled);
}
