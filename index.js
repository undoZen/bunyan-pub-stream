'use strict';
var net = require('net');
var util = require('util');
var dnode = require('dnode');
var destroy = require('destroy');
var VERSION = require('./package.json').version;
var Writable = require('stream').Writable;

var retryCount = 0;
var remoteLog;
var recBuffer = [];
var psCount = 0;

function log(rec) {
    if (remoteLog) {
        remoteLog(rec);
        return true;
    } else {
        recBuffer.push(rec);
        return false;
    }
}
var d = dnode();
d.on('remote', onremote);

function onremote(remote) {
    retryCount = 0;
    while (recBuffer.length) {
        remote.log(recBuffer.shift());
    }
    d.emit('bufferFlushed');
    remoteLog = remote.log.bind(remote);
};
d.on('error', onerror);

function onerror(err) {
    remoteLog = null;
    console.error('bunyan-pub-stream connection error:', err);
    d.end();
};
d.on('end', reconnect);

function reconnect() {
    remoteLog = null;
    destroy(d);
    if (++retryCount > 20) {
        console.error('can not connect to bunyan-hub for 1 minute, abort.');
        process.exit(1);
    }
    console.error('bunyan-pub-stream connection ended');
    console.error('will try reconnecting in 5s');
    setTimeout(function () {
        d = dnode();
        d.on('remote', onremote);
        d.on('error', onerror);
        d.on('end', reconnect);
        d.connect(28692);
    }, 5000);
}
d.connect(28692);

function PubStream(opts) {
    if (!(this instanceof PubStream)) return new PubStream(opts);
    Writable.apply(this, arguments);
    psCount += 1;
    if (opts.raw) {
        this.objectMode = true;
    }

}
util.inherits(PubStream, Writable);

PubStream.prototype.write = function (chunk, encoding) {
    return log(this.objectMode ? chunk : chunk.toString('utf-8'));
};
PubStream.prototype.end = function () {
    Writable.prototype.end.apply(this, arguments);
    endAPubStream();
}

function endAPubStream() {
    if (!--psCount) {
        endD();
    }
}

function endD() {
    d.removeListener('end', reconnect);
    if (!recBuffer.length) {
        d.end();
    } else {
        d.on('bufferFlushed', d.end.bind(d));
    }
}
module.exports = PubStream;
