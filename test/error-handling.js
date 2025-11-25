'use strict';

var assert = require('chai').assert;

var savedLogLevel;

describe('Error handling and misconfiguration', function () {
    var server = require('../index.js')(),
        port = 8000,
        url = 'http://localhost:' + port;

    it('should return 500 if no handlers', async function () {
        var res = await fetch(url);
        var body = await res.text();
        assert(res.status === 500);
        assert.include(body, 'Missing handler');
    });

    it('should return 500 if handler throws error', async function () {
        server.register('GET', '/', function () { throw new Error('Dummy message: internal error'); });
        var res = await fetch(url);
        var body = await res.text();
        assert(res.status === 500);
        assert.include(body, 'Dummy message: internal error');
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
