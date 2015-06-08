/* global require, describe, it, before, after, beforeEach, afterEach */
'use strict';

var assert = require('chai').assert,
    request = require('request');

describe('Two fake servers', function () {
    var server_one = require('../index.js')(),
        server_two = require('../index.js')();

    it('should not share handlers', function (done) {
        server_one.addHandler(function (req, res) { res.end('handler one'); });
        server_two.addHandler(function (req, res) { res.end('handler two'); });

        // verify that server_two's handler is being used.
        request.get('http://localhost:8001', function (err, res, body) {
            assert.equal(res.statusCode, 200);
            assert.equal(body, 'handler two');
            done();
        });
    });

    it('should not share request history', function (done) {
        server_one.register('GET');
        server_two.register('GET');

        request.get('http://localhost:8001', function () {
            assert.isUndefined(server_one.lastRequest());
            assert.isDefined(server_two.lastRequest());
            assert.equal(server_two.lastRequest().method, 'GET');
            done();
        });
    });

    before(function () {
        server_one.listen(8000);
        server_two.listen(8001);
    });

    after(function () {
        server_one.close();
        server_two.close();
    });
});