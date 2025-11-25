'use strict';

var assert = require('chai').assert;

describe('Simple routes', function () {
    var server = require('../index.js')(),
        port = 8000,
        url = 'http://localhost:' + port;

    it('register route with default response status 200', async function () {
        server.register('GET', '/');
        var res = await fetch(url);
        assert.equal(res.status, 200);
    });

    it('register route with specified response status code', async function () {
        server.register('GET', '/', 400);
        var res = await fetch(url);
        assert.equal(res.status, 400);
    });

    it('register route with response body', async function () {
        server.register('GET', '/', 200, 'my custom body');
        var res = await fetch(url);
        var body = await res.text();
        assert.equal(body, 'my custom body');
    });

    it('register route with handler', async function () {
        server.register('GET', /.*/, function (req, res) {
            res.statusCode = 201;
        });
        var res = await fetch(url);
        assert.equal(res.status, 201);
    });

    beforeEach(function (done) {
        server.listen(port, done);
    });

    afterEach(function (done) {
        server.close(done);
    });
});
