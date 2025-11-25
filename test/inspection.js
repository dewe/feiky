"use strict";

var assert = require("chai").assert;

var savedLogLevel;

describe("Inspection features", function () {
  var server = require("../index.js")(),
    port = 8000,
    url = "http://localhost:" + port;

  it("should expose last request for inspection", async function () {
    var path = "/path1/path2?name=X&address=Y";
    var headers = { "X-My-Custom-Header": "dummy" };
    server.register("GET");
    var res = await fetch(url + path, { headers: headers });
    assert.equal(res.status, 200);
    assert.equal(server.lastRequest().method, "GET");
    assert.equal(server.lastRequest().path, path);
    assert.equal(server.lastRequest().pathname, "/path1/path2");
    assert.deepEqual(server.lastRequest().query, { name: "X", address: "Y" });
    assert.deepProperty(server.lastRequest().headers, "x-my-custom-header");
  });

  it("should return undefined last request if server was never called", function () {
    assert.isUndefined(server.lastRequest());
  });

  it("should save request history even if there is no matching handler", async function () {
    var res = await fetch(url);
    var body = await res.text();
    assert.equal(res.status, 500);
    assert.include(body, "Missing handler");
    assert.isDefined(server.lastRequest());
  });

  it("should save request history before handler is called", async function () {
    var lastRequest;
    server.register("GET", "/", function () {
      lastRequest = server.lastRequest();
    });
    await fetch(url);
    assert.isDefined(lastRequest);
  });

  it("should expose request history", async function () {
    server.register("GET");
    await fetch(url);
    server.register("GET");
    await fetch(url);
    assert.isArray(server.requests());
    assert.lengthOf(server.requests(), 2);
  });

  before(function () {
    savedLogLevel = process.env.LOG_LEVEL;
    process.env.LOG_LEVEL = "FATAL";
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
