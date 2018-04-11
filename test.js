const cache = require('./index.js');
const app = new (require('koa'))();
const assert = require('assert');
const sinon = require('sinon');

describe('Testing Caching Middleware', function() {
  it("Catch invalid configuration property passed to redis configuration", function() {
    assert.throws(() => {
      return cache({'not_valid': true}, [])
    });
  })

  it("Cache doesn't have value saved", function() {
    
  })
});