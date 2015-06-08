/* global require, describe, it, before, after, beforeEach, afterEach */
'use strict';

var assert = require('chai').assert,
    request = require('request');

describe('Simple routes', function () {
    var server = require('../index.js')(),
        port = 8000,
        url = 'http://localhost:' + port;

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
        request.get(url, function (err, res, body) {
            assert.equal(res.statusCode, 123);
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

