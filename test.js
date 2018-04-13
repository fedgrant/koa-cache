const cache = require('./index.js');
const app = new (require('koa'))();
const assert = require('assert');
const sinon = require('sinon');

describe('Testing Caching Middleware', function() {
  class Store {
    constructor() {
      this.store = {}
    }
    get(key) {
      this.store[key];
    }
    set(key, value) {
      this.store[key] = value;
    }
  };
  
  describe('Cache throws issues if the store is missing needed functions', function() {
    it('passed store is missing "get"', function() {
      let store = {};
      let httpHeaders = [];

      assert.throws(() => {
        return cache(httpHeaders, store);
      }, /^Error: store is missing a "get" property$/);
    });

    it('passed store "get" property is not a function', function() {
      let store = { 
        get: 'a' 
      };
      let httpHeaders = [];

      assert.throws(() => {
        return cache(httpHeaders, store);
      }, /^Error: \"get\" property on store is not a function$/);
    });

    it('passed store is missing "set"', function() {
      let store = { 
        get: function(){}
      };
      let httpHeaders = [];

      assert.throws(() => {
        return cache(httpHeaders, store);
      }, /^Error: store missing "set" property$/);
    });

    it('passed store "set" property is not a function', function() {
      let store = { 
        get: function(){}, 
        set: 'a'
      };
      let httpHeaders = [];
      
      assert.throws(() => {
        return cache(httpHeaders, store);
      }, /^Error: \"set\" property on store is not a function$/);
    });
  })

});