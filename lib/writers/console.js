"use strict";

var util = require('util');
var tty = require('tty');
var fs = require('fs');
var net = require('net');

/**
 * Un-reference stream so that the process won't wait it to close.
 * @param stream Stream to un-reference
 */
function unrefStream(stream) {
	if (stream._handle && stream._handle.unref)
		stream._handle.unref();
}

/**
 * Create stdio stream from fd.
 *
 * See: https://github.com/visionmedia/debug/blob/master/node.js
 *
 * @param fd File descriptor
 * @returns {Stream} Stdio stream
 */
function createWritableStdioStream(fd) {
	var stream;
	var tty_wrap = process.binding('tty_wrap');

	var type = tty_wrap.guessHandleType(fd);
	switch (type) {
		case 'TTY':
			stream = new tty.WriteStream(fd);
			stream._type = 'tty';
			unrefStream(stream);
			break;
		case 'FILE':
			stream = new fs.SyncWriteStream(fd, { autoClose: false });
			stream._type = 'fs';
			break;
		case 'PIPE':
		case 'TCP':
			var net = require('net');
			stream = new net.Socket({
				fd: fd,
				readable: false,
				writable: true,
			});

			stream.readable = false;
			stream.read = null;
			stream._type = 'pipe';

			unrefStream(stream);
			break;
		default:
			throw new Error('Unknown stream file type: ' + type);
	}

	stream.fd = fd;
	stream._isStdio = true;

	return stream;
}

/**
 * Get appropriate stdio stream based on file descriptor.
 *
 * Returns stdout stream if fd is 1, stderr if fd is 2,
 * otherwise creates a appropriate stream based on fd.
 *
 * @param fd File descriptor
 * @returns {Stream} Stdio stream
 */
function getStdioStream(fd) {
	if (fd === 1) return process.stdout;
	if (fd === 2) return process.stderr;
	return createWritableStdioStream(fd);
}

/**
 * Writer stream used to write to streams.
 *
 * @param fd File descriptor or Stream object
 * @param opt Writer options
 * @constructor
 */
function Writer(fd, opt) {
	if (!(this instanceof Writer))
		return new Writer(fd, opt);

	this.options = opt || {};

	if (typeof fd === 'number') {
		this.stream = getStdioStream(fd || 2);
	} else {
		this.stream = fd;
	}
}
module.exports = Writer;

/**
 * Write to stream
 */
Writer.prototype.write = function() {
	this.stream.write(util.format.apply(this, arguments) + '\n');
};


