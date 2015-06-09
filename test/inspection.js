/* global require, describe, it, before, after, beforeEach, afterEach */
'use strict';

var assert = require('chai').assert,
    request = require('request');

var savedLogLevel;

// NOTE: running tests with log level 'FATAL' to suppress logging during mock server tests.

describe('Inspection features', function () {
    var server = require('../index.js')(),
        port = 8000,
        url = 'http://localhost:' + port;

    it('should expose last request for inspection', function (done) {
        var path = '/path1/path2?name=X&address=Y';
        var headers = {'X-My-Custom-Header': 'dummy'};
        server.register('GET');
        request.get(url + path, {headers: headers}, function (err, res) {
            assert.equal(res.statusCode, 200);
            assert.equal(server.lastRequest().method, 'GET');
            assert.equal(server.lastRequest().path, path);
            assert.equal(server.lastRequest().pathname, '/path1/path2');
            assert.deepEqual(server.lastRequest().query, {name: 'X', address: 'Y'});
            assert.deepProperty(server.lastRequest().headers, 'x-my-custom-header');
            done();
        });
    });

    it('should return undefined last request if server was never called', function () {
        assert.isUndefined(server.lastRequest());
    });

    it('should save request history even if there is no matching handler', function (done) {
        // no route registered
        request.get(url, function (err, res, body) {
            assert.equal(res.statusCode, 500);
            assert.include(body, 'Missing handler');
            assert.isDefined(server.lastRequest());
            done();
        });
    });

    it('should save request history before handler is called', function (done) {
        var lastRequest;
        server.setHandler(function () {
            lastRequest = server.lastRequest();

        });
        request.get(url, function () {
            assert.isDefined(lastRequest);
            done();
        });
    });

    it('should expose request history', function (done) {
        server.register('GET');
        request.get(url, function () {
            server.register('GET');
            request.get(url, function () {
                assert.isArray(server.requests());
                assert.lengthOf(server.requests(), 2);
                done();
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

