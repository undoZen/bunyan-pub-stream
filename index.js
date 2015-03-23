'use strict';
var net = require('net');
var util = require('util');
var destroy = require('destroy');
var VERSION = require('./package.json').version;
var Writable = require('stream').Writable;

var retryCount = 0;
var socketWrite;
var recBuffer = [];
var psCount = 0;

function isValidRecord(rec) {
    if (!rec ||
        rec.v == null ||
        rec.level == null ||
        rec.name == null ||
        rec.hostname == null ||
        rec.pid == null ||
        rec.time == null ||
        rec.msg == null) {
        // Not valid Bunyan log.
        return false;
    } else {
        return true;
    }
}

function log(rec) {
    if (!isValidRecord(rec)) return;
    var json = JSON.stringify(rec) + '\n';
    if (socketWrite) {
        socketWrite(json);
        return true;
    } else {
        recBuffer.push(json);
        return false;
    }
}
var socket, connecting;

function connect() {
    if (connecting) return;
    connecting = true;
    socket = net.connect(28692);
    socket.on('connect', onconnect);
    socket.on('error', onerror);
    socket.on('end', reconnect);
}

function onconnect(remote) {
    retryCount = 0;
    connecting = false;
    var _end = socket.end;
    socket.write('{"cmd":"publish"}\n');
    while (recBuffer.length) {
        console.log(recBuffer);
        socket.write(recBuffer.join(''));
        recBuffer = [];
    }
    socketWrite = socket.write.bind(socket);
    socket.end = function () {
        socketWrite = null;
        return _end.apply(this, arguments);
    }
    socket.emit('bufferFlushed');
};

function onerror(err) {
    console.error('bunyan-pub-stream connection error:', err);
    socket.end();
};

function reconnect() {
    destroy(socket);
    if (++retryCount > 20) {
        console.error('can not connect to bunyan-hub for 1 minute, abort.');
        process.exit(1);
    }
    console.error('bunyan-pub-stream connection ended');
    console.error('will try reconnecting in 5s');
    setTimeout(connect, 5000);
}

function PubStream(opts) {
    if (!(this instanceof PubStream)) return new PubStream(opts);
    Writable.apply(this, arguments);
    if (!socketWrite) connect();
    psCount++;
    opts = opts || {};
    if (opts.raw) {
        this.objectMode = true;
    }

}
util.inherits(PubStream, Writable);

PubStream.prototype.write = function (chunk, encoding) {
    console.log(chunk);
    var obj;
    if (this.objectMode) {
        obj = chunk;
    } else {
        try {
            obj = JSON.parse(chunk.toString('utf-8'));
        } catch (e) {
            return false;
        }
    }
    console.log(obj);
    return log(obj);
};
PubStream.prototype.end = function () {
    Writable.prototype.end.apply(this, arguments);
    endAPubStream();
}

function endAPubStream() {
    if (!--psCount) {
        endSocket();
    }
}

function endSocket() {
    socket.removeListener('end', reconnect);
    if (!recBuffer.length) {
        socket.end();
    } else {
        socket.on('bufferFlushed', socket.end.bind(socket));
    }
}
module.exports = PubStream;
