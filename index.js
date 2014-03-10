
/**
 * Module dependencies.
 */

var debug = require('debug')('octoqueue');
var url = require('url');

/**
 * Expose `Application`.
 */

module.exports = Octoqueue;

function Octoqueue() {
  if (!(this instanceof Octoqueue)) return new Octoqueue();
  this.requests = [];
};

/**
 * Queue request.
 * 
 * @param {Func} req
 * @return {Octoqueue}
 * @api public
 */

Octoqueue.prototype.queue = function(req) {
  var that = this;

  function next(err, wait) {
    setTimeout(function() {
      that.requests.shift();
      if (that.requests.length > 0) {
        that.request(that.requests[0].call(), next);
      }
    }, wait);
  }
  debug('queued a request');
  this.requests.push(req);
  if (this.requests.length === 1) {
    this.request(req(), next);
  }
  return this;
};

/**
 * Send queued request.
 * 
 * @return {Octoqueue}
 * @param {https.ClientRequest} req
 * @param {Function} cb
 * @api private
 */

Octoqueue.prototype.request = function(req, cb) {
  var that = this;
  debug('consuming a request to %s', url.resolve('https://' + req._headers['host'], req.path));
  req.on('response', function(res) {
    res.on('end', function() {
      var resetTime = parseInt(res.headers['x-ratelimit-reset'] * 1000, 10);
      var remaining = parseInt(res.headers['x-ratelimit-remaining'], 10);
      var wait = that.calcWaitTime(resetTime, remaining);
      debug('wait %sms for next request', wait);
      cb(null, wait);
    });
  });
  req.on('error', cb);
  return this;
};

/**
 * Calculate how long to wait.
 * 
 * @return {Number}
 * @param {Number} resetTime
 * @param {Number} remaining
 * @api private
 */

Octoqueue.prototype.calcWaitTime = function(resetTime, remaining) {
  var now = +new Date();
  if (!remaining) {
    return Math.max(Math.ceil(resetTime - now), 0);
  } else {
    return Math.max(Math.ceil((resetTime - now) / remaining), 0);
  }
};
