/* global require, describe, it, before, after, beforeEach, afterEach */
'use strict';

var assert = require('chai').assert,
    request = require('request');

var savedLogLevel;

// NOTE: running tests with log level 'FATAL' to suppress logging during mock server tests.

describe('Error handling and misconfiguration', function () {
    var server = require('../index.js')(),
        port = 8000,
        url = 'http://localhost:' + port;

    it('should return 500 if no handlers', function (done) {
        request.get(url, function (err, res, body) {
            assert(res.statusCode === 500);
            assert.include(body, 'Missing handler');
            done();
        });
    });

    it('should return 500 if handler throws error', function (done) {
        server.register('GET', '/', function () { throw new Error('Dummy message: internal error'); });
        request.get(url, function (err, res, body) {
            assert(res.statusCode === 500);
            assert.include(body, 'Dummy message: internal error');
            done();
        });
    });

    before(function () {
        savedLogLevel = process.env.LOG_LEVEL;
        process.env.LOG_LEVEL = 'FATAL';
    });

    after(function () {
        process.env.LOG_LEVEL = savedLogLevel;
    });

    beforeEach(function (done) {
        server.listen(port, done);
    });

    afterEach(function (done) {
        server.close(done);
    });
});
