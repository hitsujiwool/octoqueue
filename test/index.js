
var assert = require('assert');
var nock = require('nock');
var https = require('https');
var sinon = require('sinon');

var Octoqueue = require('..');

function mockApi(resetTime, remaining) {
  return nock('https://api.github.com')
    .defaultReplyHeaders({
      'X-Ratelimit-Reset': Math.round(resetTime / 1000).toString(),
      'X-Ratelimit-Remaining': remaining.toString()
    })
    .get('/users/hitsujiwool')
    .times(1)
    .reply(200);
};

function genReq() {
  var req = https.request({
    hostname: 'api.github.com',
    path: '/users/hitsujiwool'
  });
  req.end();
  return req;
};

describe('octoqueue', function() {
  var q;
  
  beforeEach(function() {
    q = new Octoqueue();
  });

  describe('Octoqueue()', function() {
    it('should return Octoqueue instance', function() {
      assert(Octoqueue() instanceof Octoqueue);
    });
  });

  describe('Octoqueue.queue()', function() {
    it('should not start request if there are some requests in the queue', function() {
      var spy = sinon.spy(q, 'request');
      q.queue(genReq);
      q.queue(genReq);
      assert(spy.calledOnce);
      q.request.restore();
    });

    it('should start request immidiately if the queue is empty', function() {
      var spy = sinon.spy(q, 'request');
      q.queue(genReq);
      assert(spy.calledOnce);
      q.request.restore();
    });    
  });

  describe('Octoqueue.request(req, cb)', function() {
    afterEach(function() {
      nock.cleanAll();
    });

    it('should execute callback', function(done) {
      mockApi(+new Date(), 10);
      q.request(genReq(), done);
    });

    it('should execute callback with zero wait time', function(done) {
      mockApi(+new Date(), 10000);
      q.request(genReq(), function(err, time) {
        assert.equal(time, 0);
        done();
      });
    });
  });

  describe('Octoqueue.calcWaitTime(resetTime, remaining)', function() {
    it('should return the resetTime itself if the remaining is zero', function() {
      var wait = q.calcWaitTime(+new Date() + 1000, 0);
      assert(wait, 1000);
    });
  });
});
