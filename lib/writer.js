"use strict";

var util = require('util');
var tty = require('tty');
var fs = require('fs');
var net = require('net');

function createWritableStdioStream(fd) {
	var stream;
	var tty_wrap = process.binding('tty_wrap');

	var type = tty_wrap.guessHandleType(fd);
	switch (type) {
		case 'TTY':
			stream = new tty.WriteStream(fd);
			stream._type = 'tty';

			if (stream._handle && stream._handle.unref)
				stream._handle.unref();
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

			if (stream._handle && stream._handle.unref)
				stream._handle.unref();
			break;
		default:
			throw new Error('Unknown stream file type: ' + type);
	}

	stream.fd = fd;
	stream._isStdio = true;

	return stream;
}

function getStdioStream(fd) {
	if (fd === 1) return process.stdout;
	if (fd === 2) return process.stderr;
	return createWritableStdioStream(fd);
}

function Writer(opt) {
	if (!(this instanceof Writer))
		return new Writer(opt);

	opt = opt || {};

	if (typeof opt.fd === 'number') {
		this.fd = opt.fd;
	} else {
		this.fd = 2;
	}

	this.stream = getStdioStream(this.fd);
}
module.exports = Writer;

Writer.prototype.write = function(args) {
	this.stream.write(util.format.apply(this, arguments) + '\n');
};
