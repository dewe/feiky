/* global require, describe, it, before, after, beforeEach, afterEach */
'use strict';

var assert = require('chai').assert,
    request = require('request'),
    feiky = require('..'),
    lastRequest = require('last-request');

describe('Multiple recorders', function () {
    var recorder = lastRequest();
    var server = feiky({
        historyRecorder: recorder
    });

    it('records to internal historyRecorder', function (done) {
        request.get('http://localhost:8000', function (err, res) {
            assert(res.statusCode === 200);
            assert.equal(server.lastRequest().method, 'GET');
            done();
        });
    });

    it('records to extra historyRecorder', function (done) {
        request.get('http://localhost:8000', function () {
            assert.equal(recorder.lastRequest().method, 'GET');
            done();
        });
    });

    it('does not share requests objects between recorders', function(done){
        request.get('http://localhost:8000', function () {
            assert.notStrictEqual(recorder.requests(), server.requests());
            assert.notStrictEqual(recorder.lastRequest(), server.lastRequest());
            assert.deepEqual(recorder.lastRequest(), server.lastRequest());
            done();
        });
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
