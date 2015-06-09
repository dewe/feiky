'use strict';

var http = require('http'),
    util = require('util'),
    log4js = require('log4js'),
    lastRequest = require('last-request');

module.exports = function (options) {
    var isListening = false,
        handlers = [],
        internalRecorder = lastRequest(),
        recorders = [internalRecorder],
        port = typeof options === 'number' ? options : options && options.port,
        logger = getLogger();

    if (options && options.historyRecorder) {
        recorders.push(options.historyRecorder);
    }

    var httpServer = http.createServer(function (req, res) {
        var body = '';

        req.on('data', function (chunk) {
            body += chunk.toString();
        });

        req.on('end', function () {
            recorders.forEach(function (recorder) {recorder(req);});
            logger.debug('request', internalRecorder.lastRequest());

            try {
                var handler = nextHandler();
                logger.debug('Calling handler');
                handler(req, res, body);
                res.end();
            }
            catch (e) {
                logger.error(e.message);
                res.writeHead(500);
                res.write(util.format('Error: %s\n\nRequest: %j', e.message, internalRecorder.lastRequest()));
                res.end();
            }
        });
    });

    httpServer.on('listening', function (p) {
        isListening = true;
        port = p;
        logger = getLogger(port);
    });

    httpServer.on('close', function () {
        isListening = false;
    });

    if (port) {
        listen(port);
        logger.info('Listen immediately on port: %s', port);
    }

    return {
        addHandler: function (handler) {
            handlers.push(handler);
        },
        setHandler: function (handler) {
            handlers = [handler];
        },
        clearHandlers: function () {
            handlers = [];
        },
        register: registerRoute,
        listen: listen,
        close: close,
        lastRequest: internalRecorder.lastRequest,
        requestHistory: internalRecorder.requests
    };

    // todo: register route per path and method
    function registerRoute(method, path, statusCode, responseBody) {
        var handler;
        if (typeof statusCode === 'function') {
            handler = statusCode;
            logger.debug('register route %s %s -> handler: %s', method, path, handler);
        } else {
            statusCode = statusCode || 200;
            handler = function (req, res, body) {
                logger.debug('<- %s, "%s"', statusCode, responseBody);
                res.statusCode = statusCode;
                if (responseBody) {
                    res.write(responseBody);
                }
            };
            logger.debug('register route: %s %s -> %s, "%s"', method, path, statusCode, responseBody);
        }
        handlers.push(handler);
    }

    function listen(port, callback) {
        if (isListening) {
            throw new Error('Already listening');
        }
        internalRecorder.reset();
        handlers = [];
        httpServer.listen(port, callback);
    }


    function close(cb) {
        if (isListening) {
            httpServer.close(cb);
        } else if (cb) {
            cb();
        }
    }

    function nextHandler() {
        var handler = handlers.shift();
        if (!handler) {
            throw(new Error('Missing handler.'));
        }
        return handler;
    }

    function getLogger(port) {
        var loggerCategory = port ? 'feiky:' + port : 'feiky';
        var logLevel = process.env.LOG_LEVEL || 'ERROR';
        var logger = log4js.getLogger(loggerCategory);
        logger.setLevel(logLevel);
        return logger;
    }

};
