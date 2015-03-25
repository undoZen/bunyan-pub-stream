# bunyan-pub-stream
`bunyan-pub-stream` is a writable stream write to [bunyan-hub](https://undozen.github.io/bunyan-hub), which is a centralized simple logging server for bunyan. It's a low level module you could use with bunyan logger, but you could use high level module [bunyan-hub-logger](https://github.com/undoZen/bunyan-hub-logger) instead.

## installation

```bash
npm install bunyan-pub-stream
```

## useage

```javascript
var bunyan = require('bunyan');
var PubStream = require('bunyan-pub-stream');
var pubStream = new PubStream();
var logger = bunyan.createLogger({
    name: 'session',
    app: 'example-app',
    streams: [{
        level: 'debug',
        stream: pubStream
    }]
});
// or use raw mode
var rawPubStream = new PubStream();
var rawLogger = bunyan.createLogger({
    name: 'session',
    app: 'example-app',
    streams: [{
        level: 'info',
        stream: rawPubStream
    }]
});
```

then you can use `logger.debug('...')` to log something into bunyan-hub, watch these log events using [bunyan-sub](https://github.com/undoZen/bunyan-sub) cli command or [bunyan-web](https://github.com/undoZen/bunyan-web) darshbord in browser.

## license
MIT
