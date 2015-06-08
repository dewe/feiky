/* global require, describe, it, before, after, beforeEach, afterEach */
'use strict';

var assert = require('chai').assert,
    request = require('request');

var savedLogLevel;

// NOTE: running tests with log level 'FATAL' to suppress logging during mock server tests.

describe('Mock server', function () {
    var server = require('../index.js')(),
        port = 8000,
        url = 'http://localhost:' + port;

    describe('simple route registration', function () {

        it('register route with default response status 200', function (done) {
            server.register('GET', '/');
            request.get(url, function (err, res) {
                assert.equal(res.statusCode, 200);
                done();
            });
        });

        it('register route with specified response status code', function (done) {
            server.register('GET', '/', 400);
            request.get(url, function (err, res) {
                assert.equal(res.statusCode, 400);
                done();
            });
        });

        it('register route with response body', function (done) {
            server.register('GET', '/', 200, 'my custom body');
            request.get(url, function (err, res, body) {
                assert.equal(body, 'my custom body');
                done();
            });
        });

        it('register route with handler', function (done) {
            server.register('GET', /.*/, function (req, res) {
                res.statusCode = 123;
            });
            request.get(url, function(err, res, body) {
                assert.equal(res.statusCode, 123);
                done();
            });
        });

    });

    describe('inspection features', function () {

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
                    assert.isArray(server.requestHistory());
                    assert.lengthOf(server.requestHistory(), 2);
                    done();
                });
            });
        });

    });

    describe('starting and stopping', function () {

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

    });

    describe('original handlers', function () {

        it('should return specified status code', function (done) {
            server.addHandler(function (req, res) { res.statusCode = 123; });

            request.get(url, function (err, res) {
                assert(res.statusCode === 123);
                done();
            });
        });

        it('should return specified body', function (done) {
            server.addHandler(function (req, res) { res.write('dummy body'); });

            request.get(url, function (err, res, body) {
                assert(res.body === 'dummy body');
                done();
            });
        });

        it('should return specified body with res.end()', function (done) {
            server.addHandler(function (req, res) { res.end('dummy body 2'); });

            request.get(url, function (err, res, body) {
                assert(res.body === 'dummy body 2');
                done();
            });
        });

        it('should provide incoming body as parameter to handler', function (done) {
            var received;
            server.addHandler(function (req, res, body) { received = body; });

            request.post({url: url, body: 'dummy post'}, function () {
                assert(received === 'dummy post');
                done();
            });
        });

        it('should call added handlers in order', function (done) {
            var first, second;
            server.addHandler(function (req, res) { res.end('first handler'); });
            server.addHandler(function (req, res) { res.end('second handler'); });

            request.get(url, function (err, res, body) {
                first = (body === 'first handler');
            });
            request.get(url, function (err, res, body) {
                second = (body === 'second handler');
            });

            setTimeout(function () { if (first && second) done(); }, 20); // jshint ignore:line
        });

        it('should replace handlers with setHandler', function (done) {
            server.addHandler(function (req, res) { res.end('first handler'); });
            server.setHandler(function (req, res) { res.end('second handler'); });

            request.get(url, function (err, res, body) {
                assert(body === 'second handler');
                done();
            });
        });
    });

    describe('error handling and misconfiguration', function () {

        it('should return 500 if no handlers', function (done) {
            server.clearHandlers();
            request.get(url, function (err, res, body) {
                assert(res.statusCode === 500);
                assert.include(body, 'Missing handler');
                done();
            });
        });

        it('should return 500 if handler throws error', function (done) {
            server.setHandler(function () { throw new Error('Dummy message: internal error'); });
            request.get(url, function (err, res, body) {
                assert(res.statusCode === 500);
                assert.include(body, 'Dummy message: internal error');
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

describe('Two mock servers', function () {
    var server_one = require('../index.js')(),
        server_two = require('../index.js')();

    before(function () {
        server_one.listen(8000);
        server_two.listen(8001);
    });

    after(function () {
        server_one.close();
        server_two.close();
    });

    it('should not share handlers', function (done) {
        server_one.addHandler(function (req, res) { res.end('handler one'); });
        server_two.addHandler(function (req, res) { res.end('handler two'); });

        // verify that server_two's handler is being used.
        request.get('http://localhost:8001', function (err, res, body) {
            assert(res.statusCode === 200);
            assert(body === 'handler two');
            done();
        });
    });

});