'use strict';

var assert = require('chai').assert,
    feiky = require('..'),
    lastRequest = require('last-request');

describe('Multiple recorders', function () {
    var recorder = lastRequest();
    var server = feiky({
        historyRecorder: recorder
    });

    it('records to internal historyRecorder', async function () {
        var res = await fetch('http://localhost:8000');
        assert(res.status === 200);
        assert.equal(server.lastRequest().method, 'GET');
    });

    it('records to extra historyRecorder', async function () {
        await fetch('http://localhost:8000');
        assert.equal(recorder.lastRequest().method, 'GET');
    });

    it('does not share requests objects between recorders', async function () {
        await fetch('http://localhost:8000');
        assert.notStrictEqual(recorder.requests(), server.requests());
        assert.notStrictEqual(recorder.lastRequest(), server.lastRequest());
        assert.deepEqual(recorder.lastRequest(), server.lastRequest());
    });

    beforeEach(function (done) {
        server.listen('8000');
        server.register('GET');
        done();
    });

    afterEach(function (done) {
        server.close(done);
    });

});
