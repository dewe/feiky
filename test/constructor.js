/* global require, describe, it, before, after, beforeEach, afterEach */
'use strict';

var assert = require('chai').assert,
    request = require('request'),
    feiky = require('..');

describe('Constructor', function () {
    var server;

    it('accepts port number, starts immediately', function (done) {
        server = feiky(12345);
        server.register('GET');
        request.get('http://localhost:12345', function (err, res) {
            assert(res.statusCode === 200);
            done();
        });
    });

    it('accepts options with port, starts immediately', function (done) {
        server = feiky({
            port: 54321
        });
        server.register('GET');
        request.get('http://localhost:54321', function (err, res) {
            assert(res.statusCode === 200);
            done();
        });
    });

    it('accepts options without port', function (done) {
        server = feiky({});
        request.get('http://localhost:54321', function (err, res) {
            assert.isDefined(err);
            done();
        });
    });

    it('accepts injected historyRecorder', function (done) {
        var recorder = require('last-request')();
        server = feiky({
            port: 4711,
            historyRecorder: recorder
        });
        server.register('GET');
        request.get('http://localhost:4711', function (err, res) {
            assert(res.statusCode === 200);
            assert.equal(recorder.lastRequest().method, 'GET');
            done();
        });
    });

    afterEach(function (done) {
        server.close(done);
    });

});
