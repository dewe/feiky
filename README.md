# feiky
[![Build Status](https://travis-ci.org/dewe/feiky.svg)](https://travis-ci.org/dewe/feiky)

Simple node fake http server, useful for testing end-to-end request across process boundaries.

```javascript
var feiky = require('feiky'),
    server = feiky(8000);

...

// In test setup, tell feiky how to behave when call comes in
server.register('GET', /.*/, 200, "funky stuff");

...

// In test method, make a request to another server/proxy that 
// has this feiky instance as backend/upstream
request.get('http://localhost:4711/foo/bar', function (err, res) {
    assert.equal(res.statusCode, 200);
    assert.equal(server.lastRequest().path, '/foo/bar');
    done();
});
```