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
    let ctx;

    beforeEach(function() {
      ctx = {
        url: '/',
        method: 'GET',
        is: function(...args) {
          for (let i in args) {
            if (ctx.type === args[i]) {
              return true;
            }
          }
          return false;
        },
        contentType: 'value'
      };
    })

    it('Cache ignores non GET request ', async function() {
      ctx = {
        url: '/',
        method: 'POST'
      }
      let cache = new Cache([], new Store())
      await cache(ctx, async () => {});
      assert.equal(undefined, ctx.fromCache);
    });

    it('Cache retrieves string value from store', async function() {
      let store = new Store();
      store.set('/|', 'test');

      let cache = new Cache([], store);    
      await cache(ctx, async () => {})
      assert.equal('FETECHED', ctx.fromCache);
      assert.equal('test', ctx.body);
    });

    it('Cache retrieves json value from store', async function() {
      let store = new Store();
      store.set('/|', {test: 'test'});

      let cache = new Cache([], store);    
      await cache(ctx, async () => {})
      assert.equal('FETECHED', ctx.fromCache);
      assert.deepEqual({test:'test'}, ctx.body);
    });

    it('Cache doesnt have value, waits for returned body and stores the string value', async function() {
      let store = new Store();
      let cache = new Cache([], store);
      await cache(ctx, async () => {
        ctx.body = 'hello test';
      });
      assert.equal('CREATED', ctx.fromCache);
      assert.equal('hello test', ctx.body);
    });

    it('Cache doesnt have value, waits for returned body and stores the json value', async function() {
      let store = new Store();
      let cache = new Cache([], store);
      await cache(ctx, async () => {
        ctx.body = {test:'hello test'};
        ctx.type = 'json'

      });
      assert.equal('CREATED', ctx.fromCache);
      assert.deepEqual({test:'hello test'}, ctx.body);
    });

  });
});