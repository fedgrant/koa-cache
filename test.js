const Cache = require('./index.js');
const app = new (require('koa'))();
const assert = require('assert');
const sinon = require('sinon');

describe('Testing Caching Middleware', function() {
  
  describe('Cache throws issues if the store is missing needed functions', function() {
    it('passed store is missing "get"', function() {
      let store = {};
      let httpHeaders = [];

      assert.throws(() => {
        return Cache(httpHeaders, store);
      }, /^Error: store is missing a "get" property$/);
    });

    it('passed store "get" property is not a function', function() {
      let store = { 
        get: 'a' 
      };
      let httpHeaders = [];

      assert.throws(() => {
        return Cache(httpHeaders, store);
      }, /^Error: \"get\" property on store is not a function$/);
    });

    it('passed store is missing "set"', function() {
      let store = { 
        get: function(){}
      };
      let httpHeaders = [];

      assert.throws(() => {
        return Cache(httpHeaders, store);
      }, /^Error: store missing "set" property$/);
    });

    it('passed store "set" property is not a function', function() {
      let store = { 
        get: function(){}, 
        set: 'a'
      };
      let httpHeaders = [];
      
      assert.throws(() => {
        return Cache(httpHeaders, store);
      }, /^Error: \"set\" property on store is not a function$/);
    });
  });

  class Store {
    constructor() {
      this.store = {}
    }
    get(key) {
      return this.store[key] ? this.store[key] : null;
    }
    set(key, value) {
      this.store[key] = value
      return true;
    }
  };

  describe('Cache properly stores and retrives values', function() {
  
    it('Cache ignores non GET request ', async function() {
      let ctx = {
        url: '/',
        method: 'POST'
      }

      var cache = new Cache([], new Store())

      await cache(ctx, async () => {});
      assert.equal(undefined, ctx.fromCache);
    });

    it('Cache retrieves non json value from store', async function() {
      let ctx = {
        url: '/',
        method: 'GET',
        is: function(...args) {
          for (var i in args) {
            if (ctx.contentType === args[i]) {
              return true;
            }
          }
          return false;
        },
        contentType: 'value'
      };

      let store = new Store();
      store.set('/|', 'test');

      var cache = new Cache([], store);    
      await cache(ctx, async () => {})
      assert.equal('FETECHED', ctx.fromCache);
      assert.equal('test', ctx.body);
    });

    it('Cache retrieves json value from store', async function() {
      let ctx = {
        url: '/',
        method: 'GET',
        is: function(...args) {
          for (var i in args) {
            if (ctx.contentType === args[i]) {
              return true;
            }
          }
          return false;
        },
        contentType: 'value'
      };

      let store = new Store();
      store.set('/|', {test: 'test'});

      var cache = new Cache([], store);    
      await cache(ctx, async () => {})
      assert.equal('FETECHED', ctx.fromCache);
      assert.deepEqual({test:'test'}, ctx.body);
    });

  });
});