// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


const yaml = require('js-yaml');
const config = require('../config/redis');
const redis3 = require('../util/redis3');

const client = redis3(config.connectionUrl, {prefix: config.keyPrefix});

/**
 * Get the top K templates of range [offset, offset + count) by the given type.
 */
const top = function(type, offset, count, callback) {
  let typeUsedKey = config.getUsedKey(type);
  let lua = `
local prefix = "${config.keyPrefix}"
local selected = redis.call("ZREVRANGE", prefix.."${typeUsedKey}", ${offset}, ${count}, "WITHSCORES")
local name, count, version, content = "", 0, "", ""
local result = {}
for i = 1, table.getn(selected), 2 do
  name = selected[i]
  count = selected[i + 1]
  version = redis.call("HGET", prefix.."${config.headIndexKey}", name)
  content = redis.call("HGET", prefix.."${config.templateKeyPrefix}"..name, version)
  result[i] = content
  result[i + 1] = count
end
return result
`;
  console.log(lua);
  client.eval(lua, '0', function(err, res) {
    if (err) {
      callback(err, null);
    } else {
      let list = [];
      for (let i = 0; i < res.length; i += 2) {
        let item = yaml.safeLoad(res[i]);
        item.count = res[i + 1];
        list.push(item);
      }
      callback(null, list);
    }
  });
};

/**
 * Load a template.
 */
const load = function(name, version, callback) {
  client.hget(config.getTemplateKey(name), version, (err, res) => {
    if (err) {
      callback(err, null);
    } else {
      let template = yaml.safeLoad(res);
      if (res) {
        let usedKey = config.getUsedKey(template.job ? 'job' : template.type)
        client.zincrby(usedKey, 1, name);
      }
      callback(null, template);
    }
  });
};

/**
 * Save the template.
 * The second element in the callback argument list means whether <name, version> duplicates.
 */
const save = function(template, callback) {
  let name = null;
  let version = null;
  if (template.job) {
    usedKey = config.getUsedKey('job');
    name = template.job.name;
    version = template.job.version;
  } else {
    usedKey = config.getUsedKey(template.type);
    name = template.name;
    version = template.version;
  }
  client.hsetnx(config.getTemplateKey(name), version, JSON.stringify(template), (err, num) => {
    if (err) {
      callback(err, null);
    } else {
      if (num == 0) {
        // The key is duplicated
        callback(null, true);
      } else {
        client.hset(config.headIndexKey, name, version, (err, num) => {
          if (err) {
            callback(err, null);
          } else {
            client.zadd(usedKey, 'NX', 0, name);
            callback(null, false);
          }
        });
      }
    }
  });
};

module.exports = {top, load, save};
