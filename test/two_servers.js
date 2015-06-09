/* global require, describe, it, before, after, beforeEach, afterEach */
'use strict';

var assert = require('chai').assert,
    request = require('request'),
    feiky = require('../index.js');

describe('Two fake servers', function () {

    describe('defaults', function () {
        var server_one = feiky(),
            server_two = feiky();

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

        beforeEach(function () {
            server_one.listen(8000);
            server_two.listen(8001);
        });

        afterEach(function () {
            server_one.close();
            server_two.close();
        });
    });

    describe('sharing request history', function () {
        var server_one, server_two;

        it('can use an injected recorder', function (done) {
            var sharedRecorder = require('last-request')();

            server_one = feiky({port: 8000, historyRecorder: sharedRecorder});
            server_two = feiky({port: 9000, historyRecorder: sharedRecorder});
            server_one.register('GET');
            server_two.register('GET');

            request.get('http://localhost:8000/foo', function (err, res) {
                assert.equal(res.statusCode, 200);
                request.get('http://localhost:9000/bar', function (err, res) {
                    assert.equal(res.statusCode, 200);
                    assert.lengthOf(sharedRecorder.requests(), 2);
                    assert.equal(sharedRecorder.requests()[0].path, '/foo');
                    assert.equal(sharedRecorder.lastRequest().path, '/bar');
                    done();
                });
            });
        });

        afterEach(function () {
            server_one.close();
            server_two.close();
        });

    });
});