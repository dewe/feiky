'use strict';

var assert = require('chai').assert;

var savedLogLevel;

describe('Starting and stopping', function () {
    var server = require('../index.js')(),
        port = 8000,
        url = 'http://localhost:' + port;

    it('should clear request history when starting listening', async function () {
        server.register('GET');
        await fetch(url);
        await new Promise(resolve => server.close(resolve));
        await new Promise(resolve => server.listen(port, resolve));
        assert.isUndefined(server.lastRequest());
    });

    it('should clear route handlers when starting listening', async function () {
        server.register('GET');
        await new Promise(resolve => server.close(resolve));
        await new Promise(resolve => server.listen(port, resolve));
        var res = await fetch(url);
        var body = await res.text();
        assert.equal(res.status, 500);
        assert.include(body, 'Missing handler');
    });

    it('throws if listen() is called while listening', function () {
        assert.throw(function () {
            server.listen(1234);
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
