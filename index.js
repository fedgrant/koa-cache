let DefaultStore = require('./store');

/**
 * @param {*} config redis configuration object
 * @param {*} httpHeaders array of headers names 
 * @returns {middleware} returns koa middleware instance 
 */
module.exports = function Cache(httpHeaders, store, config) {
  httpHeaders = httpHeaders ? httpHeaders : [];
  store = store ? store : new DefaultStore(config);
  let msg = '';

  if (!store.get) {
    msg = 'store is missing a "get" property';

  } else if (typeof store.get !== 'function') {
    msg = '"get" property on store is not a function';

  } else if (!store.set) {
    msg = 'store missing "set" property';

  } else if (typeof store.set !== 'function') {
    msg = '"set" property on store is not a function';
  }

  if (msg) {
    throw new Error(msg);
  }

  function createHeaderString(httpHeaders) {
    return httpHeaders.reduce((strAcc, header) => {
      return strAcc + ctx.header[header] + '|'
    }, '');
  }

  function handlePossibleJson(value, shouldParse, ctx) {
    if (ctx.is('json', 'application/json') === null) {
      return value;
    } else {
      if (shouldParse) {
        return JSON.parse(value);
      } else {
        return JSON.stringify(value);
      }
    }
  }

  return async function(ctx, next) {
    if (ctx.method !== 'GET') {
      next();
    }

    let url = ctx.url;
    let headerString = createHeaderString(httpHeaders);

    try {
      let value = await store.get(url + '|' + headerString)

      if (value === null) {
        await next();
        let headerString = createHeaderString(httpHeaders);
        let body = handlePossibleJson(ctx.body, false, ctx);
        let returned = await store.set(url + '|' + headerString, body);
        ctx.fromCache = returned ? 'CREATED' : 'FAILED';
      } else {
        ctx.fromCache = 'FETECHED';
        ctx.body = handlePossibleJson(value, true, ctx);
      }

    } catch (e) {
      throw(e);
    }
    
  }
}