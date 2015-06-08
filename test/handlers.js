/* global require, describe, it, before, after, beforeEach, afterEach */
'use strict';

var assert = require('chai').assert,
    request = require('request');

describe('Handlers (deprecated)', function () {
    var server = require('../index.js')(),
        port = 8000,
        url = 'http://localhost:' + port;

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

    beforeEach(function (done) {
        server.listen(port, done);
    });

    afterEach(function (done) {
        server.close(done);
    });
});
