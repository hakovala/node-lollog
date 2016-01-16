"use strict";

module.exports = {
	// Global options
	enabled: true,
	// Log levels
	levels:      {
		verbose: 0,
		debug: 10,
		info: 20,
		warn: 30,
		error: 40,
		fatal: 90,
	},
	// Log level colors
	levelColors: {
		default: 37,
		verbose: 36,
		debug: 34,
		info: 37,
		warn: '30;43',
		error: '39;41',
		fatal: '39;45',
	},
	// Tag colors
	tagColors: [6, 2, 3, 4, 5, 1],
	// Formatting options
	formatOptions: {
		useColors: true,
		trace: false,
		formatDepth: 2,
	}
};

