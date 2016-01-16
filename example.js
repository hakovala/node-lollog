"use strict";

var util = require('util');

function inspect(o, depth) {
	console.log(util.inspect(o, {colors: true, depth: depth}));
}

var ll = require('./index');
ll.enable('app,*A*');

function testLogger(tag) {
	var l = ll(tag);

	l.v('Verbose');
	l.d('Debug');
	l.i('Info');
	l.w('Warning');
	l.e('Error');
	l.f('Fatal');

	l.d('jotain: %d %s %o', 123, 'muuta', {hello: 'world', jotain: { muuta: true }});
}

testLogger('app');
testLogger('module A');
testLogger('module B');

ll.enable('Module');

function Module() {
	this.l = ll('Module');
	this.l.formatOptions.trace = true;
	this.l.formatOptions.formatDepth = 0;
}

Module.prototype.say = function() {
	this.l.d('Hello: %o', this);
};

var mod = new Module();
mod.say();
