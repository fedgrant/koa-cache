const redis = require('redis');
const { promisify } = require('util');
const possibleRedisConfigOptions = [
  'host', 'port', 'path', 'url', 'parser', 'string_numbers', 
  'return_buffers', 'detect_buffers', 'socket_keepalive', 
  'no_ready_check', 'enable_offline_queue', 'retry_max_delay', 
  'connect_timeout', 'max_attempts', 'retry_unfulfilled_commands', 
  'password', 'db', 'family', 'disable_resubscribing', 
  'rename_commands', 'tls', 'prefix', 'retry_strategy'
  ];

/**
 * @param {*} config redis configuration object
 * @param {*} httpHeaders array of headers names 
 * @returns {middleware} returns koa middleware instance 
 */
module.exports = function Cache(config, httpHeaders) {
  config = config ? config : {};
  httpHeaders = httpHeaders ? httpHeaders : [];
  let configKeys = Object.keys(config);

  for (let i = 0; i < configKeys.length; i++) {
    if (possibleRedisConfigOptions.indexOf(configKeys[i]) < 0) {
      throw new Error('Property "' + configKeys[i] + '" not valid Redis configuration property. See https://github.com/NodeRedis/node_redis#rediscreateclient for possible configuration properties');
    }
  }

  let client = redis.createClient(config);
  client.on("error", function (err) {
      console.log("Error " + err);
  });

  const getAsync = promisify(client.get).bind(client);
  const setAsync = promisify(client.set).bind(client);

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
      let value = await getAsync(url + '|' + headerString)

      if (value === null) {
        await next();
        let headerString = createHeaderString(httpHeaders);
        let body = handlePossibleJson(ctx.body, false, ctx);
        let returned = await setAsync(url + '|' + headerString, body);
        ctx.redisCache = returned === 'OK' ? 'CREATED' : 'FAILED';
      } else {
        ctx.redisCache = 'FETECHED';
        ctx.body = handlePossibleJson(value, true, ctx);
      }

    } catch (e) {
      throw(e);
    }
    
  }
}