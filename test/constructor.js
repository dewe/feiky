'use strict';

var assert = require('chai').assert,
    feiky = require('..');

describe('Constructor', function () {
    var server;

    it('accepts port number, starts immediately', async function () {
        server = feiky(12345);
        server.register('GET');
        var res = await fetch('http://localhost:12345');
        assert(res.status === 200);
    });

    it('accepts options with port, starts immediately', async function () {
        server = feiky({
            port: 54321
        });
        server.register('GET');
        var res = await fetch('http://localhost:54321');
        assert(res.status === 200);
    });

    it('accepts options without port', async function () {
        server = feiky({});
        try {
            await fetch('http://localhost:54321');
            assert.fail('should have thrown');
        } catch (err) {
            assert.isDefined(err);
        }
    });

    it('accepts extra historyRecorder', async function () {
        var recorder = require('last-request')();
        server = feiky({
            port: 4711,
            historyRecorder: recorder
        });
        server.register('GET');
        var res = await fetch('http://localhost:4711');
        assert(res.status === 200);
        assert.equal(recorder.lastRequest().method, 'GET');
    });

    afterEach(function (done) {
        server.close(done);
    });

});
