'use strict';
var path = require('path');
var tape = require('tape');
var co = require('co');
var utils = require('./utils');
var xtend = require('xtend');
var spawnSync = require('child_process').spawnSync;
var PubStream, pubStream, sub;

tape('stop running bunyan-hub if any', function (test) {
    test.plan(1);
    var result = spawnSync(process.execPath, [path.join(__dirname, '..',
        'node_modules', '.bin', 'bunyan-hub'), 'stop']);
    test.ok(result.stdout || result.stderr);
});

var minValidRecord = {
    v: 0, //TODO: get this from bunyan.LOG_VERSION
    level: 30,
    name: 'name',
    hostname: 'hostname',
    pid: 123,
    time: Date.now(),
    msg: 'msg'
};

var time0 = 1400000000000;
var rec1 = xtend(minValidRecord, {
    time: time0 + 1000,
});
var rec2 = xtend(minValidRecord, {
    level: 10,
    time: time0 + 2000,
})
var rec3 = xtend(minValidRecord, {
    level: 20,
    time: time0 + 3000,
})
var rec4 = xtend(rec1, {
    time: time0 + 4000,
});
var rec5 = xtend(rec2, {
    time: time0 + 5000,
})
var rec6 = xtend(rec3, {
    time: time0 + 6000,
})

var run;
tape('publish to local bunyan-hub (raw)', co.wrap(function * (test) {
    test.plan(3);
    run = utils.run();
    yield run.ready;
    sub = yield utils.connect(28692);
    sub.write('{"cmd":"subscribe"}\n');
    sub.ee.on('record', function (rec) {
        test.equal(rec.name, 'name');
    });
    yield utils.sleep(100);
    PubStream = require('../');
    pubStream = new PubStream({
        raw: true
    });
    pubStream.write(rec1);
    pubStream.write(rec2);
    pubStream.write(rec3);
    console.log(1);
}));

tape('publish to local bunyan-hub (json string)', co.wrap(function * (test) {
    console.log(2);
    test.plan(3);
    pubStream.end();
    sub.end();
    sub = yield utils.connect(28692);
    console.log(3);
    sub.write('{"cmd":"subscribe"}\n');
    sub.ee.on('record', function (rec) {
        test.equal(rec.name, 'name');
    });
    yield utils.sleep(100);
    console.log(4);
    pubStream = new PubStream();
    pubStream.write(JSON.stringify(rec4));
    pubStream.write(JSON.stringify(rec5));
    pubStream.write(JSON.stringify(rec6));
    console.log(5);
}));

tape('clean up', co.wrap(function * (test) {
    test.plan(1);
    sub.end();
    pubStream.end();
    run.stop(test);
}));
