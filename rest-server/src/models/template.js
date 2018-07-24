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


const config = require('../config/redis');
const redis3 = require('../util/redis3');

const client = redis3(config.connectionUrl);

const filter = function(query, callback) {
  let lua = `
local result = {}

local function filter(ttype, terms)
  local list = redis.call("ZRANGE", "marketplace:"..ttype..".used", 0, -1, "WITHSCORES")
  local name, count, version, content, template = "", 0, "", "", nil
  for i = 1, table.getn(list), 2 do
    name = list[i]
    count = list[i + 1]
    version = redis.call("HGET", "marketplace:"..ttype..".index", name)
    content = redis.call("HGET", "marketplace:template:"..ttype.."."..name, version)
    template = cjson.decode(content)
    if (template["job"] ~= nil) then
      template = template["job"]
    end
    for id, token in ipairs(terms) do
      if (string.find(name, token) or string.find(template["description"], token)) then
        table.insert(result, content)
        table.insert(result, count)
        break
      end
    end
  end
end

local query = "${query}"
if string.len(query) > 0 then
  if string.len(query) > 100 then
    query = string.sub(query, 1, 100)
  end
    local tofind = {}
    for token in string.gmatch(query, "%a+") do
       table.insert(tofind, token)
    end
    local targets = {"job", "data", "script", "dockerimage"}
    for key, value in ipairs(targets) do
      filter(value, tofind)
    end
end
return result
`;
  client.eval(lua, 0, function(err, res) {
    if (err) {
      callback(err, null);
    } else {
      let list = [];
      for (let i = 0; i < res.length; i += 2) {
        if (res[i]) {
          let item = JSON.parse(res[i]);
          if (item.job) {
            item.type = item.job.type;
            item.name = item.job.name;
            item.version = item.job.version;
            item.description = item.job.description;
          }
          item.count = res[i + 1];
          list.push(item);
        }
      }
      callback(null, list);
    }
  });
};

/**
 * Get the top K templates of range [offset, offset + count) by the given type.
 */
const top = function(type, offset, count, callback) {
  let typeUsedKey = config.getUsedKey(type);
  let typeIndexKey = config.getIndexKey(type);
  let templatePrefix = config.getTemplateKeyPrefix(type);
  let lua = `
local selected = redis.call("ZREVRANGE", "${typeUsedKey}", ${offset}, ${count}, "WITHSCORES")
local name, count, version, content = "", 0, "", ""
local result = {}
for i = 1, table.getn(selected), 2 do
  name = selected[i]
  count = selected[i + 1]
  version = redis.call("HGET", "${typeIndexKey}", name)
  content = redis.call("HGET", "${templatePrefix}"..name, version)
  result[i] = content
  result[i + 1] = count
end
return result
`;
  client.eval(lua, 0, function(err, res) {
    if (err) {
      callback(err, null);
    } else {
      let list = [];
      for (let i = 0; i < res.length; i += 2) {
        if (res[i]) {
          let item = JSON.parse(res[i]);
          if (type == 'job') {
            item.type = item.job.type;
            item.name = item.job.name;
            item.version = item.job.version;
            item.description = item.job.description;
          }
          item.count = res[i + 1];
          list.push(item);
        }
      }
      callback(null, list);
    }
  });
};

/**
 * Load a template.
 */
const load = function(type, name, version, callback) {
  client.hget(config.getTemplateKey(type, name), version, (err, res) => {
    if (err) {
      callback(err, null);
    } else {
      let template = JSON.parse(res);
      if (res) {
        let usedKey = config.getUsedKey(template.job ? 'job' : template.type);
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
  let usedKey = null;
  let name = null;
  let version = null;
  let type = null;
  if (template.job) {
    usedKey = config.getUsedKey('job');
    name = template.job.name;
    version = template.job.version;
    type = 'job';
  } else {
    usedKey = config.getUsedKey(template.type);
    name = template.name;
    version = template.version;
    type = template.type;
  }
  client.hsetnx(config.getTemplateKey(type, name), version, JSON.stringify(template), (err, num) => {
    if (err) {
      callback(err, null);
    } else {
      if (num == 0) {
        // The key is duplicated
        callback(null, true);
      } else {
        client.hset(config.getIndexKey(type), name, version, (err, num) => {
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

module.exports = {filter, top, load, save};
