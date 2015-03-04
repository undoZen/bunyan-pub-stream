'use strict';
var net = require('net');
var dnode = require('dnode');
var destroy = require('destroy');
var VERSION = require('./package.json').version;
var Writable = require('stream').Writable;

var retryCount = 0;
var remoteLog;
var recBuffer = [];

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
d.on('remote', function (remote) {
    while (recBuffer.length) {
        remote.log(recBuffer.shift());
    }
    remoteLog = remote.log.bind(remote);
});
d.on('error', function (err) {
    remoteLog = null;
    console.error('bunyan-pub-stream connection error:', err);
    console.error('will try reconnecting in 5s');
    d.end();
});
d.on('end', function () {
    remoteLog = null;
    destroy(d);
    if (++retryCount > 20) {
        console.error('can not connect to bunyan-hub for 1 minute, abort.');
        process.exit(1);
    }
});
d.connect(28692);

module.exports = new Writable({
    objectMode: true,
    write: function (chunk, encoding, next) {
        var result = log(chunk);
        next();
        return result;
    }
});
