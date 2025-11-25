'use strict';

var assert = require('chai').assert,
    feiky = require('../index.js');

describe('Two fake servers', function () {

    describe('defaults', function () {
        var server_one = feiky(),
            server_two = feiky();

        it('should not share handlers', async function () {
            server_one.register('GET', '/', 200, 'handler one');
            server_two.register('GET', '/', 200, 'handler two');

            var res = await fetch('http://localhost:8001');
            var body = await res.text();
            assert.equal(res.status, 200);
            assert.equal(body, 'handler two');
        });

        it('should not share request history', async function () {
            server_one.register('GET');
            server_two.register('GET');

            await fetch('http://localhost:8001');
            assert.isUndefined(server_one.lastRequest());
            assert.isDefined(server_two.lastRequest());
            assert.equal(server_two.lastRequest().method, 'GET');
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

        it('can use an injected recorder', async function () {
            var sharedRecorder = require('last-request')();

            server_one = feiky({port: 8000, historyRecorder: sharedRecorder});
            server_two = feiky({port: 9000, historyRecorder: sharedRecorder});
            server_one.register('GET');
            server_two.register('GET');

            var res1 = await fetch('http://localhost:8000/foo');
            assert.equal(res1.status, 200);
            var res2 = await fetch('http://localhost:9000/bar');
            assert.equal(res2.status, 200);
            assert.lengthOf(sharedRecorder.requests(), 2);
            assert.equal(sharedRecorder.requests()[0].path, '/foo');
            assert.equal(sharedRecorder.lastRequest().path, '/bar');
        });

        afterEach(function () {
            server_one.close();
            server_two.close();
        });

    });
});
