# octoqueue

Octoqueue is a simple Github API queue for keeping your request pace with [rate limiting](http://developer.github.com/v3/#rate-limiting).

## Installation

```
$ npm install octoqueue
```

## Usage

```javascript
var https = require('https');
  
var q = new Octoqueue();
  
// just wrap your request in a function which returns `https.ClientRequest` object.
q.queue(function() {
  var req = https.request({ ... });
  req.on('response', function() {
    ...
  });
  req.end();
  return req;
});
```

## License

MIT
