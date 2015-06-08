/* global require, describe, it, before, after, beforeEach, afterEach */
'use strict';

var assert = require('chai').assert,
    request = require('request');

var savedLogLevel;

// NOTE: running tests with log level 'FATAL' to suppress logging during mock server tests.

describe('Starting and stopping', function () {
    var server = require('../index.js')(),
        port = 8000,
        url = 'http://localhost:' + port;

    it('should clear request history when starting listening', function (done) {
        server.register('GET');
        request.get(url, function () { // ensure there's some history
            server.close(function () {     // restart server
                server.listen(port, function () {
                    assert.isUndefined(server.lastRequest());
                    done();
                });
            });
        });
    });

    it('should clear route handlers when starting listening', function (done) {
        server.register('GET');
        server.close(function () {     // restart server
            server.listen(port, function () {
                request.get(url, function (err, res, body) {
                    assert.equal(res.statusCode, 500);
                    assert.include(body, 'Missing handler');
                    done();
                });
            });
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