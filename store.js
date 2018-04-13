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

module.exports = function (config) {
  config = config ? config : {};
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

  return {
    get: getAsync,
    set: async function(key, value) {
      let valueSet = await setAsync(key, value);
      return valueSet === 'OK' ? true : false;
    }
  }
}