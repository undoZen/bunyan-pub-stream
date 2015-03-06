'use strict';
var tape = require('tape');
var dnode = require('dnode');
tape('bunyan-hub should be running', function (test) {
    test.plan(2);
    var d = dnode();
    d.connect(28692);
    d.on('remote', function (remote) {
        test.equal(typeof remote.version, 'function');
        remote.version(function (version) {
            console.log(version);
            test.ok( !! version);
            d.end();
        });
    });
});
return;
var minValidRecord = {
    v: 0, //TODO: get this from bunyan.LOG_VERSION
    level: 30,
    name: 'name',
    hostname: 'hostname',
    pid: 123,
    time: Date.now(),
    msg: 'msg'
};

var pubStream = require('../')({
    raw: true
});
pubStream.write(minValidRecord);
pubStream.end();
